package com.attendflow.service;

import com.attendflow.model.Etudiant;
import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.StatutPresence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface PresenceService {

    record Ligne(Etudiant etudiant, StatutPresence statut) {}

    record Feuille(Seance seance, List<Ligne> lignes, boolean modifiable, String raisonVerrou,
                   boolean dejaSaisie, LocalDateTime limiteModification) {}

    Feuille ouvrir(Utilisateur utilisateur, Long seanceId);

    int enregistrer(Utilisateur utilisateur, Long seanceId, Map<Long, StatutPresence> statuts);
}
