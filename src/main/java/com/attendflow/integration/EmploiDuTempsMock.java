package com.attendflow.integration;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

@Component
public class EmploiDuTempsMock implements EmploiDuTempsProvider {

    private static final String AHMED = "ahmed.bensalah@univ.tn";
    private static final String SARA = "sara.mansouri@univ.tn";
    private static final String RAMI = "rami.gharbi@univ.tn";

    private record Creneau(int jour, int heure, String classe, String matiere, String salle, String prof, boolean annulee) {}

    private static final List<Creneau> SEMAINE_TYPE = List.of(
            new Creneau(1, 8, "3ème INFO", "DEV-WEB", "B12", AHMED, false),
            new Creneau(1, 10, "3ème INFO", "BDD", "B08", SARA, false),
            new Creneau(1, 10, "2ème INFO", "RES", "A03", RAMI, false),
            new Creneau(1, 14, "2ème INFO", "JAVA", "A05", AHMED, false),
            new Creneau(1, 16, "3ème RÉSEAUX", "SYS", "C04", RAMI, true),
            new Creneau(2, 8, "1ère INFO", "ALGO", "A01", SARA, false),
            new Creneau(2, 14, "3ème INFO", "DEV-WEB", "B12", AHMED, false),
            new Creneau(2, 16, "3ème RÉSEAUX", "RES", "A03", RAMI, false),
            new Creneau(3, 8, "3ème INFO", "JAVA", "A05", AHMED, false),
            new Creneau(3, 10, "1ère INFO", "BDD", "B08", SARA, false),
            new Creneau(3, 16, "2ème INFO", "SYS", "C04", RAMI, false),
            new Creneau(4, 10, "3ème INFO", "DEV-WEB", "B12", AHMED, false),
            new Creneau(4, 14, "3ème INFO", "BDD", "B08", SARA, false),
            new Creneau(4, 16, "2ème INFO", "RES", "A03", RAMI, false),
            new Creneau(5, 8, "3ème INFO", "DEV-WEB", "B12", AHMED, false),
            new Creneau(5, 10, "1ère INFO", "ALGO", "A01", SARA, true)
    );

    @Override
    public List<SeanceExterne> recupererSeances() {
        LocalDate lundi = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<SeanceExterne> seances = new ArrayList<>();
        for (int semaine = -1; semaine <= 1; semaine++) {
            for (Creneau c : SEMAINE_TYPE) {
                LocalDate date = lundi.plusWeeks(semaine).plusDays(c.jour() - 1);
                String id = "EDT-%s-%02d-%s".formatted(date, c.heure(), c.matiere());
                seances.add(new SeanceExterne(id, date, LocalTime.of(c.heure(), 0), LocalTime.of(c.heure() + 2, 0),
                        c.classe(), c.matiere(), c.salle(), c.prof(), c.annulee()));
            }
        }
        return seances;
    }
}
