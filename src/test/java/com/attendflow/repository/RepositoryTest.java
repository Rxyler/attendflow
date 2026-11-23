package com.attendflow.repository;

import com.attendflow.model.*;
import com.attendflow.model.enums.StatutPresence;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class RepositoryTest {

    @Autowired UtilisateurRepository utilisateurs;
    @Autowired EnseignantRepository enseignants;
    @Autowired EtudiantRepository etudiants;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired SeanceRepository seances;
    @Autowired PresenceRepository presences;

    @Test
    void queriesWorkAndDuplicatePresenceIsRejected() {
        Classe classe = classes.save(new Classe("3ème INFO", "Licence 3", "Ahmed Ben Salah", "2026-2027"));
        Matiere matiere = matieres.save(new Matiere("Java", "JAVA", 3.0));
        Salle salle = salles.save(new Salle("A05", 30));
        Enseignant prof = enseignants.save(new Enseignant("Ben Salah", "Ahmed", "ahmed@univ.tn", "x", "Informatique"));
        Etudiant lina = etudiants.save(new Etudiant("Ferjani", "Lina", "lina@univ.tn", "x", "20260001", classe));
        LocalDate jour = LocalDate.of(2026, 9, 25);
        Seance seance = seances.save(new Seance("EXT-1", jour, LocalTime.of(8, 0), LocalTime.of(10, 0), classe, matiere, salle, prof));

        assertThat(utilisateurs.findByEmail("lina@univ.tn")).get().isInstanceOf(Etudiant.class);
        assertThat(etudiants.findByClasseOrderByNomAscPrenomAsc(classe)).containsExactly(lina);
        assertThat(seances.findByIdExterne("EXT-1")).isPresent();
        assertThat(seances.findByEnseignantAndDateBetweenOrderByDateAscHeureDebutAsc(prof, jour, jour)).hasSize(1);

        presences.saveAndFlush(new Presence(seance, lina, StatutPresence.PRESENT));
        assertThat(presences.findByEtudiantOrderBySeanceDateDesc(lina)).hasSize(1);

        assertThatThrownBy(() -> presences.saveAndFlush(new Presence(seance, lina, StatutPresence.ABSENT)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
