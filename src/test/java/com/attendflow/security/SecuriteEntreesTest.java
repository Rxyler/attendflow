package com.attendflow.security;

import com.attendflow.repository.ClasseRepository;
import jakarta.servlet.RequestDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecuriteEntreesTest {

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");

    @Autowired MockMvc mvc;
    @Autowired ClasseRepository classes;

    @Test
    void emailInsensibleALaCasse() throws Exception {
        mvc.perform(formLogin().user("email", "  Rami.Gharbi@UNIV.tn ").password("motDePasse", "1234"))
                .andExpect(redirectedUrl("/"));
    }

    @Test
    void injectionSqlALaConnexionEtDansLaRecherche() throws Exception {
        mvc.perform(formLogin().user("email", "admin@univ.tn' OR '1'='1").password("motDePasse", "' OR '1'='1"))
                .andExpect(redirectedUrl("/login?erreur"));
        mvc.perform(get("/admin/etudiants").with(ADMIN).param("q", "' OR 1=1 --"))
                .andExpect(status().isOk())
                .andExpect(model().attribute("etudiants", empty()));
    }

    @Test
    void codeHtmlSaisiEstAfficheCommeDuTexte() throws Exception {
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN)
                        .param("nom", "<script>alert(1)</script>").param("niveau", "\"><img src=x onerror=alert(2)>"))
                .andExpect(flash().attributeExists("succes"));
        mvc.perform(get("/admin/classes").with(ADMIN))
                .andExpect(content().string(not(containsString("<script>alert(1)"))))
                .andExpect(content().string(not(containsString("<img src=x"))))
                .andExpect(content().string(containsString("&lt;script&gt;alert(1)&lt;/script&gt;")));
    }

    @Test
    void formulaireSansJetonCsrfRefuse() throws Exception {
        mvc.perform(post("/admin/classes").with(ADMIN).param("nom", "Pirate")).andExpect(status().isForbidden());
        mvc.perform(post("/etudiant/justificatifs").with(user("lina.ferjani@univ.tn").roles("ETUDIANT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void valeursAbsurdesRefusees() throws Exception {
        Long classe = classes.findAll().getFirst().getId();
        mvc.perform(post("/admin/etudiants").with(csrf()).with(ADMIN).param("nom", "a".repeat(5000))
                        .param("prenom", "x").param("email", "x@univ.tn").param("matricule", "20267001")
                        .param("classeId", classe.toString()))
                .andExpect(flash().attribute("erreur", containsString("dépasse")));
        mvc.perform(post("/admin/etudiants").with(csrf()).with(ADMIN).param("nom", "a").param("prenom", "x")
                        .param("email", "pas-un-email").param("matricule", "20267002").param("classeId", classe.toString()))
                .andExpect(flash().attribute("erreur", containsString("Email invalide")));
        mvc.perform(post("/admin/etudiants").with(csrf()).with(ADMIN).param("nom", "  ").param("prenom", "x")
                        .param("email", "y@univ.tn").param("matricule", "20267003").param("classeId", classe.toString()))
                .andExpect(flash().attribute("erreur", containsString("obligatoire")));
        mvc.perform(get("/rapports").with(ADMIN).param("du", "abc")).andExpect(status().isBadRequest());
        mvc.perform(get("/seances/abc/presences").with(ADMIN)).andExpect(status().isBadRequest());
    }

    @Test
    void forceBruteBloqueeApresCinqEchecs() throws Exception {
        for (int i = 0; i < TentativesConnexion.MAX_ECHECS - 1; i++) {
            mvc.perform(formLogin().user("email", "sara.mansouri@univ.tn").password("motDePasse", "faux" + i))
                    .andExpect(redirectedUrl("/login?erreur"));
        }
        mvc.perform(formLogin().user("email", "sara.mansouri@univ.tn").password("motDePasse", "faux"))
                .andExpect(redirectedUrl("/login?bloque"));
        mvc.perform(formLogin().user("email", "sara.mansouri@univ.tn").password("motDePasse", "1234"))
                .andExpect(redirectedUrl("/login?bloque"));
        for (int i = 0; i < TentativesConnexion.MAX_ECHECS; i++) {
            mvc.perform(formLogin().user("email", "personne@univ.tn").password("motDePasse", "x"));
        }
        mvc.perform(formLogin().user("email", "personne@univ.tn").password("motDePasse", "x"))
                .andExpect(redirectedUrl("/login?bloque"));
        mvc.perform(formLogin().user("email", "ahmed.bensalah@univ.tn").password("motDePasse", "1234"))
                .andExpect(redirectedUrl("/"));
    }

    @Test
    void pageDErreurSansDetailTechnique() throws Exception {
        mvc.perform(get("/error").accept(MediaType.TEXT_HTML).requestAttr(RequestDispatcher.ERROR_STATUS_CODE, 404))
                .andExpect(content().string(containsString("Page introuvable")))
                .andExpect(content().string(not(containsString("Exception"))));
        mvc.perform(get("/error").accept(MediaType.TEXT_HTML).requestAttr(RequestDispatcher.ERROR_STATUS_CODE, 403))
                .andExpect(content().string(containsString("Accès refusé")));
    }
}
