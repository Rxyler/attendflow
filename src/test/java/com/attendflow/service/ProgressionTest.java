package com.attendflow.service;

import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static com.attendflow.model.enums.StatutPresence.*;
import static org.assertj.core.api.Assertions.assertThat;

class ProgressionTest {

    @Test
    void aucuneSeance() {
        Progression p = Progression.de(List.of(), null);
        assertThat(p.points()).isZero();
        assertThat(p.niveau()).isEqualTo(1);
        assertThat(p.badgesObtenus()).isZero();
        assertThat(p.message("Plume")).contains("première séance");
    }

    @Test
    void serieEtRecord() {
        // du plus recent au plus ancien : 2 presents, une absence justifiee (ne casse pas), 1 retard, une absence, 3 presents
        Progression p = Progression.de(List.of(PRESENT, PRESENT, JUSTIFIE, RETARD, ABSENT, PRESENT, PRESENT, PRESENT), 80);
        assertThat(p.serie()).isEqualTo(3);
        assertThat(p.record()).isEqualTo(3);
        assertThat(p.points()).isEqualTo(10 * 5 + 5 + 2);
        assertThat(p.badges()).filteredOn(Progression.Badge::obtenu).extracting(Progression.Badge::nom)
                .containsExactly("Premier pas");
    }

    @Test
    void niveauxEtBadges() {
        Progression p = Progression.de(Collections.nCopies(25, PRESENT), 100);
        assertThat(p.points()).isEqualTo(250);
        assertThat(p.niveau()).isEqualTo(3);
        assertThat(p.titre()).isEqualTo("Assidu");
        assertThat(p.pourcentNiveau()).isEqualTo(50);
        assertThat(p.badgesObtenus()).isEqualTo(6);
        assertThat(p.message("Plume")).contains("25 séances");
    }
}
