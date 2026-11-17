package com.attendflow.service;

import com.attendflow.model.Etudiant;
import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.StatutPresence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** F-16 a F-23 : prise des presences, coeur du systeme. */
public interface PresenceService {

    /** Une ligne de la feuille : un etudiant de la classe et son statut actuel. */
    record Ligne(Etudiant etudiant, StatutPresence statut) {}

    /**
     * Feuille de presence d'une seance.
     * @param modifiable  false si la saisie est verrouillee pour cet utilisateur
     * @param raisonVerrou explication affichee quand {@code modifiable} est false
     * @param dejaSaisie  true si des presences ont deja ete enregistrees
     */
    record Feuille(Seance seance, List<Ligne> lignes, boolean modifiable, String raisonVerrou,
                   boolean dejaSaisie, LocalDateTime limiteModification) {}

    /**
     * @throws org.springframework.security.access.AccessDeniedException si la seance n'est pas
     *         celle de l'enseignant (RG-03)
     */
    Feuille ouvrir(Utilisateur utilisateur, Long seanceId);

    /**
     * Enregistre les statuts (cle = id etudiant). Toute modification d'un statut existant est tracee (RG-08).
     * @return le nombre de presences enregistrees
     * @throws IllegalStateException si la saisie est verrouillee (seance annulee, future ou delai depasse)
     */
    int enregistrer(Utilisateur utilisateur, Long seanceId, Map<Long, StatutPresence> statuts);
}
