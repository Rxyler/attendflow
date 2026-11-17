package com.attendflow.service.impl;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatJustificatif;
import com.attendflow.model.enums.Role;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.JustificatifRepository;
import com.attendflow.service.NotificationService;
import com.attendflow.repository.PresenceRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.JustificatifService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class JustificatifServiceImpl implements JustificatifService {

    private static final Set<String> FORMATS = Set.of("pdf", "png", "jpg", "jpeg");

    private final JustificatifRepository justificatifs;
    private final PresenceRepository presences;
    private final UtilisateurRepository utilisateurs;
    private final NotificationService notifications;
    private final StockageFichiers stockage;
    private final Path dossier;

    public JustificatifServiceImpl(JustificatifRepository justificatifs, PresenceRepository presences,
                                   UtilisateurRepository utilisateurs, NotificationService notifications,
                                   StockageFichiers stockage, @Value("${attendflow.uploads.dir}") String dossier) {
        this.justificatifs = justificatifs;
        this.presences = presences;
        this.utilisateurs = utilisateurs;
        this.notifications = notifications;
        this.stockage = stockage;
        this.dossier = Paths.get(dossier).toAbsolutePath().normalize();
    }

    @Override
    public Justificatif deposer(Etudiant etudiant, Long presenceId, String motif, MultipartFile fichier) {
        Presence presence = presences.findById(presenceId)
                .filter(p -> p.getEtudiant().getId().equals(etudiant.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Absence introuvable."));
        if (presence.getStatut() != StatutPresence.ABSENT) {
            throw new IllegalArgumentException("Seule une absence peut être justifiée.");
        }
        if (motif == null || motif.isBlank() || motif.length() > 500) {
            throw new IllegalArgumentException("Le motif est obligatoire (500 caractères maximum).");
        }
        Justificatif existant = presence.getJustificatif();
        if (existant != null && existant.getEtat() != EtatJustificatif.REFUSE) {
            throw new IllegalStateException("Un justificatif est déjà en attente ou accepté pour cette absence.");
        }

        String nomFichier = stockage.enregistrer(fichier, dossier, FORMATS, "PDF, PNG ou JPG");
        Justificatif j;
        if (existant != null) {   // remplace un justificatif refuse
            stockage.supprimer(dossier, existant.getFichier());
            j = existant;
            j.setFichier(nomFichier);
            j.setMotif(motif.trim());
            j.setEtat(EtatJustificatif.EN_ATTENTE);
            j.setDateDepot(LocalDateTime.now());
            j.setDateTraitement(null);
            j.setTraitePar(null);
        } else {
            j = justificatifs.save(new Justificatif(presence, nomFichier, motif.trim()));
            presence.setJustificatif(j);
        }
        for (Utilisateur admin : utilisateurs.findByRole(Role.ADMIN)) {
            notifications.notifier(new Notification(admin, TypeNotification.INFORMATION, "Nouveau justificatif",
                    etudiant.getNomComplet() + " a déposé un justificatif en attente de validation."));
        }
        return j;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Justificatif> mesJustificatifs(Etudiant etudiant) {
        return justificatifs.findByPresenceEtudiantOrderByDateDepotDesc(etudiant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Justificatif> enAttente() {
        return justificatifs.findByEtatOrderByDateDepotAsc(EtatJustificatif.EN_ATTENTE);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Justificatif> traitesRecemment() {
        return justificatifs.findTop20ByEtatNotOrderByDateTraitementDesc(EtatJustificatif.EN_ATTENTE);
    }

    @Override
    public void traiter(Admin admin, Long justificatifId, boolean accepte) {
        Justificatif j = justificatifs.findWithPresenceById(justificatifId)
                .orElseThrow(() -> new IllegalArgumentException("Justificatif introuvable."));
        if (j.getEtat() != EtatJustificatif.EN_ATTENTE) {
            throw new IllegalStateException("Ce justificatif a déjà été traité.");
        }
        j.setEtat(accepte ? EtatJustificatif.ACCEPTE : EtatJustificatif.REFUSE);
        j.setDateTraitement(LocalDateTime.now());
        j.setTraitePar(admin);

        Presence presence = j.getPresence();
        if (accepte && presence.getStatut() != StatutPresence.JUSTIFIE) {
            presence.getHistorique().add(new HistoriqueModification(presence, admin, presence.getStatut(), StatutPresence.JUSTIFIE));
            presence.setStatut(StatutPresence.JUSTIFIE);
        }
        notifications.notifier(new Notification(presence.getEtudiant(),
                accepte ? TypeNotification.SUCCES : TypeNotification.AVERTISSEMENT,
                accepte ? "Justificatif accepté" : "Justificatif refusé",
                accepte ? "Votre absence est maintenant justifiée."
                        : "Votre justificatif a été refusé. Vous pouvez en déposer un nouveau."));
    }

    @Override
    @Transactional(readOnly = true)
    public Fichier fichier(Utilisateur utilisateur, Long justificatifId) {
        Justificatif j = justificatifs.findWithPresenceById(justificatifId)
                .orElseThrow(() -> new AccessDeniedException("Justificatif introuvable"));
        boolean autorise = utilisateur instanceof Admin
                || j.getPresence().getEtudiant().getId().equals(utilisateur.getId());
        if (!autorise) throw new AccessDeniedException("Ce justificatif ne vous appartient pas");
        return new Fichier(stockage.chemin(dossier, j.getFichier()), stockage.typeContenu(j.getFichier()));
    }
}
