package com.attendflow.service;

import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** F-13 a F-15 : emploi du temps en lecture seule, limite a ce que chaque role a le droit de voir. */
public interface EmploiDuTempsService {

    /**
     * Seances du lundi au vendredi de la semaine qui commence a {@code lundi}.
     * Admin : toutes (filtres classe / enseignant optionnels, F-14). Enseignant : les siennes.
     * Etudiant : celles de sa classe. Les filtres sont ignores pour les non-admins.
     */
    List<Seance> seancesDeLaSemaine(Utilisateur utilisateur, LocalDate lundi, Long classeId, Long enseignantId);

    /** F-15 : details d'une seance, seulement si l'utilisateur a le droit de la voir. */
    Optional<Seance> seanceVisible(Utilisateur utilisateur, Long seanceId);
}
