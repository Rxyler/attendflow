package com.attendflow.service;

import com.attendflow.model.Admin;
import com.attendflow.model.Parametre;

public interface ParametreService {

    record ParametreForm(Double seuilAbsence, Integer nbMaxAbsencesNonJustifiees, Integer delaiModificationHeures,
                         Boolean retardCommePresent, Boolean justifieCommePresent) {
        public static ParametreForm de(Parametre p) {
            return new ParametreForm(p.getSeuilAbsence(), p.getNbMaxAbsencesNonJustifiees(), p.getDelaiModificationHeures(),
                    p.isRetardCommePresent(), p.isJustifieCommePresent());
        }
    }

    Parametre courant();

    Parametre modifier(Admin admin, ParametreForm form);
}
