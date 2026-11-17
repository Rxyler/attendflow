package com.attendflow.service.impl;

import com.attendflow.model.Admin;
import com.attendflow.model.Parametre;
import com.attendflow.repository.ParametreRepository;
import com.attendflow.service.ParametreService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParametreServiceImpl implements ParametreService {

    private final ParametreRepository parametres;

    public ParametreServiceImpl(ParametreRepository parametres) {
        this.parametres = parametres;
    }

    @Override
    @Transactional(readOnly = true)
    public Parametre courant() {
        return parametres.findFirstByOrderByIdAsc().orElseGet(Parametre::new);
    }

    @Override
    @Transactional
    public Parametre modifier(Admin admin, ParametreForm f) {
        verifier(f.seuilAbsence() != null && f.seuilAbsence() > 0 && f.seuilAbsence() <= 100,
                "Le seuil d'absence doit être compris entre 0 et 100 %.");
        verifier(f.nbMaxAbsencesNonJustifiees() != null && f.nbMaxAbsencesNonJustifiees() >= 1 && f.nbMaxAbsencesNonJustifiees() <= 200,
                "Le nombre maximal d'absences non justifiées doit être compris entre 1 et 200.");
        verifier(f.delaiModificationHeures() != null && f.delaiModificationHeures() >= 0 && f.delaiModificationHeures() <= 720,
                "Le délai de modification doit être compris entre 0 et 720 heures (30 jours).");

        Parametre p = parametres.findFirstByOrderByIdAsc().orElseGet(Parametre::new);
        p.setSeuilAbsence(f.seuilAbsence());
        p.setNbMaxAbsencesNonJustifiees(f.nbMaxAbsencesNonJustifiees());
        p.setDelaiModificationHeures(f.delaiModificationHeures());
        p.setRetardCommePresent(Boolean.TRUE.equals(f.retardCommePresent()));
        p.setJustifieCommePresent(Boolean.TRUE.equals(f.justifieCommePresent()));
        p.setModifiePar(admin);
        return parametres.save(p);
    }

    private static void verifier(boolean ok, String message) {
        if (!ok) throw new IllegalArgumentException(message);
    }
}
