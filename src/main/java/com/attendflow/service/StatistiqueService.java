package com.attendflow.service;

import com.attendflow.model.Enseignant;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Presence;
import com.attendflow.model.Seance;

import java.time.LocalDate;
import java.util.List;

public interface StatistiqueService {

    record Point(LocalDate jour, Integer taux) {}

    record EtudiantARisque(Etudiant etudiant, Integer taux, long absences) {}

    record TableauEnseignant(List<Seance> seancesDuJour, Seance seanceActuelle, List<Seance> prochaines,
                             long presents, long absents, long retards, Integer taux, List<Point> septJours) {}

    record TableauEtudiant(Integer taux, long presents, long absents, long retards, long justifies,
                           Seance prochaineSeance, List<Presence> dernieresAbsences, Progression progression,
                           int defiFaites, int defiTotal, List<Jour> calendrier) {}

    record Jour(LocalDate date, String etat) {}

    record TableauAdmin(int seancesDuJour, long etudiants, long absents, Integer taux,
                        List<Point> septJours, List<EtudiantARisque> aRisque) {}

    record Historique(Integer taux, long presents, long absents, long retards, long justifies,
                      List<Presence> lignes, List<Point> evolution) {}

    Historique historique(Etudiant etudiant);

    TableauEnseignant pourEnseignant(Enseignant enseignant);

    TableauEtudiant pourEtudiant(Etudiant etudiant);

    TableauAdmin pourAdmin();
}
