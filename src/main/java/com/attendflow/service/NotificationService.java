package com.attendflow.service;

import com.attendflow.model.Notification;
import com.attendflow.model.Utilisateur;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface NotificationService {

    Notification notifier(Notification notification);

    List<Notification> lister(Utilisateur utilisateur);

    long nbNonLues(Utilisateur utilisateur);

    String marquerLue(Utilisateur utilisateur, Long notificationId);

    void toutMarquerLu(Utilisateur utilisateur);

    int rappelsAvantSeance(LocalDateTime maintenant);

    int resumeDuJour(LocalDate jour);
}
