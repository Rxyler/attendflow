package com.attendflow.integration;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Une seance telle que fournie par le projet partenaire (contrat d'interface, F-11).
 * Identifiants communs : nom de classe, code matiere, nom de salle, email enseignant.
 */
public record SeanceExterne(
        String idExterne,
        LocalDate date,
        LocalTime heureDebut,
        LocalTime heureFin,
        String classe,
        String codeMatiere,
        String salle,
        String emailEnseignant,
        boolean annulee
) {
}
