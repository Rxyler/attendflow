package com.attendflow.web;

import com.attendflow.repository.ClasseRepository;
import com.attendflow.repository.EtudiantRepository;
import com.attendflow.repository.MatiereRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;

/** Saisies de l'administrateur : donnees reelles acceptees, donnees absurdes ou corrompues refusees avec un message. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ValidationSaisiesTest {

    @Autowired MockMvc mvc;
    @Autowired ClasseRepository classes;
    @Autowired EtudiantRepository etudiants;
    @Autowired MatiereRepository matieres;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");
    static final ResultMatcher OK = flash().attributeExists("succes"), REFUS = flash().attributeExists("erreur");
    int n = 0;

    org.springframework.test.web.servlet.RequestBuilder etudiant(String nom, String prenom, String tel, String matricule, String naissance) {
        n++;
        var r = multipart("/admin/etudiants").with(csrf()).with(ADMIN)
                .param("nom", nom).param("prenom", prenom).param("email", "v" + n + "@univ.tn")
                .param("matricule", matricule == null ? "V2026" + n : matricule)
                .param("classeId", classes.findByNom("3ème INFO").orElseThrow().getId().toString());
        if (tel != null) r.param("telephone", tel);
        if (naissance != null) r.param("dateNaissance", naissance);
        return r;
    }

    @Test
    void nomsReelsAcceptes() throws Exception {
        mvc.perform(etudiant("Ben  Ali", "Mariem-Inès", "+216 20 123 456", null, "2004-05-06")).andExpect(OK);
        assertThat(etudiants.findWithClasseByEmail("v1@univ.tn").orElseThrow().getNom()).isEqualTo("Ben Ali");
        mvc.perform(etudiant("N'Diaye", "Zoé", "20123456", "ABC-12", null)).andExpect(OK);
        mvc.perform(etudiant("Trabelsi", "Ahmed", null, null, null)).andExpect(OK);
    }

    @Test
    void nomsAvecChiffresOuSymbolesRefuses() throws Exception {
        for (String mauvais : new String[] {"Ahmed2", "1234", "Ali!", "<b>Ali</b>", "Ali_Ben", "-Ali", "Ali--Ben", "@@@"}) {
            mvc.perform(etudiant(mauvais, "Sami", null, null, null)).andExpect(REFUS);
            mvc.perform(etudiant("Sami", mauvais, null, null, null)).andExpect(REFUS);
        }
    }

    @Test
    void telephoneMatriculeEtDateDeNaissanceInvalidesRefuses() throws Exception {
        for (String tel : new String[] {"abc", "123", "12345678901234567", "20-123-456", "+216 2O 123 456"}) {
            mvc.perform(etudiant("Ali", "Sami", tel, null, null)).andExpect(REFUS);
        }
        for (String matricule : new String[] {"A", "2026 0001", "=HYPERLINK(1)", "<x>"}) {
            mvc.perform(etudiant("Ali", "Sami", null, matricule, null)).andExpect(REFUS);
        }
        LocalDate auj = LocalDate.now();
        for (LocalDate d : new LocalDate[] {auj.plusDays(1), auj.minusYears(5), LocalDate.of(1890, 1, 1)}) {
            mvc.perform(etudiant("Ali", "Sami", null, null, d.toString())).andExpect(REFUS);
        }
        assertThat(etudiants.findWithClasseByEmail("v1@univ.tn")).isEmpty();
    }

    @Test
    void classesMatieresEnseignantsIncoherentsRefuses() throws Exception {
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "1234")).andExpect(REFUS);
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "Master 2").param("anneeUniversitaire", "2027-2026"))
                .andExpect(REFUS);
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "Master 2").param("anneeUniversitaire", "2026-2030"))
                .andExpect(REFUS);
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "Master 2").param("responsable", "Prof 007"))
                .andExpect(REFUS);
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "Master 2").param("anneeUniversitaire", "2026-2027")
                .param("responsable", "Sara Mansouri")).andExpect(OK);

        for (String coef : new String[] {"0", "-1", "1000", "NaN"}) {
            mvc.perform(post("/admin/matieres").with(csrf()).with(ADMIN).param("intitule", "Génie logiciel")
                    .param("code", "GL" + coef.length()).param("coefficient", coef)).andExpect(REFUS);
        }
        mvc.perform(post("/admin/matieres").with(csrf()).with(ADMIN).param("intitule", "!!!").param("code", "XX")).andExpect(REFUS);
        mvc.perform(post("/admin/matieres").with(csrf()).with(ADMIN).param("intitule", "Java 2").param("code", "JAVA2")
                .param("coefficient", "1.5")).andExpect(OK);

        String matiere = matieres.findByCode("JAVA").orElseThrow().getId().toString();
        mvc.perform(post("/admin/enseignants").with(csrf()).with(ADMIN).param("nom", "R2D2").param("prenom", "Prof")
                .param("email", "r2d2@univ.tn").param("matiereIds", matiere)).andExpect(REFUS);
        mvc.perform(post("/admin/enseignants").with(csrf()).with(ADMIN).param("nom", "Haddad").param("prenom", "Leïla")
                .param("email", "leila.haddad@univ.tn").param("telephone", "71 234 567").param("matiereIds", matiere)).andExpect(OK);
    }
}
