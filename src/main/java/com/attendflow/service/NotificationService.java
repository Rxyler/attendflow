package com.attendflow.service;

import com.attendflow.model.Notification;
import com.attendflow.model.Utilisateur;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Ecran 9 et F-32 a F-35 : notifications a trois niveaux (information, avertissement, succes). */
public interface NotificationService {

    /** Enregistre la notification et en envoie une copie par email apres validation de la transaction. */
    Notification notifier(Notification notification);

    List<Notification> lister(Utilisateur utilisateur);

    long nbNonLues(Utilisateur utilisateur);

    /** Marque lue et renvoie la page a ouvrir (null : aucune) ; ne fait rien si la notification n'appartient pas a l'utilisateur. */
    String marquerLue(Utilisateur utilisateur, Long notificationId);

    void toutMarquerLu(Utilisateur utilisateur);

    /** F-32 : previent chaque enseignant des seances qui commencent dans 10 a 15 minutes. */
    int rappelsAvantSeance(LocalDateTime maintenant);

    /** F-33 : resume des absences enregistrees ce jour-la, pour chaque enseignant concerne. */
    int resumeDuJour(LocalDate jour);
}
