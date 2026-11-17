package com.attendflow.service;

import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;

import java.time.LocalDate;
import java.util.List;

/** Ecran 8 / F-29 et F-30 : rapports filtrables et indicateurs. Un enseignant ne voit que ses seances. */
public interface RapportService {

    /** Filtres F-29 ; null = tous. Periode par defaut : les 30 derniers jours. */
    record Filtres(LocalDate du, LocalDate au, Long classeId, Long matiereId, Long enseignantId) {}

    record ParClasse(String classe, Integer taux, long presences) {}

    record ParMatiere(String matiere, long absences, Integer taux) {}

    record LigneSeance(Seance seance, long presents, long absents, long retards, long justifies, Integer taux) {}

    record Rapport(Filtres filtres, String description, long nbSeances, Integer taux,
                   long presents, long absents, long retards, long justifies,
                   List<ParClasse> parClasse, List<ParMatiere> parMatiere,
                   List<StatistiqueService.Point> evolution, List<StatistiqueService.EtudiantARisque> aRisque,
                   List<LigneSeance> seances) {}

    Rapport generer(Utilisateur utilisateur, Filtres filtres);
}
