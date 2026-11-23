package com.attendflow.service;

import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EmploiDuTempsService {

    List<Seance> seancesDeLaSemaine(Utilisateur utilisateur, LocalDate lundi, Long classeId, Long enseignantId);

    Optional<Seance> seanceVisible(Utilisateur utilisateur, Long seanceId);
}
