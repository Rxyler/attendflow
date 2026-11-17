package com.attendflow.service;

import com.attendflow.integration.SeanceExterne;
import com.attendflow.model.Etudiant;
import com.attendflow.model.JournalSynchronisation;
import com.attendflow.model.Presence;
import com.attendflow.model.Seance;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.Role;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.model.enums.StatutSynchronisation;
import com.attendflow.repository.*;
import com.attendflow.service.impl.SynchronisationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Utilise les donnees de demo (classes, matieres, enseignants) et une source partenaire
 * controlee par le test. Tout est annule apres chaque test (@Transactional).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SynchronisationServiceTest {

    @Autowired SeanceRepository seances;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired EnseignantRepository enseignants;
    @Autowired JournalSynchronisationRepository journaux;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired NotificationRepository notifications;
    @Autowired NotificationService notificationService;
    @Autowired EtudiantRepository etudiants;
    @Autowired PresenceRepository presences;
    @Autowired MockMvc mvc;

    final List<SeanceExterne> source = new ArrayList<>();
    SynchronisationServiceImpl service;

    static final LocalDate JOUR = LocalDate.of(2030, 1, 7);

    @BeforeEach
    void init() {
        service = new SynchronisationServiceImpl(() -> source, seances, classes, matieres, salles, enseignants,
                journaux, utilisateurs, notificationService);
    }

    SeanceExterne seance(String salle, boolean annulee) {
        return new SeanceExterne("TEST-1", JOUR, LocalTime.of(8, 0), LocalTime.of(10, 0),
                "3ème INFO", "JAVA", salle, "ahmed.bensalah@univ.tn", annulee);
    }

    Seance enBase() {
        return seances.findByIdExterne("TEST-1").orElseThrow();
    }

    @Test
    void ajoutPuisAucunChangementPuisModification() {
        source.add(seance("A05", false));
        JournalSynchronisation j1 = service.synchroniser(null);
        assertThat(j1.getNbAjoutees()).isEqualTo(1);
        assertThat(j1.getStatut()).isEqualTo(StatutSynchronisation.SUCCES);
        assertThat(enBase().getEtat()).isEqualTo(EtatSeance.PLANIFIEE);

        JournalSynchronisation j2 = service.synchroniser(null);
        assertThat(j2.getNbAjoutees() + j2.getNbModifiees() + j2.getNbAnnulees()).isZero();

        source.set(0, seance("SALLE-NEUVE", false));
        JournalSynchronisation j3 = service.synchroniser(null);
        assertThat(j3.getNbModifiees()).isEqualTo(1);
        assertThat(enBase().getEtat()).isEqualTo(EtatSeance.MODIFIEE);
        assertThat(enBase().getSalle().getNom()).isEqualTo("SALLE-NEUVE");
    }

    @Test
    void annulationConservePresencesEtAlerteAdmin() {
        source.add(seance("A05", false));
        service.synchroniser(null);
        Etudiant manar = (Etudiant) utilisateurs.findByEmail("manar.nouira@univ.tn").orElseThrow();
        Seance s = enBase();
        s.getPresences().add(new Presence(s, manar, StatutPresence.PRESENT));
        seances.saveAndFlush(s);

        var admin = utilisateurs.findByRole(Role.ADMIN).getFirst();
        long notifsAvant = notifications.countByDestinataireAndLueFalse(admin);

        source.set(0, seance("A05", true));
        JournalSynchronisation j = service.synchroniser(null);

        assertThat(j.getNbAnnulees()).isEqualTo(1);
        assertThat(enBase().getEtat()).isEqualTo(EtatSeance.ANNULEE);
        assertThat(enBase().isOuvertePourPresences()).isFalse();
        assertThat(presences.findBySeance(enBase())).hasSize(1);
        assertThat(notifications.countByDestinataireAndLueFalse(admin)).isEqualTo(notifsAvant + 1);
    }

    @Test
    void referenceInconnueDonnePartiel() {
        source.add(seance("A05", false));
        source.add(new SeanceExterne("TEST-2", JOUR, LocalTime.of(10, 0), LocalTime.of(12, 0),
                "CLASSE-INEXISTANTE", "JAVA", "A05", "ahmed.bensalah@univ.tn", false));
        JournalSynchronisation j = service.synchroniser(null);
        assertThat(j.getStatut()).isEqualTo(StatutSynchronisation.PARTIEL);
        assertThat(j.getNbAjoutees()).isEqualTo(1);
        assertThat(j.getMessage()).contains("TEST-2").contains("CLASSE-INEXISTANTE");
    }

    @Test
    void sourceInjoignableDonneEchec() {
        service = new SynchronisationServiceImpl(() -> { throw new IllegalStateException("timeout"); }, seances,
                classes, matieres, salles, enseignants, journaux, utilisateurs, notificationService);
        JournalSynchronisation j = service.synchroniser(null);
        assertThat(j.getStatut()).isEqualTo(StatutSynchronisation.ECHEC);
        assertThat(j.getMessage()).contains("timeout");
    }

    @Test
    void demoImporteeAuDemarrageEtPageAdmin() throws Exception {
        // DonneesDemo a importe le planning fictif au demarrage
        assertThat(seances.count()).isGreaterThan(0);

        mvc.perform(post("/admin/synchronisation").with(csrf()).with(user("admin@univ.tn").roles("ADMIN")))
                .andExpect(redirectedUrl("/admin/synchronisation"));
        mvc.perform(get("/admin/synchronisation").with(user("admin@univ.tn").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Super Admin")));
        mvc.perform(get("/admin/synchronisation").with(user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT")))
                .andExpect(status().isForbidden());
    }
}
