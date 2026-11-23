package com.attendflow.web;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.Admin;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Presence;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.EtatJustificatif;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.EtudiantRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.JustificatifService;
import com.attendflow.service.StatistiqueService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
public class JustificatifController {

    private final JustificatifService justificatifService;
    private final StatistiqueService statistiques;
    private final EtudiantRepository etudiants;
    private final UtilisateurRepository utilisateurs;

    public JustificatifController(JustificatifService justificatifService, StatistiqueService statistiques,
                                  EtudiantRepository etudiants, UtilisateurRepository utilisateurs) {
        this.justificatifService = justificatifService;
        this.statistiques = statistiques;
        this.etudiants = etudiants;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping("/etudiant/justificatifs")
    public String mesJustificatifs(@AuthenticationPrincipal UserDetails compte,
                                   @RequestParam(required = false) Long presence, Model model) {
        Etudiant etudiant = etudiants.findWithClasseByEmail(compte.getUsername()).orElseThrow();
        List<Presence> justifiables = statistiques.historique(etudiant).lignes().stream()
                .filter(p -> p.getStatut() == StatutPresence.ABSENT)
                .filter(p -> p.getJustificatif() == null || p.getJustificatif().getEtat() == EtatJustificatif.REFUSE)
                .toList();
        model.addAttribute("utilisateur", etudiant);
        model.addAttribute("justificatifs", justificatifService.mesJustificatifs(etudiant));
        model.addAttribute("absences", justifiables);
        model.addAttribute("presenceChoisie", presence);
        return "justificatifs/etudiant";
    }

    @PostMapping("/etudiant/justificatifs")
    public String deposer(@AuthenticationPrincipal UserDetails compte, @RequestParam Long presence,
                          @RequestParam String motif, @RequestParam MultipartFile fichier, RedirectAttributes redirect) {
        Etudiant etudiant = etudiants.findWithClasseByEmail(compte.getUsername()).orElseThrow();
        try {
            justificatifService.deposer(etudiant, presence, motif, fichier);
            redirect.addFlashAttribute("succes", t("Justificatif envoyé : il est en attente de validation."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            redirect.addFlashAttribute("erreur", e.getMessage());
            return "redirect:/etudiant/justificatifs?presence=" + presence;
        }
        return "redirect:/etudiant/justificatifs";
    }

    @GetMapping({"/admin/justificatifs", "/enseignant/justificatifs"})
    public String aTraiter(@AuthenticationPrincipal UserDetails compte, Model model) {
        Utilisateur utilisateur = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        model.addAttribute("utilisateur", utilisateur);
        model.addAttribute("base", base(utilisateur));
        model.addAttribute("enAttente", justificatifService.enAttente(utilisateur));
        model.addAttribute("traites", justificatifService.traitesRecemment(utilisateur));
        return "justificatifs/admin";
    }

    @PostMapping({"/admin/justificatifs/{id}/{decision:accepter|refuser}", "/enseignant/justificatifs/{id}/{decision:accepter|refuser}"})
    public String traiter(@PathVariable Long id, @PathVariable String decision,
                          @AuthenticationPrincipal UserDetails compte, RedirectAttributes redirect) {
        Utilisateur traitant = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        boolean accepte = decision.equals("accepter");
        try {
            justificatifService.traiter(traitant, id, accepte);
            redirect.addFlashAttribute("succes", accepte
                    ? t("Justificatif accepté : l'absence est maintenant justifiée.")
                    : t("Justificatif refusé : l'étudiant a été prévenu."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            redirect.addFlashAttribute("erreur", e.getMessage());
        }
        return "redirect:" + base(traitant);
    }

    private static String base(Utilisateur u) {
        return u instanceof Admin ? "/admin/justificatifs" : "/enseignant/justificatifs";
    }

    @GetMapping("/justificatifs/{id}/fichier")
    public ResponseEntity<Resource> fichier(@PathVariable Long id, @AuthenticationPrincipal UserDetails compte) {
        JustificatifService.Fichier f = justificatifService.fichier(
                utilisateurs.findByEmail(compte.getUsername()).orElseThrow(), id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.typeContenu()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(f.chemin()));
    }
}
