package com.attendflow.security;

import com.attendflow.model.Admin;
import com.attendflow.model.TokenReinitialisation;
import com.attendflow.model.Utilisateur;
import com.attendflow.repository.TokenReinitialisationRepository;
import com.attendflow.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MotDePasseTest {

    @Autowired MockMvc mvc;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired TokenReinitialisationRepository tokens;
    @Autowired PasswordEncoder encoder;

    Utilisateur compte;

    @BeforeEach
    void creerCompte() {
        compte = utilisateurs.save(new Admin("Test", "Compte", "test.reset@univ.tn", encoder.encode("ancien-mdp")));
    }

    private String demanderToken() throws Exception {
        mvc.perform(post("/mot-de-passe-oublie").param("email", "test.reset@univ.tn").with(csrf()))
                .andExpect(redirectedUrl("/mot-de-passe-oublie?envoye"));
        return tokens.findAll().stream()
                .filter(t -> t.getUtilisateur().getId().equals(compte.getId()))
                .findFirst().orElseThrow().getToken();
    }

    private void envoyer(String token, String mdp, String confirmation) throws Exception {
        mvc.perform(post("/reinitialiser").with(csrf())
                .param("token", token).param("motDePasse", mdp).param("confirmation", confirmation));
    }

    @Test
    void emailInconnuMemeReponseEtAucunJeton() throws Exception {
        long avant = tokens.count();
        mvc.perform(post("/mot-de-passe-oublie").param("email", "personne@univ.tn").with(csrf()))
                .andExpect(redirectedUrl("/mot-de-passe-oublie?envoye"));
        assertThat(tokens.count()).isEqualTo(avant);
    }

    @Test
    void parcoursCompletPuisJetonInutilisable() throws Exception {
        String token = demanderToken();
        mvc.perform(get("/reinitialiser").param("token", token))
                .andExpect(model().attribute("lienValide", true));

        envoyer(token, "nouveau-mdp-1", "autre-chose-1");
        envoyer(token, "court", "court");
        envoyer(token, "a".repeat(80), "a".repeat(80));
        assertThat(encoder.matches("ancien-mdp", compte.getMotDePasse())).isTrue();

        mvc.perform(post("/reinitialiser").with(csrf())
                        .param("token", token).param("motDePasse", "nouveau-mdp-1").param("confirmation", "nouveau-mdp-1"))
                .andExpect(redirectedUrl("/login?reinitialise"));
        assertThat(encoder.matches("nouveau-mdp-1", compte.getMotDePasse())).isTrue();

        mvc.perform(get("/reinitialiser").param("token", token))
                .andExpect(model().attribute("lienValide", false));
    }

    @Test
    void jetonExpireRefuse() throws Exception {
        tokens.save(new TokenReinitialisation(compte, "jeton-expire", LocalDateTime.now().minusMinutes(1)));
        mvc.perform(get("/reinitialiser").param("token", "jeton-expire"))
                .andExpect(model().attribute("lienValide", false));
    }
}
