package com.attendflow.service.impl;

import com.attendflow.config.LangueConfig;
import static com.attendflow.service.Textes.t;
import com.attendflow.model.Enseignant;
import com.attendflow.model.Notification;
import com.attendflow.model.Presence;
import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.NotificationRepository;
import com.attendflow.repository.PresenceRepository;
import com.attendflow.repository.SeanceRepository;
import com.attendflow.service.EmailService;
import com.attendflow.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Locale;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notifications;
    private final SeanceRepository seances;
    private final PresenceRepository presences;
    private final EmailService email;
    private final String urlApplication;

    public NotificationServiceImpl(NotificationRepository notifications, SeanceRepository seances,
                                   PresenceRepository presences, EmailService email,
                                   @Value("${attendflow.url:http://localhost:8081}") String urlApplication) {
        this.notifications = notifications;
        this.seances = seances;
        this.presences = presences;
        this.email = email;
        this.urlApplication = urlApplication;
    }

    @Override
    public Notification notifier(Notification n) {
        Notification enregistree = notifications.save(n);
        String a = n.getDestinataire().getEmail();
        // dans la langue du destinataire (le titre et le message de la notification le sont deja)
        Locale langue = LangueConfig.de(n.getDestinataire());
        String sujet = t(langue, "Fas3a - {0}", n.getTitre());
        String texte = t(langue, "Bonjour {0},\n\n{1}\n\nVoir vos notifications : {2}/notifications\n\n-- Fas3a",
                n.getDestinataire().getNomComplet(), n.getMessage(), urlApplication);
        // Apres le commit : pas d'email pour une operation annulee (rollback).
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { email.envoyer(a, sujet, texte); }
            });
        } else {
            email.envoyer(a, sujet, texte);
        }
        return enregistree;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> lister(Utilisateur utilisateur) {
        return notifications.findByDestinataireOrderByDateDesc(utilisateur);
    }

    @Override
    @Transactional(readOnly = true)
    public long nbNonLues(Utilisateur utilisateur) {
        return notifications.countByDestinataireAndLueFalse(utilisateur);
    }

    @Override
    public void marquerLue(Utilisateur utilisateur, Long notificationId) {
        notifications.findByIdAndDestinataire(notificationId, utilisateur).ifPresent(n -> n.setLue(true));
    }

    @Override
    public void toutMarquerLu(Utilisateur utilisateur) {
        notifications.findByDestinataireAndLueFalse(utilisateur).forEach(n -> n.setLue(true));
    }

    /** F-32 : toutes les 5 minutes, fenetre ]+10 ; +15] minutes, donc un seul rappel par seance. */
    @Scheduled(cron = "${attendflow.rappels.cron:0 */5 * * * *}")
    public void rappelsPlanifies() {
        rappelsAvantSeance(LocalDateTime.now().withSecond(0).withNano(0));
    }

    /** F-33 : resume des absences chaque jour ouvre a 18h. */
    @Scheduled(cron = "${attendflow.resume.cron:0 0 18 * * MON-FRI}")
    public void resumePlanifie() {
        resumeDuJour(LocalDate.now());
    }

    @Override
    public int rappelsAvantSeance(LocalDateTime maintenant) {
        LocalDateTime debutFenetre = maintenant.plusMinutes(10);
        LocalDateTime finFenetre = maintenant.plusMinutes(15);
        List<Seance> aVenir = seances.findByDateBetweenOrderByDateAscHeureDebutAsc(maintenant.toLocalDate(), maintenant.toLocalDate())
                .stream()
                .filter(s -> s.getEtat() != EtatSeance.ANNULEE)
                .filter(s -> {
                    LocalDateTime debut = s.getDate().atTime(s.getHeureDebut());
                    return debut.isAfter(debutFenetre) && !debut.isAfter(finFenetre);
                })
                .toList();
        aVenir.forEach(s -> notifier(new Notification(s.getEnseignant(), TypeNotification.INFORMATION,
                t(LangueConfig.de(s.getEnseignant()), "Séance dans 15 minutes"),
                t(LangueConfig.de(s.getEnseignant()), "Votre séance de {0} ({1}) commence à {2}, salle {3}.",
                        s.getMatiere().getIntitule(), s.getClasse().getNom(), s.getHeureDebut(), s.getSalle().getNom()))));
        return aVenir.size();
    }

    @Override
    public int resumeDuJour(LocalDate jour) {
        Map<Enseignant, List<StatutPresence>> parEnseignant = presences.findBySeanceDateBetween(jour, jour).stream()
                .collect(Collectors.groupingBy(p -> p.getSeance().getEnseignant(),
                        Collectors.mapping(Presence::getStatut, Collectors.toList())));
        parEnseignant.forEach((enseignant, statuts) -> {
            long absences = statuts.stream().filter(s -> s == StatutPresence.ABSENT).count();
            notifier(new Notification(enseignant, TypeNotification.INFORMATION, t(LangueConfig.de(enseignant), "Absences du jour"),
                    t(LangueConfig.de(enseignant), "{0} absence(s) enregistrée(s) dans vos séances aujourd'hui ({1} présence(s) saisie(s)).",
                            absences, statuts.size())));
        });
        return parEnseignant.size();
    }
}
