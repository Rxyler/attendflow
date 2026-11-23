package com.attendflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"attendflow.turnstile.site-key=1x00000000000000000000AA",
        "attendflow.turnstile.secret-key=1x0000000000000000000000000000000AA",
        "spring.datasource.url=jdbc:h2:mem:attendflow-humain;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"})
@AutoConfigureMockMvc
class VerificationHumaineTest {

    @Autowired MockMvc mvc;
    @MockitoSpyBean VerificationHumaine verification;

    @Test
    void leWidgetEstAfficheSurLesFormulairesPublics() throws Exception {
        for (String page : new String[] {"/login", "/mot-de-passe-oublie"}) {
            mvc.perform(get(page)).andExpect(status().isOk())
                    .andExpect(content().string(containsString("data-sitekey=\"1x00000000000000000000AA\"")))
                    .andExpect(content().string(containsString("challenges.cloudflare.com/turnstile/v0/api.js")));
        }
        mvc.perform(get("/login")).andExpect(header().string("Content-Security-Policy",
                containsString("frame-src https://challenges.cloudflare.com")));
    }

    @Test
    void sansCaseCocheeLeBonMotDePasseNeSuffitPas() throws Exception {
        mvc.perform(formLogin().user("email", "admin@univ.tn").password("motDePasse", "admin"))
                .andExpect(redirectedUrl("/login?robot"));
        mvc.perform(post("/mot-de-passe-oublie").with(csrf()).param("email", "admin@univ.tn"))
                .andExpect(redirectedUrl("/mot-de-passe-oublie?robot"));
        mvc.perform(get("/login").param("robot", "")).andExpect(content().string(containsString("Êtes-vous un humain ?")));
    }

    @Test
    void caseValideeParCloudflareConnexionNormale() throws Exception {
        doReturn(true).when(verification).valide(eq("jeton-ok"), any());
        doReturn(false).when(verification).valide(eq("jeton-faux"), any());
        mvc.perform(post("/login").with(csrf()).param("email", "admin@univ.tn").param("motDePasse", "admin")
                        .param("cf-turnstile-response", "jeton-ok"))
                .andExpect(redirectedUrl("/"));
        mvc.perform(post("/login").with(csrf()).param("email", "admin@univ.tn").param("motDePasse", "admin")
                        .param("cf-turnstile-response", "jeton-faux"))
                .andExpect(redirectedUrl("/login?robot"));
    }
}
