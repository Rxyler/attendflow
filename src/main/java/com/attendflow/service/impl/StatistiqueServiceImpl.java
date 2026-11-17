package com.attendflow.service.impl;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.Progression;
import com.attendflow.service.StatistiqueService;
import com.attendflow.service.TauxPresence;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.attendflow.service.TauxPresence.compter;

@Service
@Transactional(readOnly = true)
public class StatistiqueServiceImpl implements StatistiqueService {

    private final SeanceRepository seances;
    private final PresenceRepository presences;
    private final EtudiantRepository etudiants;
    private final ParametreRepository parametres;

    public StatistiqueServiceImpl(SeanceRepository seances, PresenceRepository presences,
                                  EtudiantRepository etudiants, ParametreRepository parametres) {
        this.seances = seances;
        this.presences = presences;
        this.etudiants = etudiants;
        this.parametres = parametres;
    }

    @Override
    public Historique historique(Etudiant etudiant) {
        Parametre p = parametres();
        List<Presence> lignes = presences.findByEtudiantOrderBySeanceDateDesc(etudiant);
        List<StatutPresence> statuts = lignes.stream().map(Presence::getStatut).toList();

        // Taux cumule a la fin de chaque jour, du plus ancien au plus recent.
        List<LocalDate> jours = lignes.stream().map(pr -> pr.getSeance().getDate()).distinct().sorted().toList();
        List<Point> evolution = jours.stream().map(jour -> new Point(jour, TauxPresence.taux(lignes.stream()
                .filter(pr -> !pr.getSeance().getDate().isAfter(jour)).map(Presence::getStatut).toList(), p))).toList();

        return new Historique(TauxPresence.taux(statuts, p), compter(statuts, StatutPresence.PRESENT),
                compter(statuts, StatutPresence.ABSENT), compter(statuts, StatutPresence.RETARD),
                compter(statuts, StatutPresence.JUSTIFIE), lignes, evolution);
    }

    @Override
    public TableauEnseignant pourEnseignant(Enseignant enseignant) {
        LocalDate aujourdhui = LocalDate.now();
        LocalTime maintenant = LocalTime.now();
        List<Seance> duJour = seances.findByEnseignantAndDateBetweenOrderByDateAscHeureDebutAsc(enseignant, aujourdhui, aujourdhui);
        Seance actuelle = duJour.stream()
                .filter(s -> s.getEtat() != EtatSeance.ANNULEE
                        && !maintenant.isBefore(s.getHeureDebut()) && maintenant.isBefore(s.getHeureFin()))
                .findFirst().orElse(null);
        List<Seance> prochaines = duJour.stream().filter(s -> s.getHeureDebut().isAfter(maintenant)).toList();

        List<Presence> semaine = presences.findBySeanceEnseignantAndSeanceDateBetween(enseignant, aujourdhui.minusDays(6), aujourdhui);
        List<StatutPresence> statuts = semaine.stream().map(Presence::getStatut).toList();
        Parametre p = parametres();
        return new TableauEnseignant(duJour, actuelle, prochaines,
                compter(statuts, StatutPresence.PRESENT), compter(statuts, StatutPresence.ABSENT),
                compter(statuts, StatutPresence.RETARD), TauxPresence.taux(statuts, p), septJours(semaine, aujourdhui, p));
    }

    @Override
    public TableauEtudiant pourEtudiant(Etudiant etudiant) {
        List<Presence> historique = presences.findByEtudiantOrderBySeanceDateDesc(etudiant);
        List<StatutPresence> statuts = historique.stream().map(Presence::getStatut).toList();
        LocalDateTime maintenant = LocalDateTime.now();
        Seance prochaine = seances.findByClasseAndDateBetweenOrderByDateAscHeureDebutAsc(
                        etudiant.getClasse(), maintenant.toLocalDate(), maintenant.toLocalDate().plusDays(30)).stream()
                .filter(s -> s.getEtat() != EtatSeance.ANNULEE && s.getDate().atTime(s.getHeureDebut()).isAfter(maintenant))
                .findFirst().orElse(null);
        List<Presence> dernieresAbsences = historique.stream()
                .filter(pr -> pr.getStatut() == StatutPresence.ABSENT).limit(5).toList();
        Integer taux = TauxPresence.taux(statuts, parametres());

        // Defi de la semaine : etre present (ou en retard) a toutes les seances de la semaine
        LocalDate lundi = maintenant.toLocalDate().with(DayOfWeek.MONDAY);
        int defiTotal = (int) seances.findByClasseAndDateBetweenOrderByDateAscHeureDebutAsc(
                        etudiant.getClasse(), lundi, lundi.plusDays(6)).stream()
                .filter(s -> s.getEtat() != EtatSeance.ANNULEE).count();
        int defiFaites = (int) historique.stream()
                .filter(pr -> !pr.getSeance().getDate().isBefore(lundi) && !pr.getSeance().getDate().isAfter(lundi.plusDays(6)))
                .filter(pr -> pr.getStatut() == StatutPresence.PRESENT || pr.getStatut() == StatutPresence.RETARD).count();

        return new TableauEtudiant(taux,
                compter(statuts, StatutPresence.PRESENT), compter(statuts, StatutPresence.ABSENT),
                compter(statuts, StatutPresence.RETARD), compter(statuts, StatutPresence.JUSTIFIE),
                prochaine, dernieresAbsences, Progression.de(statuts, taux),
                defiFaites, defiTotal, calendrier(historique, lundi));
    }

    /** 12 semaines, du lundi le plus ancien a dimanche de cette semaine ; un jour prend le pire statut de ses seances. */
    static List<Jour> calendrier(List<Presence> historique, LocalDate lundi) {
        LocalDate debut = lundi.minusWeeks(11);
        Map<LocalDate, StatutPresence> pire = new HashMap<>();
        for (Presence pr : historique) {
            LocalDate d = pr.getSeance().getDate();
            if (!d.isBefore(debut)) pire.merge(d, pr.getStatut(), (a, b) -> gravite(a) >= gravite(b) ? a : b);
        }
        return IntStream.range(0, 84).mapToObj(debut::plusDays)
                .map(d -> new Jour(d, pire.containsKey(d) ? pire.get(d).name().toLowerCase() : "")).toList();
    }

    private static int gravite(StatutPresence s) {
        return switch (s) { case PRESENT -> 0; case JUSTIFIE -> 1; case RETARD -> 2; case ABSENT -> 3; };
    }

    @Override
    public TableauAdmin pourAdmin() {
        LocalDate aujourdhui = LocalDate.now();
        Parametre p = parametres();
        List<Presence> semaine = presences.findBySeanceDateBetween(aujourdhui.minusDays(6), aujourdhui);
        List<StatutPresence> statuts = semaine.stream().map(Presence::getStatut).toList();

        // shortcut: charge toutes les presences en memoire, suffisant pour un etablissement ; passer a une requete GROUP BY au-dela de ~100 000 lignes
        List<EtudiantARisque> aRisque = presences.findAllBy().stream()
                .collect(Collectors.groupingBy(Presence::getEtudiant,
                        Collectors.mapping(Presence::getStatut, Collectors.toList())))
                .entrySet().stream()
                .filter(e -> TauxPresence.seuilDepasse(e.getValue(), p))
                .map(e -> new EtudiantARisque(e.getKey(), TauxPresence.taux(e.getValue(), p),
                        compter(e.getValue(), StatutPresence.ABSENT)))
                .sorted(Comparator.comparing(EtudiantARisque::taux))
                .toList();

        return new TableauAdmin(seances.findByDateBetweenOrderByDateAscHeureDebutAsc(aujourdhui, aujourdhui).size(),
                etudiants.count(), compter(statuts, StatutPresence.ABSENT), TauxPresence.taux(statuts, p),
                septJours(semaine, aujourdhui, p), aRisque);
    }

    private List<Point> septJours(List<Presence> semaine, LocalDate aujourdhui, Parametre p) {
        return IntStream.rangeClosed(0, 6).mapToObj(i -> aujourdhui.minusDays(6 - i)).map(jour -> new Point(jour,
                TauxPresence.taux(semaine.stream().filter(pr -> pr.getSeance().getDate().equals(jour))
                        .map(Presence::getStatut).toList(), p))).toList();
    }

    private Parametre parametres() {
        return parametres.findFirstByOrderByIdAsc().orElseGet(Parametre::new);
    }
}
