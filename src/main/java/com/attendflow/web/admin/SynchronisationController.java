package com.attendflow.web.admin;

import com.attendflow.model.Admin;
import com.attendflow.model.JournalSynchronisation;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.SynchronisationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** F-12 : journal de synchronisation et synchronisation a la demande (admin uniquement, voir SecurityConfig). */
@Controller
@RequestMapping("/admin/synchronisation")
public class SynchronisationController {

    private final SynchronisationService synchronisation;
    private final UtilisateurRepository utilisateurs;

    public SynchronisationController(SynchronisationService synchronisation, UtilisateurRepository utilisateurs) {
        this.synchronisation = synchronisation;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping
    public String journal(@AuthenticationPrincipal UserDetails compte, Model model) {
        model.addAttribute("utilisateur", utilisateurs.findByEmail(compte.getUsername()).orElseThrow());
        model.addAttribute("journaux", synchronisation.derniersJournaux());
        return "admin/synchronisation";
    }

    @PostMapping
    public String synchroniser(@AuthenticationPrincipal UserDetails compte, RedirectAttributes redirect) {
        Admin admin = (Admin) utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        JournalSynchronisation j = synchronisation.synchroniser(admin);
        redirect.addFlashAttribute("resultat", j);
        return "redirect:/admin/synchronisation";
    }
}
