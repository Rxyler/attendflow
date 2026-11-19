package com.attendflow.web;

import com.attendflow.model.*;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.PresenceService;
import com.attendflow.service.ReferentielService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReferentielTest {

    @Autowired MockMvc mvc;
    @Autowired EtudiantRepository etudiants;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired EnseignantRepository enseignants;
    @Autowired SalleRepository salles;
    @Autowired SeanceRepository seances;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired PresenceService presenceService;
    @Autowired ReferentielService referentiel;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");
    static final RequestPostProcessor AHMED = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");

    Long info3() { return classes.findByNom("3ème INFO").orElseThrow().getId(); }

    @SuppressWarnings("unchecked")
    List<Etudiant> liste(String... params) throws Exception {
        var req = get("/admin/etudiants").with(ADMIN);
        for (int i = 0; i < params.length; i += 2) req = req.param(params[i], params[i + 1]);
        return (List<Etudiant>) mvc.perform(req).andExpect(status().isOk()).andReturn().getModelAndView().getModel().get("etudiants");
    }

    @Test
    void ajoutModificationEtUnicite() throws Exception {
        mvc.perform(multipart("/admin/etudiants").with(csrf()).with(ADMIN)
                        .param("nom", "Test").param("prenom", "Nouvel").param("email", "Nouvel.Test@univ.tn")
                        .param("matricule", "20269999").param("classeId", info3().toString()).param("dateNaissance", "2004-05-06"))
                .andExpect(flash().attributeExists("succes"));
        Etudiant e = etudiants.findWithClasseByEmail("nouvel.test@univ.tn").orElseThrow();   // email mis en minuscules
        assertThat(e.getDateNaissance()).isEqualTo(LocalDate.of(2004, 5, 6));

        // RG-06 : email ou matricule deja pris -> refuse, formulaire rouvert
        mvc.perform(multipart("/admin/etudiants").with(csrf()).with(ADMIN)
                        .param("nom", "X").param("prenom", "Y").param("email", "lina.ferjani@univ.tn")
                        .param("matricule", "20268888").param("classeId", info3().toString()))
                .andExpect(flash().attributeExists("erreur")).andExpect(flash().attribute("ouvrir", true));
        mvc.perform(multipart("/admin/etudiants").with(csrf()).with(ADMIN)
                        .param("nom", "X").param("prenom", "Y").param("email", "x.y@univ.tn")
                        .param("matricule", "20260001").param("classeId", info3().toString()))
                .andExpect(flash().attributeExists("erreur"));

        // modification
        mvc.perform(multipart("/admin/etudiants").with(csrf()).with(ADMIN).param("id", e.getId().toString())
                        .param("nom", "Modifié").param("prenom", "Nouvel").param("email", "nouvel.test@univ.tn")
                        .param("matricule", "20269999").param("classeId", info3().toString()))
                .andExpect(flash().attributeExists("succes"));
        assertThat(etudiants.findById(e.getId()).orElseThrow().getNom()).isEqualTo("Modifié");
    }

    @Test
    void rechercheEtFiltreF10() throws Exception {
        assertThat(liste("q", "ferjani")).extracting(Etudiant::getMatricule).containsExactly("20260001");
        assertThat(liste("q", "20260007")).extracting(Etudiant::getNom).containsExactly("Chaabane");
        Long info2 = classes.findByNom("2ème INFO").orElseThrow().getId();
        assertThat(liste("classe", info2.toString())).isNotEmpty().allMatch(e -> e.getClasse().getNom().equals("2ème INFO"));
    }

    @Test
    void suppressionRefuseeSiHistorique() throws Exception {
        Etudiant lina = etudiants.findWithClasseByEmail("lina.ferjani@univ.tn").orElseThrow();
        Seance s = new Seance("T-" + UUID.randomUUID(), LocalDate.now().minusDays(1), LocalTime.of(8, 0), LocalTime.of(10, 0),
                lina.getClasse(), matieres.findByCode("JAVA").orElseThrow(), salles.findByNom("A05").orElseThrow(),
                enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow());
        seances.saveAndFlush(s);
        presenceService.enregistrer(utilisateurs.findByEmail("admin@univ.tn").orElseThrow(), s.getId(),
                Map.of(lina.getId(), StatutPresence.PRESENT));

        mvc.perform(post("/admin/etudiants/" + lina.getId() + "/supprimer").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("erreur"));
        assertThat(etudiants.findById(lina.getId())).isPresent();

        Etudiant sansHistorique = referentiel.enregistrerEtudiant(null, new ReferentielService.EtudiantForm(
                "Vide", "Compte", "vide@univ.tn", null, "20267777", null, info3()), null);
        mvc.perform(post("/admin/etudiants/" + sansHistorique.getId() + "/supprimer").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("succes"));
        assertThat(etudiants.findById(sansHistorique.getId())).isEmpty();
    }

    @Test
    void importCsvAvecLignesInvalidesF09() throws Exception {
        String csv = "﻿nom;prenom;email;matricule;classe;date_naissance\n"
                + "Alpha;Ali;ali.alpha@univ.tn;20265001;3ème INFO;2005-01-02\n"
                + "Beta;Bea;bea.beta@univ.tn;20265002;CLASSE-INCONNUE;\n"
                + "Gamma;Gil;lina.ferjani@univ.tn;20265003;1ère INFO;\n"
                + "Delta;Dan;dan.delta@univ.tn;20265004;2ème INFO;12/03/2004\n";
        mvc.perform(multipart("/admin/etudiants/import").file(new MockMultipartFile("fichier", "e.csv", "text/csv", csv.getBytes()))
                        .with(csrf()).with(ADMIN))
                .andExpect(flash().attribute("avertissement", org.hamcrest.Matchers.startsWith("2 étudiant(s) importé(s)")))
                .andExpect(flash().attribute("erreursImport", org.hamcrest.Matchers.hasSize(2)));
        assertThat(etudiants.findWithClasseByEmail("dan.delta@univ.tn").orElseThrow().getDateNaissance())
                .isEqualTo(LocalDate.of(2004, 3, 12));
    }

    @Test
    void classesMatieresEnseignants() throws Exception {
        // classe : ajout puis suppression refusee si elle contient des etudiants
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "Master 1").param("anneeUniversitaire", "2026-2027"))
                .andExpect(flash().attributeExists("succes"));
        mvc.perform(post("/admin/classes").with(csrf()).with(ADMIN).param("nom", "Master 1"))
                .andExpect(flash().attributeExists("erreur"));   // doublon
        mvc.perform(post("/admin/classes/" + info3() + "/supprimer").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("erreur"));
        Long master = classes.findByNom("Master 1").orElseThrow().getId();
        mvc.perform(post("/admin/classes/" + master + "/supprimer").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("succes"));

        // matiere puis enseignant affecte a cette matiere (F-08)
        mvc.perform(post("/admin/matieres").with(csrf()).with(ADMIN).param("intitule", "Génie logiciel").param("code", "gl").param("coefficient", "2"))
                .andExpect(flash().attributeExists("succes"));
        Matiere gl = matieres.findByCode("GL").orElseThrow();
        mvc.perform(post("/admin/enseignants").with(csrf()).with(ADMIN).param("nom", "Nouveau").param("prenom", "Prof")
                        .param("email", "prof.nouveau@univ.tn").param("matiereIds", gl.getId().toString()))
                .andExpect(flash().attributeExists("succes"));
        assertThat(enseignants.findAllByOrderByNomAscPrenomAsc()).anyMatch(e -> e.getEmail().equals("prof.nouveau@univ.tn")
                && e.getMatieres().stream().anyMatch(m -> m.getCode().equals("GL")));
        mvc.perform(post("/admin/enseignants").with(csrf()).with(ADMIN).param("nom", "Sans").param("prenom", "Matiere")
                        .param("email", "sans.matiere@univ.tn"))
                .andExpect(flash().attributeExists("erreur"));   // au moins une matiere

        // matiere ou enseignant ayant des seances : suppression refusee
        mvc.perform(post("/admin/matieres/" + matieres.findByCode("JAVA").orElseThrow().getId() + "/supprimer").with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("erreur"));
        mvc.perform(post("/admin/enseignants/" + enseignants.findByEmail("ahmed.bensalah@univ.tn").orElseThrow().getId() + "/supprimer")
                        .with(csrf()).with(ADMIN))
                .andExpect(flash().attributeExists("erreur"));
    }

    @Test
    void pagesReserveesALAdmin() throws Exception {
        for (String page : List.of("/admin/etudiants", "/admin/classes", "/admin/matieres", "/admin/enseignants")) {
            mvc.perform(get(page).with(ADMIN)).andExpect(status().isOk());
            mvc.perform(get(page).with(AHMED)).andExpect(status().isForbidden());
        }
    }
}
