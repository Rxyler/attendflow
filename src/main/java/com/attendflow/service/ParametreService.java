package com.attendflow.service;

import com.attendflow.model.Admin;
import com.attendflow.model.Parametre;

/** Parametres de la plateforme (RG-04, RG-05, F-22), modifiables par l'administrateur. */
public interface ParametreService {

    /** Checkbox decochee = parametre absent de la requete, d'ou Boolean (null = faux). */
    record ParametreForm(Double seuilAbsence, Integer nbMaxAbsencesNonJustifiees, Integer delaiModificationHeures,
                         Boolean retardCommePresent, Boolean justifieCommePresent) {
        public static ParametreForm de(Parametre p) {
            return new ParametreForm(p.getSeuilAbsence(), p.getNbMaxAbsencesNonJustifiees(), p.getDelaiModificationHeures(),
                    p.isRetardCommePresent(), p.isJustifieCommePresent());
        }
    }

    Parametre courant();

    /** @throws IllegalArgumentException si une valeur est hors limites. */
    Parametre modifier(Admin admin, ParametreForm form);
}
