package com.attendflow.integration;

import java.time.LocalDate;
import java.time.LocalTime;

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
