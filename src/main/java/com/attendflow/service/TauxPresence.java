package com.attendflow.service;

import com.attendflow.model.Parametre;
import com.attendflow.model.enums.StatutPresence;

import java.util.Collection;

/** Regles de calcul partagees par tous les ecrans (une seule source de verite). */
public final class TauxPresence {

    private TauxPresence() {}

    /**
     * RG-04 : taux = (presences + retards + justifies) / total x 100.
     * Retards et justifies ne comptent que si les parametres l'autorisent.
     * @return le taux arrondi, ou null s'il n'y a encore aucune presence
     */
    public static Integer taux(Collection<StatutPresence> statuts, Parametre p) {
        if (statuts.isEmpty()) return null;
        long comptes = statuts.stream().filter(s -> switch (s) {
            case PRESENT -> true;
            case RETARD -> p.isRetardCommePresent();
            case JUSTIFIE -> p.isJustifieCommePresent();
            case ABSENT -> false;
        }).count();
        return (int) Math.round(comptes * 100.0 / statuts.size());
    }

    /** RG-05 : seuil depasse si le taux d'absence atteint le seuil, ou trop d'absences non justifiees. */
    public static boolean seuilDepasse(Collection<StatutPresence> statuts, Parametre p) {
        Integer t = taux(statuts, p);
        if (t == null) return false;
        long absences = statuts.stream().filter(s -> s == StatutPresence.ABSENT).count();
        return 100 - t >= p.getSeuilAbsence() || absences > p.getNbMaxAbsencesNonJustifiees();
    }

    public static long compter(Collection<StatutPresence> statuts, StatutPresence statut) {
        return statuts.stream().filter(s -> s == statut).count();
    }
}
