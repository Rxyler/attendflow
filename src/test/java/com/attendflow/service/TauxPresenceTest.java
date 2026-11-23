package com.attendflow.service;

import com.attendflow.model.Parametre;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.attendflow.model.enums.StatutPresence.*;
import static org.assertj.core.api.Assertions.assertThat;

class TauxPresenceTest {

    @Test
    void rg04RetardsEtJustifiesSelonParametres() {
        var statuts = List.of(PRESENT, PRESENT, RETARD, JUSTIFIE, ABSENT);
        Parametre p = new Parametre();
        assertThat(TauxPresence.taux(statuts, p)).isEqualTo(80);
        p.setRetardCommePresent(false);
        assertThat(TauxPresence.taux(statuts, p)).isEqualTo(60);
        p.setJustifieCommePresent(false);
        assertThat(TauxPresence.taux(statuts, p)).isEqualTo(40);
        assertThat(TauxPresence.taux(List.of(), p)).isNull();
    }

    @Test
    void rg05SeuilParTauxOuParNombreAbsences() {
        Parametre p = new Parametre();
        assertThat(TauxPresence.seuilDepasse(List.of(PRESENT, PRESENT, PRESENT, PRESENT, ABSENT), p)).isTrue();
        assertThat(TauxPresence.seuilDepasse(List.of(PRESENT, PRESENT, PRESENT, PRESENT, PRESENT, ABSENT), p)).isFalse();
        p.setSeuilAbsence(99.0);
        p.setNbMaxAbsencesNonJustifiees(1);
        assertThat(TauxPresence.seuilDepasse(List.of(PRESENT, PRESENT, PRESENT, PRESENT, ABSENT, ABSENT), p)).isTrue();
        assertThat(TauxPresence.seuilDepasse(List.of(), p)).isFalse();
    }
}
