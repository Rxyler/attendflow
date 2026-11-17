package com.attendflow.service;

import com.attendflow.model.Enseignant;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Presence;
import com.attendflow.model.Seance;

import java.time.LocalDate;
import java.util.List;

/** F-26, F-27 et tableau de bord admin. Les taux suivent RG-04 et les parametres de l'admin. */
public interface StatistiqueService {

    /** Un point du graphique : taux du jour, null si aucune presence ce jour-la. */
    record Point(LocalDate jour, Integer taux) {}

    record EtudiantARisque(Etudiant etudiant, Integer taux, long absences) {}

    /** F-26 : chiffres sur les 7 derniers jours (aujourd'hui inclus). */
    record TableauEnseignant(List<Seance> seancesDuJour, Seance seanceActuelle, List<Seance> prochaines,
                             long presents, long absents, long retards, Integer taux, List<Point> septJours) {}

    /** F-27 : chiffres depuis le debut de l'annee. */
    record TableauEtudiant(Integer taux, long presents, long absents, long retards, long justifies,
                           Seance prochaineSeance, List<Presence> dernieresAbsences, Progression progression,
                           int defiFaites, int defiTotal, List<Jour> calendrier) {}

    /** Une case du calendrier de presence : etat = present, retard, absent, justifie ou vide (pas de seance). */
    record Jour(LocalDate date, String etat) {}

    record TableauAdmin(int seancesDuJour, long etudiants, long absents, Integer taux,
                        List<Point> septJours, List<EtudiantARisque> aRisque) {}

    /** F-28 : historique detaille, le plus recent d'abord, et evolution du taux cumule dans le temps. */
    record Historique(Integer taux, long presents, long absents, long retards, long justifies,
                      List<Presence> lignes, List<Point> evolution) {}

    Historique historique(Etudiant etudiant);

    TableauEnseignant pourEnseignant(Enseignant enseignant);

    TableauEtudiant pourEtudiant(Etudiant etudiant);

    TableauAdmin pourAdmin();
}
