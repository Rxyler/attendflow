package com.attendflow.web;

import com.attendflow.model.Parametre;
import com.attendflow.repository.ParametreRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ParametreTest {

    @Autowired MockMvc mvc;
    @Autowired ParametreRepository parametres;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");

    Parametre courant() { return parametres.findFirstByOrderByIdAsc().orElseThrow(); }

    @Test
    void afficheEtModifie() throws Exception {
        mvc.perform(get("/admin/parametres").with(ADMIN)).andExpect(status().isOk())
                .andExpect(model().attributeExists("form"));

        // retardCommePresent absent = case decochee
        mvc.perform(post("/admin/parametres").with(csrf()).with(ADMIN)
                        .param("seuilAbsence", "25.5").param("nbMaxAbsencesNonJustifiees", "5")
                        .param("delaiModificationHeures", "72").param("justifieCommePresent", "true"))
                .andExpect(redirectedUrl("/admin/parametres")).andExpect(flash().attributeExists("succes"));

        Parametre p = courant();
        assertThat(p.getSeuilAbsence()).isEqualTo(25.5);
        assertThat(p.getNbMaxAbsencesNonJustifiees()).isEqualTo(5);
        assertThat(p.getDelaiModificationHeures()).isEqualTo(72);
        assertThat(p.isRetardCommePresent()).isFalse();
        assertThat(p.isJustifieCommePresent()).isTrue();
        assertThat(p.getModifiePar().getEmail()).isEqualTo("admin@univ.tn");
    }

    @Test
    void refuseValeursHorsLimites() throws Exception {
        double avant = courant().getSeuilAbsence();
        mvc.perform(post("/admin/parametres").with(csrf()).with(ADMIN)
                        .param("seuilAbsence", "150").param("nbMaxAbsencesNonJustifiees", "5")
                        .param("delaiModificationHeures", "72"))
                .andExpect(flash().attributeExists("erreur")).andExpect(flash().attributeExists("form"));
        assertThat(courant().getSeuilAbsence()).isEqualTo(avant);
    }

    @Test
    void reserveALAdmin() throws Exception {
        mvc.perform(get("/admin/parametres").with(user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/admin/parametres").with(csrf()).with(user("lina.ferjani@univ.tn").roles("ETUDIANT"))
                        .param("seuilAbsence", "1"))
                .andExpect(status().isForbidden());
    }
}
