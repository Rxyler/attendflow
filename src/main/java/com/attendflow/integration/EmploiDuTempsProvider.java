package com.attendflow.integration;

import java.util.List;

/**
 * Source de l'emploi du temps (projet partenaire). AttendFlow la lit seulement (RG-09).
 * Aujourd'hui : EmploiDuTempsMock. Plus tard : une implementation REST du groupe partenaire,
 * sans rien changer au reste de l'application.
 */
public interface EmploiDuTempsProvider {

    List<SeanceExterne> recupererSeances();
}
