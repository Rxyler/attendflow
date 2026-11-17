package com.attendflow.web;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.PresenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Chaque test cree sa propre seance (3ème INFO, Ahmed) ; tout est annule a la fin (@Transactional). */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PresenceTest {

    @Autowired MockMvc mvc;
    @Autowired SeanceRepository seances;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired EnseignantRepository enseignants;
    @Autowired EtudiantRepository etudiants;
    @Autowired PresenceRepository presences;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");
    static final RequestPostProcessor AHMED = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor SARA = user("sara.mansouri@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor MANAR = user("manar.nouira@univ.tn").roles("ETUDIANT");

    Seance seance(LocalDate date, EtatSeance etat) {
        Classe info3 = classes.findByNom("3ème INFO").orElseThrow();
        Seance s = new Seance("T-" + UUID.randomUUID(), date, LocalTime.of(8, 0), LocalTime.of(10, 0), info3,
                matieres.findByCode("JAVA").orElseThrow(), salles.findByNom("A05").orElseThrow(),
                enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow());
        s.setEtat(etat);
        return seances.saveAndFlush(s);
    }

    Seance ouverte() {
        return seance(LocalDate.now().minusDays(1), EtatSeance.PLANIFIEE);   // finie hier, dans le delai de 48 h
    }

    List<Etudiant> classe() {
        return etudiants.findByClasseOrderByNomAscPrenomAsc(classes.findByNom("3ème INFO").orElseThrow());
    }

    MockHttpServletRequestBuilder envoi(Seance s, RequestPostProcessor qui, StatutPresence premier) {
        var req = post("/seances/" + s.getId() + "/presences").with(csrf()).with(qui);
        List<Etudiant> liste = classe();
        for (int i = 0; i < liste.size(); i++) {
            req = req.param("statut_" + liste.get(i).getId(), (i == 0 ? premier : StatutPresence.PRESENT).name());
        }
        return req;
    }

    PresenceService.Feuille feuille(Seance s, RequestPostProcessor qui) throws Exception {
        return (PresenceService.Feuille) mvc.perform(get("/seances/" + s.getId() + "/presences").with(qui))
                .andExpect(status().isOk()).andReturn().getModelAndView().getModel().get("feuille");
    }

    @Test
    void feuilleChargeLaClasseAvecPresentParDefaut() throws Exception {
        PresenceService.Feuille f = feuille(ouverte(), AHMED);
        assertThat(f.modifiable()).isTrue();
        assertThat(f.lignes()).hasSize(classe().size())
                .allMatch(l -> l.statut() == StatutPresence.PRESENT);
    }

    @Test
    void enregistrementPuisModificationTracee() throws Exception {
        Seance s = ouverte();
        mvc.perform(envoi(s, AHMED, StatutPresence.PRESENT)).andExpect(redirectedUrl("/seances/" + s.getId() + "/presences"))
                .andExpect(flash().attributeExists("succes"));
        assertThat(presences.findBySeance(s)).hasSize(classe().size());

        mvc.perform(envoi(s, AHMED, StatutPresence.ABSENT)).andExpect(flash().attributeExists("succes"));
        List<Presence> apres = presences.findBySeance(s);
        assertThat(apres).hasSize(classe().size());   // RG-02 : pas de doublon
        Presence modifiee = apres.stream().filter(p -> p.getStatut() == StatutPresence.ABSENT).findFirst().orElseThrow();
        assertThat(modifiee.getHistorique()).singleElement().satisfies(h -> {   // RG-08
            assertThat(h.getAncienStatut()).isEqualTo(StatutPresence.PRESENT);
            assertThat(h.getNouveauStatut()).isEqualTo(StatutPresence.ABSENT);
            assertThat(h.getAuteur().getEmail()).isEqualTo("ahmed.bensalah@univ.tn");
        });
    }

    @Test
    void autreEnseignantEtEtudiantRefuses() throws Exception {
        Seance s = ouverte();
        mvc.perform(get("/seances/" + s.getId() + "/presences").with(SARA)).andExpect(status().isForbidden());   // RG-03
        mvc.perform(envoi(s, SARA, StatutPresence.ABSENT)).andExpect(status().isForbidden());
        mvc.perform(get("/seances/" + s.getId() + "/presences").with(MANAR)).andExpect(status().isForbidden());
        assertThat(presences.findBySeance(s)).isEmpty();
    }

    @Test
    void seanceAnnuleeVerrouilleePourTous() throws Exception {
        Seance s = seance(LocalDate.now().minusDays(1), EtatSeance.ANNULEE);
        assertThat(feuille(s, ADMIN).modifiable()).isFalse();   // RG-10
        mvc.perform(envoi(s, ADMIN, StatutPresence.PRESENT)).andExpect(flash().attributeExists("erreur"));
        assertThat(presences.findBySeance(s)).isEmpty();
    }

    @Test
    void seanceFutureVerrouilleePourEnseignantMaisPasAdmin() throws Exception {
        Seance s = seance(LocalDate.now().plusDays(3), EtatSeance.PLANIFIEE);
        assertThat(feuille(s, AHMED).modifiable()).isFalse();   // F-23
        assertThat(feuille(s, ADMIN).modifiable()).isTrue();
    }

    @Test
    void delaiDepassePourEnseignantMaisPasAdmin() throws Exception {
        Seance s = seance(LocalDate.now().minusDays(5), EtatSeance.PLANIFIEE);   // delai par defaut : 48 h
        assertThat(feuille(s, AHMED).modifiable()).isFalse();   // F-22
        mvc.perform(envoi(s, AHMED, StatutPresence.PRESENT)).andExpect(flash().attributeExists("erreur"));
        mvc.perform(envoi(s, ADMIN, StatutPresence.PRESENT)).andExpect(flash().attributeExists("succes"));
    }

    @Test
    void statutInvalideRienEnregistre() throws Exception {
        Seance s = ouverte();
        mvc.perform(post("/seances/" + s.getId() + "/presences").with(csrf()).with(AHMED)
                        .param("statut_" + classe().getFirst().getId(), "EN_VACANCES"))
                .andExpect(flash().attributeExists("erreur"));
        assertThat(presences.findBySeance(s)).isEmpty();
    }
}
