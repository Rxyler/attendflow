package com.attendflow.web;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.Mascotte;
import com.attendflow.repository.UtilisateurRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class ProfilController {

    private final UtilisateurRepository utilisateurs;

    public ProfilController(UtilisateurRepository utilisateurs) {
        this.utilisateurs = utilisateurs;
    }

    @GetMapping("/profil")
    public String profil(@AuthenticationPrincipal UserDetails compte, Model model) {
        model.addAttribute("utilisateur", utilisateurs.findByEmail(compte.getUsername()).orElseThrow());
        model.addAttribute("mascottes", Mascotte.values());
        return "profil";
    }

    @PostMapping("/profil/mascotte")
    public String choisir(@AuthenticationPrincipal UserDetails compte,
                          @RequestParam(required = false) Mascotte mascotte, RedirectAttributes redirection) {
        Utilisateur u = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        u.setMascotte(mascotte);
        utilisateurs.save(u);
        redirection.addFlashAttribute("succes", mascotte == null ? t("Initiales rétablies.")
                : t("{0} est maintenant ton compagnon !", mascotte.getNom()));
        return "redirect:/profil";
    }
}
