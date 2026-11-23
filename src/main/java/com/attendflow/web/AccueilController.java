package com.attendflow.web;

import com.attendflow.model.Utilisateur;
import com.attendflow.repository.EnseignantRepository;
import com.attendflow.repository.EtudiantRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.StatistiqueService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Controller
public class AccueilController {

    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM");

    private final UtilisateurRepository utilisateurs;
    private final EnseignantRepository enseignants;
    private final EtudiantRepository etudiants;
    private final StatistiqueService statistiques;

    public AccueilController(UtilisateurRepository utilisateurs, EnseignantRepository enseignants,
                             EtudiantRepository etudiants, StatistiqueService statistiques) {
        this.utilisateurs = utilisateurs;
        this.enseignants = enseignants;
        this.etudiants = etudiants;
        this.statistiques = statistiques;
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/")
    public String accueil(@AuthenticationPrincipal UserDetails compte) {
        if (compte == null) return "accueil";
        return switch (utilisateur(compte).getRole()) {
            case ADMIN -> "redirect:/admin";
            case ENSEIGNANT -> "redirect:/enseignant";
            case ETUDIANT -> "redirect:/etudiant";
        };
    }

    @GetMapping("/admin")
    public String admin(@AuthenticationPrincipal UserDetails compte, Model model) {
        StatistiqueService.TableauAdmin tableau = statistiques.pourAdmin();
        model.addAttribute("utilisateur", utilisateur(compte));
        model.addAttribute("tableau", tableau);
        graphique(tableau.septJours(), model);
        return "tableaux/admin";
    }

    @GetMapping("/enseignant")
    public String enseignant(@AuthenticationPrincipal UserDetails compte, Model model) {
        StatistiqueService.TableauEnseignant tableau =
                statistiques.pourEnseignant(enseignants.findByEmail(compte.getUsername()).orElseThrow());
        model.addAttribute("utilisateur", utilisateur(compte));
        model.addAttribute("tableau", tableau);
        graphique(tableau.septJours(), model);
        return "tableaux/enseignant";
    }

    @GetMapping("/etudiant")
    public String etudiant(@AuthenticationPrincipal UserDetails compte, Model model) {
        var etudiant = etudiants.findWithClasseByEmail(compte.getUsername()).orElseThrow();
        model.addAttribute("utilisateur", etudiant);
        model.addAttribute("tableau", statistiques.pourEtudiant(etudiant));
        return "tableaux/etudiant";
    }

    private void graphique(List<StatistiqueService.Point> points, Model model) {
        model.addAttribute("joursGraphique", points.stream().map(p -> p.jour().format(JOUR)).toList());
        model.addAttribute("tauxGraphique", points.stream().map(StatistiqueService.Point::taux).toList());
    }

    private Utilisateur utilisateur(UserDetails compte) {
        return utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
    }
}
