package com.attendflow.web;

import com.attendflow.service.MotDePasseService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/** F-02 : "Mot de passe oublie" puis reinitialisation via le lien recu. */
@Controller
public class MotDePasseController {

    private final MotDePasseService motDePasseService;
    /** Adresse publique configuree : jamais l'en-tete Host, qu'un attaquant peut falsifier pour detourner le lien. */
    private final String urlApplication;

    public MotDePasseController(MotDePasseService motDePasseService,
                                @Value("${attendflow.url:http://localhost:8081}") String urlApplication) {
        this.motDePasseService = motDePasseService;
        this.urlApplication = urlApplication.replaceAll("/+$", "");
    }

    @GetMapping("/mot-de-passe-oublie")
    public String formulaireDemande() {
        return "mot-de-passe-oublie";
    }

    @PostMapping("/mot-de-passe-oublie")
    public String demander(@RequestParam String email) {
        motDePasseService.demanderReinitialisation(email, urlApplication);
        // Meme reponse que l'email existe ou non : on ne revele pas les comptes.
        return "redirect:/mot-de-passe-oublie?envoye";
    }

    @GetMapping("/reinitialiser")
    public String formulaireNouveauMotDePasse(@RequestParam String token, Model model) {
        model.addAttribute("token", token);
        model.addAttribute("lienValide", motDePasseService.tokenValide(token));
        return "reinitialiser";
    }

    @PostMapping("/reinitialiser")
    public String reinitialiser(@RequestParam String token, @RequestParam String motDePasse,
                                @RequestParam String confirmation, Model model) {
        model.addAttribute("token", token);
        model.addAttribute("lienValide", true);
        if (!motDePasse.equals(confirmation)) {
            model.addAttribute("erreur", "Les deux mots de passe ne correspondent pas.");
            return "reinitialiser";
        }
        try {
            motDePasseService.reinitialiser(token, motDePasse);
        } catch (IllegalArgumentException e) {
            model.addAttribute("lienValide", motDePasseService.tokenValide(token));
            model.addAttribute("erreur", e.getMessage());
            return "reinitialiser";
        }
        return "redirect:/login?reinitialise";
    }
}
