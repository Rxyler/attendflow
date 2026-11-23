package com.attendflow.service;

import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;

import java.time.LocalDate;
import java.util.List;

public interface RapportService {

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
