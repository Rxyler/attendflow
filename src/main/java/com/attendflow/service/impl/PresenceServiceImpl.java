package com.attendflow.service.impl;

import com.attendflow.config.LangueConfig;
import static com.attendflow.service.Textes.t;
import com.attendflow.service.NotificationService;
import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.Role;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.*;
import com.attendflow.service.PresenceService;
import com.attendflow.service.TauxPresence;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class PresenceServiceImpl implements PresenceService {

    private final SeanceRepository seances;
    private final EtudiantRepository etudiants;
    private final PresenceRepository presences;
    private final ParametreRepository parametres;
    private final UtilisateurRepository utilisateurs;
    private final NotificationService notifications;

    public PresenceServiceImpl(SeanceRepository seances, EtudiantRepository etudiants, PresenceRepository presences,
                               ParametreRepository parametres, UtilisateurRepository utilisateurs,
                               NotificationService notifications) {
        this.seances = seances;
        this.etudiants = etudiants;
        this.presences = presences;
        this.parametres = parametres;
        this.utilisateurs = utilisateurs;
        this.notifications = notifications;
    }

    @Override
    @Transactional(readOnly = true)
    public Feuille ouvrir(Utilisateur utilisateur, Long seanceId) {
        Seance seance = charger(utilisateur, seanceId);
        Map<Long, Presence> existantes = presencesParEtudiant(seance);
        List<Ligne> lignes = etudiants.findByClasseOrderByNomAscPrenomAsc(seance.getClasse()).stream()
                .map(e -> new Ligne(e, existantes.containsKey(e.getId())
                        ? existantes.get(e.getId()).getStatut() : StatutPresence.PRESENT))
                .toList();
        String verrou = raisonVerrou(utilisateur, seance);
        return new Feuille(seance, lignes, verrou == null, verrou, !existantes.isEmpty(), limiteModification(seance));
    }

    @Override
    public int enregistrer(Utilisateur utilisateur, Long seanceId, Map<Long, StatutPresence> statuts) {
        Seance seance = charger(utilisateur, seanceId);
        String verrou = raisonVerrou(utilisateur, seance);
        if (verrou != null) throw new IllegalStateException(verrou);

        Map<Long, Presence> existantes = presencesParEtudiant(seance);
        List<Etudiant> classe = etudiants.findByClasseOrderByNomAscPrenomAsc(seance.getClasse());
        Parametre p = parametres();
        Map<Long, Boolean> depassaitAvant = classe.stream()
                .collect(Collectors.toMap(Etudiant::getId, e -> TauxPresence.seuilDepasse(statutsDe(e), p)));

        int enregistrees = 0;
        for (Etudiant etudiant : classe) {
            StatutPresence statut = statuts.get(etudiant.getId());
            if (statut == null) continue;
            Presence presence = existantes.get(etudiant.getId());
            if (presence == null) {
                presences.save(new Presence(seance, etudiant, statut));
            } else if (presence.getStatut() != statut) {
                presence.getHistorique().add(new HistoriqueModification(presence, utilisateur, presence.getStatut(), statut));
                presence.setStatut(statut);
                presence.setDateSaisie(LocalDateTime.now());
            }
            enregistrees++;
        }

        presences.flush();
        for (Etudiant etudiant : classe) {
            List<StatutPresence> historique = statutsDe(etudiant);
            if (depassaitAvant.get(etudiant.getId()) || !TauxPresence.seuilDepasse(historique, p)) continue;
            Object taux = TauxPresence.taux(historique, p), nbAbsences = TauxPresence.compter(historique, StatutPresence.ABSENT);
            for (Utilisateur admin : utilisateurs.findByRole(Role.ADMIN)) {
                notifications.notifier(new Notification(admin, TypeNotification.AVERTISSEMENT, t(LangueConfig.de(admin), "Seuil d'absence dépassé"),
                        t(LangueConfig.de(admin), "{0} ({1}) : {2}", etudiant.getNomComplet(), seance.getClasse().getNom(),
                                t(LangueConfig.de(admin), "taux de présence {0} %, {1} absence(s).", taux, nbAbsences)),
                        "/admin/etudiants/" + etudiant.getId() + "/historique"));
            }
            notifications.notifier(new Notification(etudiant, TypeNotification.AVERTISSEMENT, t(LangueConfig.de(etudiant), "Seuil d'absence dépassé"),
                    t(LangueConfig.de(etudiant), "Vous avez dépassé le seuil d'absence autorisé : {0}",
                            t(LangueConfig.de(etudiant), "taux de présence {0} %, {1} absence(s).", taux, nbAbsences)),
                    "/etudiant/historique"));
        }
        return enregistrees;
    }

    private List<StatutPresence> statutsDe(Etudiant etudiant) {
        return presences.findByEtudiantOrderBySeanceDateDesc(etudiant).stream().map(Presence::getStatut).toList();
    }

    private Parametre parametres() {
        return parametres.findFirstByOrderByIdAsc().orElseGet(Parametre::new);
    }

    private Seance charger(Utilisateur utilisateur, Long seanceId) {
        Seance seance = seances.findWithDetailsById(seanceId)
                .orElseThrow(() -> new AccessDeniedException("Séance introuvable"));
        boolean autorise = switch (utilisateur) {
            case Admin a -> true;
            case Enseignant e -> seance.getEnseignant().getId().equals(e.getId());
            default -> false;
        };
        if (!autorise) throw new AccessDeniedException("Cette séance n'est pas la vôtre");
        return seance;
    }

    private String raisonVerrou(Utilisateur utilisateur, Seance seance) {
        if (seance.getEtat() == EtatSeance.ANNULEE) {
            return t("Séance annulée dans le planning source : la prise des présences est impossible.");
        }
        LocalDateTime maintenant = LocalDateTime.now();
        if (maintenant.isBefore(seance.getDate().atTime(seance.getHeureDebut()))) {
            return t("La séance n'a pas encore commencé.");
        }
        if (utilisateur instanceof Admin) return null;
        if (maintenant.isAfter(limiteModification(seance))) {
            return t("Le délai de modification est dépassé. Contactez l'administration.");
        }
        return null;
    }

    private LocalDateTime limiteModification(Seance seance) {
        return seance.getDate().atTime(seance.getHeureFin()).plusHours(parametres().getDelaiModificationHeures());
    }

    private Map<Long, Presence> presencesParEtudiant(Seance seance) {
        return presences.findBySeance(seance).stream()
                .collect(Collectors.toMap(p -> p.getEtudiant().getId(), Function.identity()));
    }
}
