package com.attendflow.web;

import com.attendflow.model.Seance;
import com.attendflow.repository.ClasseRepository;
import com.attendflow.repository.SeanceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EmploiDuTempsTest {

    @Autowired MockMvc mvc;
    @Autowired ClasseRepository classes;
    @Autowired SeanceRepository seances;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");
    static final RequestPostProcessor AHMED = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor LINA = user("lina.ferjani@univ.tn").roles("ETUDIANT");

    @SuppressWarnings("unchecked")
    private List<Seance> seancesAffichees(RequestPostProcessor qui, String... params) throws Exception {
        var req = get("/emploi-du-temps").with(qui);
        for (int i = 0; i < params.length; i += 2) req = req.param(params[i], params[i + 1]);
        return (List<Seance>) mvc.perform(req).andExpect(status().isOk())
                .andReturn().getModelAndView().getModel().get("seances");
    }

    @Test
    void enseignantNeVoitQueSesSeances() throws Exception {
        List<Seance> vues = seancesAffichees(AHMED);
        assertThat(vues).isNotEmpty()
                .allMatch(s -> s.getEnseignant().getEmail().equals("ahmed.bensalah@univ.tn"));
    }

    @Test
    void etudiantNeVoitQueSaClasse() throws Exception {
        List<Seance> vues = seancesAffichees(LINA);
        assertThat(vues).isNotEmpty().allMatch(s -> s.getClasse().getNom().equals("3ème INFO"));
    }

    @Test
    void adminVoitToutEtPeutFiltrerParClasse() throws Exception {
        List<Seance> toutes = seancesAffichees(ADMIN);
        Long info2 = classes.findByNom("2ème INFO").orElseThrow().getId();
        List<Seance> filtrees = seancesAffichees(ADMIN, "classe", info2.toString());
        assertThat(filtrees).isNotEmpty().hasSizeLessThan(toutes.size())
                .allMatch(s -> s.getClasse().getNom().equals("2ème INFO"));
    }

    @Test
    void navigationSemaineSuivante() throws Exception {
        LocalDate lundiSuivant = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).plusWeeks(1);
        List<Seance> vues = seancesAffichees(ADMIN, "semaine", lundiSuivant.plusDays(2).toString());
        assertThat(vues).isNotEmpty().allMatch(s -> !s.getDate().isBefore(lundiSuivant)
                && !s.getDate().isAfter(lundiSuivant.plusDays(4)));
    }

    @Test
    void detailVisibleSeulementPourSesPropresSeances() throws Exception {
        Seance aLui = seancesAffichees(AHMED).getFirst();
        Seance autre = seancesAffichees(ADMIN).stream()
                .filter(s -> !s.getEnseignant().getEmail().equals("ahmed.bensalah@univ.tn")).findFirst().orElseThrow();

        mvc.perform(get("/emploi-du-temps").param("seance", aLui.getId().toString()).with(AHMED))
                .andExpect(model().attributeExists("selection"));
        mvc.perform(get("/emploi-du-temps").param("seance", autre.getId().toString()).with(AHMED))
                .andExpect(model().attributeDoesNotExist("selection"));
    }

    @Test
    void seanceAnnuleeAfficheeCommeTelle() throws Exception {
        Long annulee = seances.findAll().stream()
                .filter(s -> !s.isOuvertePourPresences()).findFirst().orElseThrow().getId();
        mvc.perform(get("/emploi-du-temps").param("seance", annulee.toString())
                        .param("semaine", seances.findById(annulee).orElseThrow().getDate().toString()).with(ADMIN))
                .andExpect(content().string(containsString("la prise des présences n’est pas possible")));
    }

    @Test
    void visiteurRenvoyeVersConnexion() throws Exception {
        mvc.perform(get("/emploi-du-temps")).andExpect(redirectedUrl("/login"));
    }
}
