package com.attendflow.service;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.enums.StatutPresence;

import java.util.List;

/**
 * Progression ludique d'un etudiant, recalculee a chaque affichage a partir de ses presences
 * (rien n'est stocke : elle suit toujours les corrections de l'enseignant).
 */
public record Progression(int points, int niveau, String titre, int pourcentNiveau,
                          int serie, int record, List<Badge> badges) {

    public static final int POINTS_PAR_NIVEAU = 100;
    private static final String[] TITRES = {"Débutant", "Régulier", "Assidu", "Exemplaire", "Légende"};

    public record Badge(String nom, String icone, String description, boolean obtenu) {}

    /** @param statuts du plus recent au plus ancien ; @param taux taux de presence (null si aucune seance) */
    public static Progression de(List<StatutPresence> statuts, Integer taux) {
        int points = 0, record = 0, courante = 0, presents = 0;
        // parcours chronologique : du plus ancien au plus recent
        for (StatutPresence s : statuts.reversed()) {
            points += switch (s) { case PRESENT -> 10; case RETARD -> 5; case JUSTIFIE -> 2; case ABSENT -> 0; };
            if (s == StatutPresence.PRESENT || s == StatutPresence.RETARD) {
                presents++;
                record = Math.max(record, ++courante);
            } else if (s == StatutPresence.ABSENT) {
                courante = 0;
            } // une absence justifiee ne casse pas la serie
        }
        int serie = courante;
        int niveau = points / POINTS_PAR_NIVEAU + 1;
        boolean dixSansRetard = statuts.size() >= 10
                && statuts.subList(0, 10).stream().allMatch(s -> s == StatutPresence.PRESENT);
        List<Badge> badges = List.of(
                new Badge(t("Premier pas"), "footprints", t("Une première présence"), presents >= 1),
                new Badge(t("Série de 5"), "flame", t("5 séances d’affilée"), record >= 5),
                new Badge(t("Série de 10"), "zap", t("10 séances d’affilée"), record >= 10),
                new Badge(t("Ponctuel"), "alarm-clock-check", t("10 dernières séances à l’heure"), dixSansRetard),
                new Badge(t("Assidu"), "target", t("Taux de présence ≥ 90 %"), taux != null && taux >= 90 && statuts.size() >= 5),
                new Badge(t("Centurion"), "trophy", t("200 points cumulés"), points >= 200));
        return new Progression(points, niveau, t(TITRES[Math.min(niveau, TITRES.length) - 1]),
                points % POINTS_PAR_NIVEAU, serie, record, badges);
    }

    public long badgesObtenus() {
        return badges.stream().filter(Badge::obtenu).count();
    }

    /** Ce que dit le compagnon sur le tableau de bord. */
    public String message(String compagnon) {
        if (record == 0 && points == 0) return t("{0} t’attend à ta première séance.", compagnon);
        if (serie >= 5) return t("{0} est fier de toi : {1} séances d’affilée !", compagnon, serie);
        if (serie > 0) return t("{0} te félicite, garde ta série !", compagnon);
        return t("Une absence, ça arrive. {0} compte sur toi au prochain cours.", compagnon);
    }
}
