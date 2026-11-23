package com.attendflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"attendflow.demo.motdepasse=un-secret-solide", "attendflow.limite.requetes-par-minute=5",
        "spring.datasource.url=jdbc:h2:mem:attendflow-deploiement;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"})
@AutoConfigureMockMvc
class DeploiementTest {

    @Autowired MockMvc mvc;

    @Test
    void lesMotsDePassePublicsNeMarchentPlus() throws Exception {
        mvc.perform(formLogin().user("email", "admin@univ.tn").password("motDePasse", "admin"))
                .andExpect(redirectedUrl("/login?erreur"));
        mvc.perform(formLogin().user("email", "admin@univ.tn").password("motDePasse", "un-secret-solide"))
                .andExpect(redirectedUrl("/"));
        mvc.perform(formLogin().user("email", "lina.ferjani@univ.tn").password("motDePasse", "1234"))
                .andExpect(redirectedUrl("/login?erreur"));
    }

    @Test
    void enTetesDeSecurite() throws Exception {
        mvc.perform(get("/login").with(r -> { r.setRemoteAddr("10.0.0.4"); return r; }))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'self'")))
                .andExpect(header().string("Content-Security-Policy", containsString("frame-ancestors 'none'")))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(content().string(containsString("integrity=\"sha384-")));
    }

    @Test
    void auDelaDeLaLimiteLeVisiteurAttend() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(get("/login").with(r -> { r.setRemoteAddr("10.0.0.9"); return r; })).andExpect(status().isOk());
        }
        mvc.perform(get("/login").with(r -> { r.setRemoteAddr("10.0.0.9"); return r; }))
                .andExpect(status().is(429))
                .andExpect(header().exists("Retry-After"));
        mvc.perform(get("/login").with(r -> { r.setRemoteAddr("10.0.0.10"); return r; })).andExpect(status().isOk());
        mvc.perform(get("/css/attendflow.css").with(r -> { r.setRemoteAddr("10.0.0.9"); return r; })).andExpect(status().isOk());
    }
}
