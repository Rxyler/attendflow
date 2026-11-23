package com.attendflow.web;

import com.attendflow.model.enums.Mascotte;
import com.attendflow.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfilTest {

    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository utilisateurs;

    @Test
    void choisirPuisRetirerSonCompagnon() throws Exception {
        var admin = user("admin@univ.tn").roles("ADMIN");
        mvc.perform(get("/profil").with(admin)).andExpect(status().isOk()).andExpect(view().name("profil"));

        mvc.perform(post("/profil/mascotte").with(csrf()).with(admin).param("mascotte", "FILOU"))
                .andExpect(redirectedUrl("/profil")).andExpect(flash().attributeExists("succes"));
        assertThat(utilisateurs.findByEmail("admin@univ.tn").orElseThrow().getMascotte()).isEqualTo(Mascotte.FILOU);
        mvc.perform(get("/admin").with(admin)).andExpect(content().string(containsString("/images/mascottes/filou.svg")));

        mvc.perform(post("/profil/mascotte").with(csrf()).with(admin).param("mascotte", ""))
                .andExpect(redirectedUrl("/profil"));
        assertThat(utilisateurs.findByEmail("admin@univ.tn").orElseThrow().getMascotte()).isNull();
    }

    @Test
    void refuseUnCompagnonInconnu() throws Exception {
        mvc.perform(post("/profil/mascotte").with(csrf()).with(user("admin@univ.tn").roles("ADMIN")).param("mascotte", "PIKACHU"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tableauEtudiantMontreLaProgression() throws Exception {
        String email = utilisateurs.findAll().stream().filter(u -> u.getRole().name().equals("ETUDIANT"))
                .findFirst().orElseThrow().getEmail();
        mvc.perform(get("/etudiant").with(user(email).roles("ETUDIANT")))
                .andExpect(status().isOk()).andExpect(content().string(containsString("Badges")));
    }
}
