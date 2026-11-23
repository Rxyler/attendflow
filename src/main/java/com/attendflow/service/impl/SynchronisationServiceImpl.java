package com.attendflow.service.impl;

import com.attendflow.config.LangueConfig;
import static com.attendflow.service.Textes.t;
import com.attendflow.service.NotificationService;
import com.attendflow.integration.EmploiDuTempsProvider;
import com.attendflow.integration.SeanceExterne;
import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.Role;
import com.attendflow.model.enums.StatutSynchronisation;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.*;
import com.attendflow.service.SynchronisationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Transactional
public class SynchronisationServiceImpl implements SynchronisationService {

    private final EmploiDuTempsProvider source;
    private final SeanceRepository seances;
    private final ClasseRepository classes;
    private final MatiereRepository matieres;
    private final SalleRepository salles;
    private final EnseignantRepository enseignants;
    private final JournalSynchronisationRepository journaux;
    private final UtilisateurRepository utilisateurs;
    private final NotificationService notifications;

    public SynchronisationServiceImpl(EmploiDuTempsProvider source, SeanceRepository seances, ClasseRepository classes,
                                      MatiereRepository matieres, SalleRepository salles, EnseignantRepository enseignants,
                                      JournalSynchronisationRepository journaux, UtilisateurRepository utilisateurs,
                                      NotificationService notifications) {
        this.source = source;
        this.seances = seances;
        this.classes = classes;
        this.matieres = matieres;
        this.salles = salles;
        this.enseignants = enseignants;
        this.journaux = journaux;
        this.utilisateurs = utilisateurs;
        this.notifications = notifications;
    }

    @Scheduled(cron = "${attendflow.synchro.cron:0 0 7 * * MON-FRI}")
    public void synchroniserAutomatiquement() {
        synchroniser(null);
    }

    @Override
    public JournalSynchronisation synchroniser(Admin declencheur) {
        LocalDateTime maintenant = LocalDateTime.now();
        JournalSynchronisation journal = new JournalSynchronisation();
        journal.setDateSynchro(maintenant);
        journal.setDeclenchePar(declencheur);

        List<SeanceExterne> recues;
        try {
            recues = source.recupererSeances();
        } catch (RuntimeException e) {
            journal.setStatut(StatutSynchronisation.ECHEC);
            journal.setMessage(tronquer(t("Projet partenaire injoignable : {0}", e.getMessage())));
            return journaux.save(journal);
        }

        int ajoutees = 0, modifiees = 0, annulees = 0;
        List<String> erreurs = new ArrayList<>();
        List<String[]> alertes = new ArrayList<>();

        for (SeanceExterne s : recues) {
            Classe classe = classes.findByNom(s.classe()).orElse(null);
            Matiere matiere = matieres.findByCode(s.codeMatiere()).orElse(null);
            Enseignant enseignant = enseignants.findByEmail(s.emailEnseignant()).orElse(null);
            if (classe == null || matiere == null || enseignant == null) {
                erreurs.add(s.idExterne() + " (" + (classe == null ? t("classe {0} inconnu)", s.classe())
                        : matiere == null ? t("matière {0} inconnu)", s.codeMatiere()) : t("enseignant {0} inconnu)", s.emailEnseignant())));
                continue;
            }
            Salle salle = salles.findByNom(s.salle()).orElseGet(() -> salles.save(new Salle(s.salle(), null)));
            EtatSeance etatSource = s.annulee() ? EtatSeance.ANNULEE : EtatSeance.PLANIFIEE;

            Seance seance = seances.findByIdExterne(s.idExterne()).orElse(null);
            if (seance == null) {
                seance = new Seance(s.idExterne(), s.date(), s.heureDebut(), s.heureFin(), classe, matiere, salle, enseignant);
                seance.setEtat(etatSource);
                seance.setDateSynchro(maintenant);
                seances.save(seance);
                ajoutees++;
                continue;
            }

            if (s.annulee()) {
                if (seance.getEtat() != EtatSeance.ANNULEE) {
                    seance.setEtat(EtatSeance.ANNULEE);
                    annulees++;
                    if (!seance.getPresences().isEmpty()) alertes.add(new String[] {"annulée : {0}", decrire(seance)});
                }
            } else if (seance.getEtat() == EtatSeance.ANNULEE || aChange(seance, s, classe, matiere, salle, enseignant)) {
                seance.setDate(s.date());
                seance.setHeureDebut(s.heureDebut());
                seance.setHeureFin(s.heureFin());
                seance.setClasse(classe);
                seance.setMatiere(matiere);
                seance.setSalle(salle);
                seance.setEnseignant(enseignant);
                seance.setEtat(EtatSeance.MODIFIEE);
                modifiees++;
                if (!seance.getPresences().isEmpty()) alertes.add(new String[] {"modifiée : {0}", decrire(seance)});
            }
            seance.setDateSynchro(maintenant);
        }

        journal.setNbAjoutees(ajoutees);
        journal.setNbModifiees(modifiees);
        journal.setNbAnnulees(annulees);
        journal.setStatut(erreurs.isEmpty() ? StatutSynchronisation.SUCCES
                : erreurs.size() == recues.size() ? StatutSynchronisation.ECHEC
                : StatutSynchronisation.PARTIEL);
        journal.setMessage(tronquer(erreurs.isEmpty()
                ? t("{0} séance(s) lue(s).", recues.size())
                : t("{0} séance(s) ignorée(s) : {1}", erreurs.size(), String.join(", ", erreurs))));

        for (String[] alerte : alertes) {
            for (Utilisateur admin : utilisateurs.findByRole(Role.ADMIN)) {
                Locale langue = LangueConfig.de(admin);
                notifications.notifier(new Notification(admin, TypeNotification.AVERTISSEMENT,
                        t(langue, "Séance changée dans le planning source"),
                        t(langue, "Séance {0}. Les présences déjà saisies sont conservées.", t(langue, alerte[0], alerte[1])),
                        "/admin/synchronisation"));
            }
        }
        return journaux.save(journal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JournalSynchronisation> derniersJournaux() {
        return journaux.findTop20ByOrderByDateSynchroDesc();
    }

    private boolean aChange(Seance seance, SeanceExterne s, Classe classe, Matiere matiere, Salle salle, Enseignant enseignant) {
        return !Objects.equals(seance.getDate(), s.date())
                || !Objects.equals(seance.getHeureDebut(), s.heureDebut())
                || !Objects.equals(seance.getHeureFin(), s.heureFin())
                || !Objects.equals(seance.getClasse().getId(), classe.getId())
                || !Objects.equals(seance.getMatiere().getId(), matiere.getId())
                || !Objects.equals(seance.getSalle().getId(), salle.getId())
                || !Objects.equals(seance.getEnseignant().getId(), enseignant.getId());
    }

    private String decrire(Seance seance) {
        return seance.getMatiere().getIntitule() + ", " + seance.getClasse().getNom() + ", "
                + seance.getDate() + " " + seance.getHeureDebut();
    }

    private String tronquer(String texte) {
        return texte.length() <= 1000 ? texte : texte.substring(0, 997) + "...";
    }
}
