package com.attendflow.web;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.PresenceService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;

/** F-16 a F-21 : feuille de presence d'une seance (enseignant affecte ou admin, voir SecurityConfig). */
@Controller
public class PresenceController {

    private static final String PREFIXE = "statut_";

    private final PresenceService presenceService;
    private final UtilisateurRepository utilisateurs;

    public PresenceController(PresenceService presenceService, UtilisateurRepository utilisateurs) {
        this.presenceService = presenceService;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping("/seances/{id}/presences")
    public String feuille(@PathVariable Long id, @AuthenticationPrincipal UserDetails compte, Model model) {
        Utilisateur utilisateur = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        model.addAttribute("utilisateur", utilisateur);
        model.addAttribute("feuille", presenceService.ouvrir(utilisateur, id));
        return "seances/presences";
    }

    /** Les statuts arrivent sous la forme statut_{idEtudiant}=PRESENT|ABSENT|RETARD|JUSTIFIE. */
    @PostMapping("/seances/{id}/presences")
    public String enregistrer(@PathVariable Long id, @AuthenticationPrincipal UserDetails compte,
                              @RequestParam Map<String, String> parametres, RedirectAttributes redirect) {
        Utilisateur utilisateur = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        Map<Long, StatutPresence> statuts = new HashMap<>();
        try {
            parametres.forEach((cle, valeur) -> {
                if (cle.startsWith(PREFIXE)) {
                    statuts.put(Long.valueOf(cle.substring(PREFIXE.length())), StatutPresence.valueOf(valeur));
                }
            });
            int n = presenceService.enregistrer(utilisateur, id, statuts);
            redirect.addFlashAttribute("succes", t("{0} présence(s) enregistrée(s) avec succès.", n));   // F-21
        } catch (IllegalArgumentException e) {
            redirect.addFlashAttribute("erreur", t("Statut invalide : rien n'a été enregistré."));
        } catch (IllegalStateException e) {
            redirect.addFlashAttribute("erreur", e.getMessage());
        }
        return "redirect:/seances/" + id + "/presences";
    }
}
