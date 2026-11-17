package com.attendflow.web;

import com.attendflow.model.Etudiant;
import com.attendflow.repository.EtudiantRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.StatistiqueService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;

/** Ecran 5 / F-28 : historique des presences d'un etudiant (l'etudiant lui-meme ou l'admin). */
@Controller
public class HistoriqueController {

    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM");

    private final StatistiqueService statistiques;
    private final EtudiantRepository etudiants;
    private final UtilisateurRepository utilisateurs;

    public HistoriqueController(StatistiqueService statistiques, EtudiantRepository etudiants,
                                UtilisateurRepository utilisateurs) {
        this.statistiques = statistiques;
        this.etudiants = etudiants;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping("/etudiant/historique")
    public String monHistorique(@AuthenticationPrincipal UserDetails compte, Model model) {
        Etudiant etudiant = etudiants.findWithClasseByEmail(compte.getUsername()).orElseThrow();
        model.addAttribute("utilisateur", etudiant);
        return afficher(etudiant, model);
    }

    @GetMapping("/admin/etudiants/{id}/historique")
    public String historiqueAdmin(@PathVariable Long id, @AuthenticationPrincipal UserDetails compte, Model model) {
        Etudiant etudiant = etudiants.findWithClasseById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        model.addAttribute("utilisateur", utilisateurs.findByEmail(compte.getUsername()).orElseThrow());
        return afficher(etudiant, model);
    }

    private String afficher(Etudiant etudiant, Model model) {
        StatistiqueService.Historique h = statistiques.historique(etudiant);
        model.addAttribute("etudiant", etudiant);
        model.addAttribute("historique", h);
        model.addAttribute("joursGraphique", h.evolution().stream().map(p -> p.jour().format(JOUR)).toList());
        model.addAttribute("tauxGraphique", h.evolution().stream().map(StatistiqueService.Point::taux).toList());
        return "historique";
    }
}
