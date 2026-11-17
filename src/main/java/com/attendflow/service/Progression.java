package com.attendflow.service;

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
                new Badge("Premier pas", "footprints", "Une première présence", presents >= 1),
                new Badge("Série de 5", "flame", "5 séances d’affilée", record >= 5),
                new Badge("Série de 10", "zap", "10 séances d’affilée", record >= 10),
                new Badge("Ponctuel", "alarm-clock-check", "10 dernières séances à l’heure", dixSansRetard),
                new Badge("Assidu", "target", "Taux de présence ≥ 90 %", taux != null && taux >= 90 && statuts.size() >= 5),
                new Badge("Centurion", "trophy", "200 points cumulés", points >= 200));
        return new Progression(points, niveau, TITRES[Math.min(niveau, TITRES.length) - 1],
                points % POINTS_PAR_NIVEAU, serie, record, badges);
    }

    public long badgesObtenus() {
        return badges.stream().filter(Badge::obtenu).count();
    }

    /** Ce que dit le compagnon sur le tableau de bord. */
    public String message(String compagnon) {
        if (record == 0 && points == 0) return compagnon + " t’attend à ta première séance.";
        if (serie >= 5) return compagnon + " est fier de toi : " + serie + " séances d’affilée !";
        if (serie > 0) return compagnon + " te félicite, garde ta série !";
        return "Une absence, ça arrive. " + compagnon + " compte sur toi au prochain cours.";
    }
}
