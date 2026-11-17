package com.attendflow.web;

import com.attendflow.model.Utilisateur;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/** Ecran 9 : notifications de l'utilisateur connecte, tous roles. */
@Controller
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurs;

    public NotificationController(NotificationService notificationService, UtilisateurRepository utilisateurs) {
        this.notificationService = notificationService;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping
    public String liste(@AuthenticationPrincipal UserDetails compte, Model model) {
        Utilisateur utilisateur = utilisateur(compte);
        model.addAttribute("utilisateur", utilisateur);
        model.addAttribute("notifications", notificationService.lister(utilisateur));
        return "notifications";
    }

    @PostMapping("/{id}/lue")
    public String marquerLue(@PathVariable Long id, @AuthenticationPrincipal UserDetails compte) {
        notificationService.marquerLue(utilisateur(compte), id);
        return "redirect:/notifications";
    }

    @PostMapping("/tout-lu")
    public String toutMarquerLu(@AuthenticationPrincipal UserDetails compte) {
        notificationService.toutMarquerLu(utilisateur(compte));
        return "redirect:/notifications";
    }

    private Utilisateur utilisateur(UserDetails compte) {
        return utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
    }
}
