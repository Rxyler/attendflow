package com.attendflow.service.impl;

import com.attendflow.model.Presence;
import com.attendflow.model.Seance;
import com.attendflow.model.enums.StatutPresence;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CalendrierTest {

    Presence presence(LocalDate date, StatutPresence statut) {
        Seance s = new Seance(); s.setDate(date);
        Presence p = new Presence(); p.setSeance(s); p.setStatut(statut);
        return p;
    }

    @Test
    void douzeSemainesEtPireStatutDuJour() {
        LocalDate lundi = LocalDate.of(2026, 11, 16);
        var jours = StatistiqueServiceImpl.calendrier(List.of(
                presence(lundi, StatutPresence.PRESENT), presence(lundi, StatutPresence.ABSENT),
                presence(lundi.plusDays(1), StatutPresence.RETARD),
                presence(lundi.minusWeeks(20), StatutPresence.ABSENT)), lundi);
        assertThat(jours).hasSize(84);
        assertThat(jours.getFirst().date()).isEqualTo(lundi.minusWeeks(11));
        assertThat(jours.getLast().date()).isEqualTo(lundi.plusDays(6));
        assertThat(jours.get(77).etat()).isEqualTo("absent");
        assertThat(jours.get(78).etat()).isEqualTo("retard");
        assertThat(jours).filteredOn(j -> !j.etat().isEmpty()).hasSize(2);
    }
}
