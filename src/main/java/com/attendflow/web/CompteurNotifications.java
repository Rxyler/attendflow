package com.attendflow.web;

import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** Ajoute le nombre de notifications non lues a chaque page, pour le badge de la barre laterale. */
@ControllerAdvice
public class CompteurNotifications {

    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurs;

    public CompteurNotifications(NotificationService notificationService, UtilisateurRepository utilisateurs) {
        this.notificationService = notificationService;
        this.utilisateurs = utilisateurs;
    }

    @ModelAttribute("nbNonLues")
    public long nbNonLues(@AuthenticationPrincipal UserDetails compte) {
        if (compte == null) return 0;
        return utilisateurs.findByEmail(compte.getUsername()).map(notificationService::nbNonLues).orElse(0L);
    }
}
