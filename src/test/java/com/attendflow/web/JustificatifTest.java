package com.attendflow.web;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatJustificatif;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.PresenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JustificatifTest {

    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired PresenceService presenceService;
    @Autowired PresenceRepository presences;
    @Autowired JustificatifRepository justificatifs;
    @Autowired SeanceRepository seances;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired EnseignantRepository enseignants;

    static final RequestPostProcessor MANAR = user("manar.nouira@univ.tn").roles("ETUDIANT");
    static final RequestPostProcessor AUTRE_ETUDIANT = user("ahmed.trabelsi@univ.tn").roles("ETUDIANT");
    static final RequestPostProcessor AHMED_PROF = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");

    static final byte[] PDF = "%PDF-1.4 certificat".getBytes();

    Presence absence;

    @BeforeEach
    void absenceDeManar() {
        Seance s = new Seance("T-" + UUID.randomUUID(), LocalDate.now().minusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0),
                classes.findByNom("3ème INFO").orElseThrow(), matieres.findByCode("JAVA").orElseThrow(),
                salles.findByNom("A05").orElseThrow(), enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow());
        s.setEtat(EtatSeance.PLANIFIEE);
        seances.saveAndFlush(s);
        Etudiant manar = (Etudiant) utilisateurs.findByEmail("manar.nouira@univ.tn").orElseThrow();
        presenceService.enregistrer(utilisateurs.findByEmail("admin@univ.tn").orElseThrow(), s.getId(),
                Map.of(manar.getId(), StatutPresence.ABSENT));
        absence = presences.findBySeance(s).getFirst();
    }

    ResultActions deposer(RequestPostProcessor qui, Long presenceId, String nomFichier, byte[] contenu, String motif) throws Exception {
        return mvc.perform(multipart("/etudiant/justificatifs")
                .file(new MockMultipartFile("fichier", nomFichier, "application/octet-stream", contenu))
                .param("presence", presenceId.toString()).param("motif", motif)
                .with(csrf()).with(qui));
    }

    Justificatif leJustificatif() {
        return justificatifs.findAll().stream()
                .filter(j -> j.getPresence().getId().equals(absence.getId())).findFirst().orElseThrow();
    }

    @Test
    void depotPuisAcceptationRendLAbsenceJustifiee() throws Exception {
        deposer(MANAR, absence.getId(), "certificat.pdf", PDF, "Certificat médical")
                .andExpect(flash().attributeExists("succes"));
        Justificatif j = leJustificatif();
        assertThat(j.getEtat()).isEqualTo(EtatJustificatif.EN_ATTENTE);

        mvc.perform(get("/justificatifs/" + j.getId() + "/fichier").with(MANAR)).andExpect(status().isOk());
        mvc.perform(get("/justificatifs/" + j.getId() + "/fichier").with(ADMIN)).andExpect(status().isOk());
        mvc.perform(get("/justificatifs/" + j.getId() + "/fichier").with(AUTRE_ETUDIANT)).andExpect(status().isForbidden());
        mvc.perform(get("/justificatifs/" + j.getId() + "/fichier").with(AHMED_PROF)).andExpect(status().isForbidden());

        // deuxieme depot refuse tant que le premier est en attente
        deposer(MANAR, absence.getId(), "autre.pdf", PDF, "Encore").andExpect(flash().attributeExists("erreur"));

        mvc.perform(post("/admin/justificatifs/" + j.getId() + "/accepter").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("succes"));
        Presence p = presences.findById(absence.getId()).orElseThrow();
        assertThat(p.getStatut()).isEqualTo(StatutPresence.JUSTIFIE);   // F-25
        assertThat(p.getHistorique()).anyMatch(h -> h.getNouveauStatut() == StatutPresence.JUSTIFIE
                && h.getAuteur().getEmail().equals("admin@univ.tn"));   // RG-08
        assertThat(leJustificatif().getTraitePar().getEmail()).isEqualTo("admin@univ.tn");

        // deja traite
        mvc.perform(post("/admin/justificatifs/" + j.getId() + "/refuser").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("erreur"));
    }

    @Test
    void refusPermetUnNouveauDepot() throws Exception {
        deposer(MANAR, absence.getId(), "flou.jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1}, "Photo")
                .andExpect(flash().attributeExists("succes"));
        Long id = leJustificatif().getId();
        mvc.perform(post("/admin/justificatifs/" + id + "/refuser").with(csrf()).with(ADMIN));
        assertThat(presences.findById(absence.getId()).orElseThrow().getStatut()).isEqualTo(StatutPresence.ABSENT);

        deposer(MANAR, absence.getId(), "net.pdf", PDF, "Certificat lisible").andExpect(flash().attributeExists("succes"));
        assertThat(leJustificatif().getEtat()).isEqualTo(EtatJustificatif.EN_ATTENTE);
        assertThat(leJustificatif().getId()).isEqualTo(id);   // remplace, pas de doublon
    }

    @Test
    void fichiersEtDemandesInvalidesRefuses() throws Exception {
        deposer(MANAR, absence.getId(), "virus.exe", PDF, "x").andExpect(flash().attributeExists("erreur"));
        deposer(MANAR, absence.getId(), "faux.pdf", "MZ pas un pdf".getBytes(), "x").andExpect(flash().attributeExists("erreur"));
        deposer(MANAR, absence.getId(), "ok.pdf", PDF, "   ").andExpect(flash().attributeExists("erreur"));
        deposer(AUTRE_ETUDIANT, absence.getId(), "ok.pdf", PDF, "pas mon absence").andExpect(flash().attributeExists("erreur"));
        assertThat(justificatifs.findAll()).noneMatch(j -> j.getPresence().getId().equals(absence.getId()));
    }

    @Test
    void pagesSelonLeRole() throws Exception {
        mvc.perform(get("/etudiant/justificatifs").with(MANAR)).andExpect(status().isOk())
                .andExpect(model().attribute("absences", org.hamcrest.Matchers.hasItem(
                        org.hamcrest.Matchers.hasProperty("id", org.hamcrest.Matchers.is(absence.getId())))));
        mvc.perform(get("/admin/justificatifs").with(ADMIN)).andExpect(status().isOk());
        mvc.perform(get("/admin/justificatifs").with(AHMED_PROF)).andExpect(status().isForbidden());
        mvc.perform(get("/etudiant/justificatifs").with(AHMED_PROF)).andExpect(status().isForbidden());
    }
}
