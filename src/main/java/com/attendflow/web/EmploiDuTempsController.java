package com.attendflow.web;

import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.Role;
import com.attendflow.repository.ClasseRepository;
import com.attendflow.repository.EnseignantRepository;
import com.attendflow.repository.EtudiantRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.EmploiDuTempsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.IntStream;

/** F-13 a F-15 : emploi du temps hebdomadaire (lundi-vendredi), en lecture seule. */
@Controller
public class EmploiDuTempsController {

    /** Creneaux de 2h de 8h a 18h, comme la maquette. */
    static final List<LocalTime> CRENEAUX = IntStream.of(8, 10, 12, 14, 16).mapToObj(h -> LocalTime.of(h, 0)).toList();

    /** Une ligne de la grille : un creneau horaire et, pour chaque jour, ses seances. */
    public record Ligne(LocalTime debut, LocalTime fin, List<List<Seance>> jours) {}

    private final EmploiDuTempsService emploiDuTemps;
    private final UtilisateurRepository utilisateurs;
    private final ClasseRepository classes;
    private final EnseignantRepository enseignants;
    private final EtudiantRepository etudiants;

    public EmploiDuTempsController(EmploiDuTempsService emploiDuTemps, UtilisateurRepository utilisateurs,
                                   ClasseRepository classes, EnseignantRepository enseignants,
                                   EtudiantRepository etudiants) {
        this.emploiDuTemps = emploiDuTemps;
        this.utilisateurs = utilisateurs;
        this.classes = classes;
        this.enseignants = enseignants;
        this.etudiants = etudiants;
    }

    @GetMapping("/emploi-du-temps")
    public String semaine(@AuthenticationPrincipal UserDetails compte,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate semaine,
                          @RequestParam(required = false) Long classe,
                          @RequestParam(required = false) Long enseignant,
                          @RequestParam(required = false) Long seance,
                          Model model) {
        Utilisateur utilisateur = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        boolean admin = utilisateur.getRole() == Role.ADMIN;
        LocalDate lundi = (semaine != null ? semaine : LocalDate.now()).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<LocalDate> jours = IntStream.range(0, 5).mapToObj(lundi::plusDays).toList();
        List<Seance> seances = emploiDuTemps.seancesDeLaSemaine(utilisateur, lundi,
                admin ? classe : null, admin ? enseignant : null);

        List<Ligne> lignes = CRENEAUX.stream().map(debut -> {
            LocalTime fin = debut.plusHours(2);
            List<List<Seance>> parJour = jours.stream().map(jour -> seances.stream()
                    .filter(s -> s.getDate().equals(jour)
                            && !s.getHeureDebut().isBefore(debut) && s.getHeureDebut().isBefore(fin))
                    .toList()).toList();
            return new Ligne(debut, fin, parJour);
        }).toList();

        model.addAttribute("utilisateur", utilisateur);
        model.addAttribute("admin", admin);
        model.addAttribute("lundi", lundi);
        model.addAttribute("jours", jours);
        model.addAttribute("aujourdhui", LocalDate.now());
        model.addAttribute("lignes", lignes);
        model.addAttribute("seances", seances);
        model.addAttribute("classeFiltre", admin ? classe : null);
        model.addAttribute("enseignantFiltre", admin ? enseignant : null);
        if (utilisateur.getRole() == Role.ETUDIANT) {
            etudiants.findWithClasseByEmail(utilisateur.getEmail())
                    .ifPresent(e -> model.addAttribute("classeEtudiant", e.getClasse().getNom()));
        }
        if (admin) {
            model.addAttribute("classes", classes.findAll());
            model.addAttribute("enseignants", enseignants.findAll());
        }
        if (seance != null) {
            emploiDuTemps.seanceVisible(utilisateur, seance).ifPresent(s -> model.addAttribute("selection", s));
        }
        return "emploi-du-temps";
    }
}
