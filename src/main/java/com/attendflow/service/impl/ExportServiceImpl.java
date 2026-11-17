package com.attendflow.service.impl;

import com.attendflow.service.ExportService;
import com.attendflow.service.RapportService.LigneSeance;
import com.attendflow.service.RapportService.ParClasse;
import com.attendflow.service.RapportService.ParMatiere;
import com.attendflow.service.RapportService.Rapport;
import com.attendflow.service.StatistiqueService.EtudiantARisque;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Function;

/** Apache POI (Excel) et OpenPDF (PDF), comme prevu dans l'architecture technique du cahier. */
@Service
public class ExportServiceImpl implements ExportService {

    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORODATAGE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color INDIGO = new Color(79, 70, 229);

    private static final String[] COLONNES_SEANCES =
            {"Date", "Horaire", "Matière", "Classe", "Enseignant", "Présents", "Absents", "Retards", "Justifiés", "Taux (%)"};

    // ======================= PDF =======================

    @Override
    public byte[] pdf(Rapport r) {
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        PdfWriter.getInstance(doc, sortie);
        doc.open();

        Font titre = new Font(Font.HELVETICA, 18, Font.BOLD, INDIGO);
        Font sousTitre = new Font(Font.HELVETICA, 12, Font.BOLD);
        Font petit = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

        doc.add(new Paragraph("AttendFlow — Rapport des présences", titre));
        doc.add(new Paragraph(r.description(), petit));
        doc.add(new Paragraph("Généré le " + LocalDateTime.now().format(HORODATAGE), petit));

        section(doc, "Synthèse", sousTitre);
        List<Object[]> synthese = List.<Object[]>of(
                new Object[]{r.nbSeances(), pourcent(r.taux()), r.presents(), r.absents(), r.retards(), r.justifies()});
        table(doc, new String[]{"Séances saisies", "Taux de présence", "Présents", "Absents", "Retards", "Justifiés"},
                synthese, ligne -> ligne);

        section(doc, "Taux de présence par classe", sousTitre);
        table(doc, new String[]{"Classe", "Présences saisies", "Taux de présence"}, r.parClasse(),
                (ParClasse c) -> new Object[]{c.classe(), c.presences(), pourcent(c.taux())});

        section(doc, "Absences par matière", sousTitre);
        table(doc, new String[]{"Matière", "Absences", "Taux de présence"}, r.parMatiere(),
                (ParMatiere m) -> new Object[]{m.matiere(), m.absences(), pourcent(m.taux())});

        section(doc, "Étudiants à absences fréquentes", sousTitre);
        if (r.aRisque().isEmpty()) doc.add(new Paragraph("Aucun étudiant au-delà du seuil sur cette période.", petit));
        else table(doc, new String[]{"Étudiant", "Matricule", "Classe", "Absences", "Taux de présence"}, r.aRisque(),
                (EtudiantARisque e) -> new Object[]{e.etudiant().getNomComplet(), e.etudiant().getMatricule(),
                        e.etudiant().getClasse().getNom(), e.absences(), pourcent(e.taux())});

        section(doc, "Détail des séances", sousTitre);
        table(doc, COLONNES_SEANCES, r.seances(), this::ligneSeance);

        doc.close();
        return sortie.toByteArray();
    }

    private void section(Document doc, String texte, Font police) {
        Paragraph p = new Paragraph(texte, police);
        p.setSpacingBefore(14);
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private <T> void table(Document doc, String[] entetes, List<T> lignes, Function<T, Object[]> valeurs) {
        PdfPTable t = new PdfPTable(entetes.length);
        t.setWidthPercentage(100);
        Font entete = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        Font cellule = new Font(Font.HELVETICA, 9);
        for (String e : entetes) {
            PdfPCell c = new PdfPCell(new Phrase(e, entete));
            c.setBackgroundColor(INDIGO);
            c.setPadding(4);
            t.addCell(c);
        }
        t.setHeaderRows(1);   // en-tete repete sur chaque page
        for (T ligne : lignes) {
            for (Object v : valeurs.apply(ligne)) {
                PdfPCell c = new PdfPCell(new Phrase(String.valueOf(v), cellule));
                c.setPadding(4);
                t.addCell(c);
            }
        }
        if (lignes.isEmpty()) {
            PdfPCell vide = new PdfPCell(new Phrase("Aucune donnée", cellule));
            vide.setColspan(entetes.length);
            t.addCell(vide);
        }
        doc.add(t);
    }

    // ======================= Excel =======================

    @Override
    public byte[] excel(Rapport r) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            CellStyle entete = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font gras = wb.createFont();
            gras.setBold(true);
            entete.setFont(gras);

            Sheet synthese = wb.createSheet("Synthèse");
            ligne(synthese, 0, null, "AttendFlow — Rapport des présences");
            ligne(synthese, 1, null, r.description());
            ligne(synthese, 2, null, "Généré le " + LocalDateTime.now().format(HORODATAGE));
            ligne(synthese, 4, entete, "Séances saisies", "Taux de présence (%)", "Présents", "Absents", "Retards", "Justifiés");
            ligne(synthese, 5, null, r.nbSeances(), r.taux(), r.presents(), r.absents(), r.retards(), r.justifies());

            feuille(wb, "Séances", entete, COLONNES_SEANCES, r.seances(), this::ligneSeance);
            feuille(wb, "Par classe", entete, new String[]{"Classe", "Présences saisies", "Taux (%)"}, r.parClasse(),
                    (ParClasse c) -> new Object[]{c.classe(), c.presences(), c.taux()});
            feuille(wb, "Par matière", entete, new String[]{"Matière", "Absences", "Taux (%)"}, r.parMatiere(),
                    (ParMatiere m) -> new Object[]{m.matiere(), m.absences(), m.taux()});
            feuille(wb, "Étudiants à risque", entete, new String[]{"Nom", "Prénom", "Matricule", "Classe", "Absences", "Taux (%)"},
                    r.aRisque(), (EtudiantARisque e) -> new Object[]{e.etudiant().getNom(), e.etudiant().getPrenom(),
                            e.etudiant().getMatricule(), e.etudiant().getClasse().getNom(), e.absences(), e.taux()});

            for (Sheet s : wb) for (int c = 0; c < 10; c++) s.setColumnWidth(c, 18 * 256);
            wb.write(sortie);
            return sortie.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private <T> void feuille(Workbook wb, String nom, CellStyle entete, String[] colonnes, List<T> lignes,
                             Function<T, Object[]> valeurs) {
        Sheet s = wb.createSheet(nom);
        ligne(s, 0, entete, (Object[]) colonnes);
        for (int i = 0; i < lignes.size(); i++) ligne(s, i + 1, null, valeurs.apply(lignes.get(i)));
        s.createFreezePane(0, 1);
    }

    /** Nombres ecrits comme nombres (et non texte) pour que les formules Excel fonctionnent. */
    private void ligne(Sheet s, int numero, CellStyle style, Object... valeurs) {
        Row row = s.createRow(numero);
        for (int i = 0; i < valeurs.length; i++) {
            Cell c = row.createCell(i);
            Object v = valeurs[i];
            if (v instanceof Number n) c.setCellValue(n.doubleValue());
            else if (v != null) c.setCellValue(v.toString());
            if (style != null) c.setCellStyle(style);
        }
    }

    // ======================= Commun =======================

    private Object[] ligneSeance(LigneSeance l) {
        return new Object[]{l.seance().getDate().format(JOUR), l.seance().getHeureDebut() + " - " + l.seance().getHeureFin(),
                l.seance().getMatiere().getIntitule(), l.seance().getClasse().getNom(),
                l.seance().getEnseignant().getNomComplet(), l.presents(), l.absents(), l.retards(), l.justifies(), l.taux()};
    }

    private static String pourcent(Integer taux) {
        return taux == null ? "—" : taux + " %";
    }
}
