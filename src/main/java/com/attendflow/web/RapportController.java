package com.attendflow.web;

import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.Role;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.ExportService;
import com.attendflow.service.RapportService;
import com.attendflow.service.RapportService.Filtres;
import com.attendflow.service.RapportService.Rapport;
import com.attendflow.service.ReferentielService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Controller
public class RapportController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final RapportService rapports;
    private final ExportService exports;
    private final ReferentielService referentiel;
    private final UtilisateurRepository utilisateurs;

    public RapportController(RapportService rapports, ExportService exports, ReferentielService referentiel,
                             UtilisateurRepository utilisateurs) {
        this.rapports = rapports;
        this.exports = exports;
        this.referentiel = referentiel;
        this.utilisateurs = utilisateurs;
    }

    @GetMapping("/rapports")
    public String rapport(@AuthenticationPrincipal UserDetails compte,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                          @RequestParam(required = false) Long classe, @RequestParam(required = false) Long matiere,
                          @RequestParam(required = false) Long enseignant, Model model) {
        Utilisateur u = utilisateur(compte);
        Rapport r = rapports.generer(u, new Filtres(du, au, classe, matiere, enseignant));
        model.addAttribute("utilisateur", u);
        model.addAttribute("rapport", r);
        model.addAttribute("f", r.filtres());
        model.addAttribute("classes", referentiel.classes());
        model.addAttribute("matieres", referentiel.matieres());
        if (u.getRole() == Role.ADMIN) model.addAttribute("enseignants", referentiel.enseignants());
        return "rapports";
    }

    @GetMapping("/rapports/export.pdf")
    public ResponseEntity<byte[]> pdf(@AuthenticationPrincipal UserDetails compte,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                                      @RequestParam(required = false) Long classe, @RequestParam(required = false) Long matiere,
                                      @RequestParam(required = false) Long enseignant) {
        Rapport r = rapports.generer(utilisateur(compte), new Filtres(du, au, classe, matiere, enseignant));
        return fichier(exports.pdf(r), MediaType.APPLICATION_PDF, "pdf");
    }

    @GetMapping("/rapports/export.xlsx")
    public ResponseEntity<byte[]> excel(@AuthenticationPrincipal UserDetails compte,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                                        @RequestParam(required = false) Long classe, @RequestParam(required = false) Long matiere,
                                        @RequestParam(required = false) Long enseignant) {
        Rapport r = rapports.generer(utilisateur(compte), new Filtres(du, au, classe, matiere, enseignant));
        return fichier(exports.excel(r), XLSX, "xlsx");
    }

    private ResponseEntity<byte[]> fichier(byte[] contenu, MediaType type, String extension) {
        String nom = "rapport-presences-" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + "." + extension;
        return ResponseEntity.ok().contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(nom).build().toString())
                .body(contenu);
    }

    private Utilisateur utilisateur(UserDetails compte) {
        return utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
    }
}
