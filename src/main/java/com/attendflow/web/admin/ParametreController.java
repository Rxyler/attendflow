package com.attendflow.web.admin;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.Admin;
import com.attendflow.model.Parametre;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.ParametreService;
import com.attendflow.service.ParametreService.ParametreForm;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** Ecran Parametres : seuils RG-05, delai F-22, calcul du taux RG-04 (admin uniquement, voir SecurityConfig). */
@Controller
@RequestMapping("/admin/parametres")
public class ParametreController {

    private final ParametreService parametres;
    private final UtilisateurRepository utilisateurs;

    public ParametreController(ParametreService parametres, UtilisateurRepository utilisateurs) {
        this.parametres = parametres;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping
    public String afficher(@AuthenticationPrincipal UserDetails compte, Model model) {
        Parametre p = parametres.courant();
        model.addAttribute("utilisateur", utilisateurs.findByEmail(compte.getUsername()).orElseThrow());
        model.addAttribute("modifiePar", p.getModifiePar() == null ? null : p.getModifiePar().getNomComplet());
        if (!model.containsAttribute("form")) model.addAttribute("form", ParametreForm.de(p));
        return "admin/parametres";
    }

    @PostMapping
    public String modifier(@AuthenticationPrincipal UserDetails compte, @ModelAttribute ParametreForm form,
                           RedirectAttributes r) {
        try {
            parametres.modifier((Admin) utilisateurs.findByEmail(compte.getUsername()).orElseThrow(), form);
            r.addFlashAttribute("succes", t("Paramètres enregistrés. Ils s’appliquent immédiatement."));
        } catch (IllegalArgumentException e) {
            r.addFlashAttribute("erreur", e.getMessage());
            r.addFlashAttribute("form", form);   // garde la saisie
        }
        return "redirect:/admin/parametres";
    }
}
