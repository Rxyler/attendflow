package com.attendflow.web;

import com.attendflow.model.*;
import com.attendflow.model.enums.EtatSeance;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.PresenceService;
import com.attendflow.service.RapportService;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Donnees isolees en janvier 2031 : 2 seances d'Ahmed (Java) et 1 de Sara (BDD) pour 3ème INFO.
 * Premier etudiant de la classe absent a chaque seance, les autres presents.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RapportTest {

    @Autowired MockMvc mvc;
    @Autowired SeanceRepository seances;
    @Autowired ClasseRepository classes;
    @Autowired MatiereRepository matieres;
    @Autowired SalleRepository salles;
    @Autowired EnseignantRepository enseignants;
    @Autowired EtudiantRepository etudiants;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired PresenceService presenceService;

    static final RequestPostProcessor ADMIN = user("admin@univ.tn").roles("ADMIN");
    static final RequestPostProcessor AHMED = user("ahmed.bensalah@univ.tn").roles("ENSEIGNANT");
    static final RequestPostProcessor LINA = user("lina.ferjani@univ.tn").roles("ETUDIANT");
    static final String DU = "2031-01-01", AU = "2031-01-31";

    int effectif;

    @BeforeEach
    void donnees() {
        Classe info3 = classes.findByNom("3ème INFO").orElseThrow();
        List<Etudiant> classe = etudiants.findByClasseOrderByNomAscPrenomAsc(info3);
        effectif = classe.size();
        seance(info3, "JAVA", "ahmed.bensalah@univ.tn", LocalDate.of(2031, 1, 6), classe);
        seance(info3, "JAVA", "ahmed.bensalah@univ.tn", LocalDate.of(2031, 1, 7), classe);
        seance(info3, "BDD", "sara.mansouri@univ.tn", LocalDate.of(2031, 1, 8), classe);
    }

    void seance(Classe c, String matiere, String prof, LocalDate date, List<Etudiant> classe) {
        Seance s = new Seance("T-" + UUID.randomUUID(), date, LocalTime.of(8, 0), LocalTime.of(10, 0), c,
                matieres.findByCode(matiere).orElseThrow(), salles.findByNom("A05").orElseThrow(),
                enseignants.findByEmail(prof).orElseThrow());
        s.setEtat(EtatSeance.PLANIFIEE);
        seances.saveAndFlush(s);
        Map<Long, StatutPresence> statuts = new HashMap<>();
        for (int i = 0; i < classe.size(); i++) statuts.put(classe.get(i).getId(), i == 0 ? StatutPresence.ABSENT : StatutPresence.PRESENT);
        presenceService.enregistrer(utilisateurs.findByEmail("admin@univ.tn").orElseThrow(), s.getId(), statuts);
    }

    RapportService.Rapport rapport(RequestPostProcessor qui, String... params) throws Exception {
        MockHttpServletRequestBuilder req = get("/rapports").with(qui).param("du", DU).param("au", AU);
        for (int i = 0; i < params.length; i += 2) req = req.param(params[i], params[i + 1]);
        return (RapportService.Rapport) mvc.perform(req).andExpect(status().isOk())
                .andReturn().getModelAndView().getModel().get("rapport");
    }

    @Test
    void indicateursAdminF30() throws Exception {
        RapportService.Rapport r = rapport(ADMIN);
        assertThat(r.nbSeances()).isEqualTo(3);
        assertThat(r.absents()).isEqualTo(3);
        assertThat(r.presents()).isEqualTo(3L * (effectif - 1));
        assertThat(r.parMatiere()).extracting(RapportService.ParMatiere::matiere).containsExactly("Java", "Base de données");
        assertThat(r.parClasse()).singleElement().satisfies(c -> assertThat(c.classe()).isEqualTo("3ème INFO"));
        assertThat(r.evolution()).hasSize(3);
        assertThat(r.aRisque()).hasSize(1);   // l'etudiant absent 3 fois sur 3
    }

    @Test
    void filtresF29() throws Exception {
        Long bdd = matieres.findByCode("BDD").orElseThrow().getId();
        assertThat(rapport(ADMIN, "matiere", bdd.toString()).nbSeances()).isEqualTo(1);
        Long sara = enseignants.findByEmail("sara.mansouri@univ.tn").orElseThrow().getId();
        assertThat(rapport(ADMIN, "enseignant", sara.toString()).nbSeances()).isEqualTo(1);
        Long info2 = classes.findByNom("2ème INFO").orElseThrow().getId();
        assertThat(rapport(ADMIN, "classe", info2.toString()).nbSeances()).isZero();
    }

    @Test
    void enseignantForceASesPropresSeances() throws Exception {
        Long sara = enseignants.findByEmail("sara.mansouri@univ.tn").orElseThrow().getId();
        RapportService.Rapport r = rapport(AHMED, "enseignant", sara.toString());   // tente de voir Sara
        assertThat(r.nbSeances()).isEqualTo(2);
        assertThat(r.seances()).allMatch(l -> l.seance().getEnseignant().getEmail().equals("ahmed.bensalah@univ.tn"));
        mvc.perform(get("/rapports").with(LINA)).andExpect(status().isForbidden());
        mvc.perform(get("/rapports/export.pdf").with(LINA)).andExpect(status().isForbidden());
    }

    @Test
    void exportsPdfEtExcelF31() throws Exception {
        byte[] pdf = mvc.perform(get("/rapports/export.pdf").with(ADMIN).param("du", DU).param("au", AU))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment")))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");

        byte[] xlsx = mvc.perform(get("/rapports/export.xlsx").with(ADMIN).param("du", DU).param("au", AU))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            Sheet s = wb.getSheet("Séances");
            assertThat(s.getLastRowNum()).isEqualTo(3);   // en-tete + 3 seances : identique a l'ecran
            assertThat(wb.getSheet("Synthèse").getRow(5).getCell(0).getNumericCellValue()).isEqualTo(3.0);
            assertThat(wb.getSheet("Étudiants à risque").getLastRowNum()).isEqualTo(1);
        }
    }

    @Test
    void importExcelF09() throws Exception {
        ByteArrayOutputStream fichier = new ByteArrayOutputStream();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet s = wb.createSheet();
            String[][] lignes = {{"nom", "prenom", "email", "matricule", "classe"},
                    {"Excel", "Eva", "eva.excel@univ.tn", "20266001", "1ère INFO"},
                    {"Bad", "Bob", "bob.bad@univ.tn", "20266002", "NULLE-PART"}};
            for (int i = 0; i < lignes.length; i++) {
                var row = s.createRow(i);
                for (int c = 0; c < 5; c++) row.createCell(c).setCellValue(lignes[i][c]);
            }
            wb.write(fichier);
        }
        mvc.perform(multipart("/admin/etudiants/import").with(csrf()).with(ADMIN)
                        .file(new MockMultipartFile("fichier", "etudiants.xlsx", "application/octet-stream", fichier.toByteArray())))
                .andExpect(flash().attribute("avertissement", org.hamcrest.Matchers.startsWith("1 étudiant(s) importé(s)")));
        assertThat(etudiants.findWithClasseByEmail("eva.excel@univ.tn")).isPresent();
    }
}
