package com.attendflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Utilise les comptes de demo crees par DonneesDemo dans la base H2 de test. */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {

    @Autowired MockMvc mvc;

    private void connexionMeneA(String email, String motDePasse, String page) throws Exception {
        var session = mvc.perform(formLogin().user("email", email).password("motDePasse", motDePasse))
                .andExpect(redirectedUrl("/"))
                .andReturn().getRequest().getSession();
        mvc.perform(get("/").session((org.springframework.mock.web.MockHttpSession) session))
                .andExpect(redirectedUrl(page));
    }

    @Test
    void chaqueRoleArriveSurSonTableauDeBord() throws Exception {
        connexionMeneA("admin@univ.tn", "admin", "/admin");
        connexionMeneA("ahmed.bensalah@univ.tn", "1234", "/enseignant");
        connexionMeneA("lina.ferjani@univ.tn", "1234", "/etudiant");
    }

    @Test
    void visiteurVoitLaVitrine() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk()).andExpect(view().name("accueil"));
    }

    @Test
    void mauvaisMotDePasseRefuse() throws Exception {
        mvc.perform(formLogin().user("email", "admin@univ.tn").password("motDePasse", "faux"))
                .andExpect(redirectedUrl("/login?erreur"));
    }

    @Test
    void enseignantNePeutPasOuvrirLespaceAdmin() throws Exception {
        mvc.perform(get("/admin").with(user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void visiteurNonConnecteRenvoyeVersLaConnexion() throws Exception {
        mvc.perform(get("/enseignant")).andExpect(redirectedUrl("/login"));
    }

    @Test
    void pageDeConnexionAccessible() throws Exception {
        mvc.perform(get("/login")).andExpect(status().isOk());
    }
}
