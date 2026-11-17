package com.attendflow.service;

import com.attendflow.model.Admin;
import com.attendflow.model.JournalSynchronisation;

import java.util.List;

/** F-11 / F-12 : synchronisation de l'emploi du temps fourni par le projet partenaire. */
public interface SynchronisationService {

    /**
     * Importe les seances : ajoute les nouvelles, met a jour les modifiees, annule les annulees
     * (sans jamais supprimer les presences deja saisies, RG-10) et ecrit une ligne de journal.
     *
     * @param declencheur l'administrateur qui a lance la synchro, ou null si automatique
     */
    JournalSynchronisation synchroniser(Admin declencheur);

    List<JournalSynchronisation> derniersJournaux();
}
