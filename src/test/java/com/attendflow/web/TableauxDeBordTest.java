package com.attendflow.web;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.Role;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.PresenceService;
import com.attendflow.service.StatistiqueService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TableauxDeBordTest {

    @Autowired MockMvc mvc;
    @Autowired SeanceRepository seances;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired EnseignantRepository enseignants;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired NotificationRepository notifications;
    @Autowired PresenceService presenceService;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");
    static final RequestPostProcessor AHMED = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor LINA = user("lina.ferjani@univ.tn").roles("ETUDIANT");

    Seance seance(LocalDate date, LocalTime debut, LocalTime fin) {
        Seance s = new Seance("T-" + UUID.randomUUID(), date, debut, fin, classes.findByNom("3ème INFO").orElseThrow(),
                matieres.findByCode("JAVA").orElseThrow(), salles.findByNom("A05").orElseThrow(),
                enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow());
        s.setEtat(EtatSeance.PLANIFIEE);
        return seances.saveAndFlush(s);
    }

    Object tableau(String url, RequestPostProcessor qui) throws Exception {
        return mvc.perform(get(url).with(qui)).andExpect(status().isOk())
                .andReturn().getModelAndView().getModel().get("tableau");
    }

    void absent(Etudiant lina, Seance s) {
        Utilisateur admin = utilisateurs.findByEmail("admin@univ.tn").orElseThrow();
        presenceService.enregistrer(admin, s.getId(), Map.of(lina.getId(), StatutPresence.ABSENT));
    }

    @Test
    void lesTroisTableauxSAffichent() throws Exception {
        assertThat(tableau("/admin", ADMIN)).isInstanceOf(StatistiqueService.TableauAdmin.class);
        assertThat(tableau("/enseignant", AHMED)).isInstanceOf(StatistiqueService.TableauEnseignant.class);
        assertThat(tableau("/etudiant", LINA)).isInstanceOf(StatistiqueService.TableauEtudiant.class);
    }

    @Test
    void seanceEnCoursApparaitDansLeTableauEnseignant() throws Exception {
        LocalTime maintenant = LocalTime.now();
        if (maintenant.isBefore(LocalTime.of(0, 30)) || maintenant.isAfter(LocalTime.of(23, 30))) return;
        seances.findByEnseignantAndDateBetweenOrderByDateAscHeureDebutAsc(
                        enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow(), LocalDate.now(), LocalDate.now())
                .forEach(s -> s.setEtat(EtatSeance.ANNULEE));
        Seance enCours = seance(LocalDate.now(), maintenant.minusMinutes(20), maintenant.plusMinutes(20));
        var t = (StatistiqueService.TableauEnseignant) tableau("/enseignant", AHMED);
        assertThat(t.seanceActuelle()).isNotNull();
        assertThat(t.seanceActuelle().getId()).isEqualTo(enCours.getId());
    }

    @Test
    void absencesComptentDansTableauxEtAlerteF34UneSeuleFois() throws Exception {
        Etudiant lina = (Etudiant) utilisateurs.findByEmail("lina.ferjani@univ.tn").orElseThrow();
        Utilisateur admin = utilisateurs.findByRole(Role.ADMIN).getFirst();
        long alertesAdmin = notifications.countByDestinataireAndLueFalse(admin);
        long alertesLina = notifications.countByDestinataireAndLueFalse(lina);

        absent(lina, seance(LocalDate.now().minusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0)));
        assertThat(notifications.countByDestinataireAndLueFalse(admin)).isEqualTo(alertesAdmin + 1);
        assertThat(notifications.countByDestinataireAndLueFalse(lina)).isEqualTo(alertesLina + 1);

        absent(lina, seance(LocalDate.now().minusDays(2), LocalTime.of(8, 0), LocalTime.of(10, 0)));
        assertThat(notifications.countByDestinataireAndLueFalse(admin)).isEqualTo(alertesAdmin + 1);

        var tEtudiant = (StatistiqueService.TableauEtudiant) tableau("/etudiant", LINA);
        assertThat(tEtudiant.absents()).isEqualTo(2);
        assertThat(tEtudiant.taux()).isZero();
        assertThat(tEtudiant.dernieresAbsences()).hasSize(2);

        var tAdmin = (StatistiqueService.TableauAdmin) tableau("/admin", ADMIN);
        assertThat(tAdmin.aRisque()).anyMatch(r -> r.etudiant().getId().equals(lina.getId()));
        assertThat(tAdmin.absents()).isGreaterThanOrEqualTo(2);
    }
}
