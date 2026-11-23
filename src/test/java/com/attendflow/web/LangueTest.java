package com.attendflow.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;

@SpringBootTest
@AutoConfigureMockMvc
class LangueTest {

    @Autowired MockMvc mvc;

    @Test
    void francaisParDefautAnglaisSurDemande() throws Exception {
        mvc.perform(get("/login")).andExpect(content().string(containsString("Mot de passe oublié ?")));
        mvc.perform(get("/login").param("lang", "en"))
                .andExpect(content().string(containsString("Forgot your password?")))
                .andExpect(content().string(containsString("lang=\"en\"")))
                .andExpect(cookie().value("af-langue", "en"));
        mvc.perform(get("/login").param("lang", "de")).andExpect(content().string(containsString("Mot de passe oublié ?")));
    }

    @Test
    void aucunCodeDeGabaritNApparaitDansLesPagesPubliques() throws Exception {
        for (String lang : new String[] {"fr", "en"}) {
            for (String page : new String[] {"/", "/login", "/mot-de-passe-oublie"}) {
                mvc.perform(get(page).param("lang", lang))
                        .andExpect(content().string(not(containsString(" th:"))))
                        .andExpect(content().string(not(containsString("#{"))))
                        .andExpect(content().string(not(containsString("??"))));
            }
        }
    }

    @Test
    void chaqueCleFrancaiseALaSienneEnAnglais() throws Exception {
        assertThat(lire("/messages_en.properties").stringPropertyNames())
                .containsAll(lire("/messages.properties").stringPropertyNames());
    }

    private static Properties lire(String chemin) throws Exception {
        Properties p = new Properties();
        try (var in = LangueTest.class.getResourceAsStream(chemin)) {
            p.load(new InputStreamReader(in, StandardCharsets.UTF_8));
        }
        return p;
    }
}
