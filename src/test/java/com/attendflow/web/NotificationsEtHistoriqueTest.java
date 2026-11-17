package com.attendflow.web;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.*;
import com.attendflow.service.NotificationService;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class NotificationsEtHistoriqueTest {

    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired NotificationRepository notifications;
    @Autowired NotificationService notificationService;
    @Autowired PresenceService presenceService;
    @Autowired SeanceRepository seances;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired EnseignantRepository enseignants;

    static final RequestPostProcessor AHMED = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor SARA = user("sara.mansouri@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor MANAR = user("manar.nouira@univ.tn").roles("ETUDIANT");
    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");

    Utilisateur ahmed() { return utilisateurs.findByEmail("ahmed.bensalah@univ.tn").orElseThrow(); }

    Seance seance(LocalDate date, LocalTime debut) {
        Seance s = new Seance("T-" + UUID.randomUUID(), date, debut, debut.plusHours(2),
                classes.findByNom("3ème INFO").orElseThrow(), matieres.findByCode("JAVA").orElseThrow(),
                salles.findByNom("A05").orElseThrow(), enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow());
        s.setEtat(EtatSeance.PLANIFIEE);
        return seances.saveAndFlush(s);
    }

    @Test
    void pageListeEtMarquageLu() throws Exception {
        Notification n = notifications.save(new Notification(ahmed(), TypeNotification.SUCCES, "Test", "Message de test"));
        long avant = notificationService.nbNonLues(ahmed());

        mvc.perform(get("/notifications").with(AHMED)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Message de test")))
                .andExpect(model().attribute("nbNonLues", avant));

        mvc.perform(post("/notifications/" + n.getId() + "/lue").with(csrf()).with(AHMED))
                .andExpect(redirectedUrl("/notifications"));
        assertThat(notificationService.nbNonLues(ahmed())).isEqualTo(avant - 1);

        mvc.perform(post("/notifications/tout-lu").with(csrf()).with(AHMED));
        assertThat(notificationService.nbNonLues(ahmed())).isZero();
    }

    @Test
    void impossibleDeMarquerLaNotificationDUnAutre() throws Exception {
        Notification n = notifications.save(new Notification(ahmed(), TypeNotification.INFORMATION, "Privé", "x"));
        mvc.perform(post("/notifications/" + n.getId() + "/lue").with(csrf()).with(SARA));
        assertThat(notifications.findById(n.getId()).orElseThrow().isLue()).isFalse();
    }

    @Test
    void rappelF32UneSeuleFoisDansLaFenetre() {
        LocalDateTime maintenant = LocalDateTime.of(2031, 3, 3, 7, 50);
        seance(maintenant.toLocalDate(), LocalTime.of(8, 5));   // commence dans 15 min
        assertThat(notificationService.rappelsAvantSeance(maintenant)).isEqualTo(1);
        assertThat(notificationService.rappelsAvantSeance(maintenant.plusMinutes(5))).isZero();   // tick suivant
    }

    @Test
    void resumeF33ParEnseignant() {
        LocalDate jour = LocalDate.now().minusDays(1);
        Seance s = seance(jour, LocalTime.of(8, 0));
        Etudiant manar = (Etudiant) utilisateurs.findByEmail("manar.nouira@univ.tn").orElseThrow();
        presenceService.enregistrer(utilisateurs.findByEmail("admin@univ.tn").orElseThrow(), s.getId(),
                Map.of(manar.getId(), StatutPresence.ABSENT));
        assertThat(notificationService.resumeDuJour(jour)).isGreaterThanOrEqualTo(1);
        assertThat(notificationService.lister(ahmed())).anyMatch(n -> n.getTitre().equals("Absences du jour"));
    }

    @Test
    void historiqueEtudiantEtAdmin() throws Exception {
        Etudiant manar = (Etudiant) utilisateurs.findByEmail("manar.nouira@univ.tn").orElseThrow();
        Seance s = seance(LocalDate.now().minusDays(1), LocalTime.of(8, 0));
        presenceService.enregistrer(utilisateurs.findByEmail("admin@univ.tn").orElseThrow(), s.getId(),
                Map.of(manar.getId(), StatutPresence.RETARD));

        var h = (StatistiqueService.Historique) mvc.perform(get("/etudiant/historique").with(MANAR))
                .andExpect(status().isOk()).andReturn().getModelAndView().getModel().get("historique");
        assertThat(h.lignes()).anyMatch(p -> p.getSeance().getId().equals(s.getId()));
        assertThat(h.retards()).isGreaterThanOrEqualTo(1);
        assertThat(h.evolution()).isNotEmpty();

        mvc.perform(get("/admin/etudiants/" + manar.getId() + "/historique").with(ADMIN)).andExpect(status().isOk());
        mvc.perform(get("/admin/etudiants/" + manar.getId() + "/historique").with(AHMED)).andExpect(status().isForbidden());
        mvc.perform(get("/etudiant/historique").with(AHMED)).andExpect(status().isForbidden());
    }
}
