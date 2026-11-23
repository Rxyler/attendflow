package com.attendflow.web.admin;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.Role;
import com.attendflow.repository.EtudiantRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.JustificatifService;
import com.attendflow.service.ReferentielService;
import com.attendflow.service.ReferentielService.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.function.Supplier;

/**
 * Ecrans 6 et 7 + matieres et enseignants (F-05 a F-10), reserves a l'admin (voir SecurityConfig).
 * Apres une erreur, le formulaire est rouvert avec les valeurs saisies.
 */
@Controller
public class ReferentielController {

    private final ReferentielService referentiel;
    private final UtilisateurRepository utilisateurs;
    private final EtudiantRepository etudiants;

    public ReferentielController(ReferentielService referentiel, UtilisateurRepository utilisateurs,
                                 EtudiantRepository etudiants) {
        this.referentiel = referentiel;
        this.utilisateurs = utilisateurs;
        this.etudiants = etudiants;
    }

    // ================= Etudiants =================

    @GetMapping("/admin/etudiants")
    public String etudiants(@AuthenticationPrincipal UserDetails compte, @RequestParam(required = false) String q,
                            @RequestParam(required = false) Long classe, @RequestParam(required = false) Long modifier,
                            Model model) {
        commun(compte, model);
        model.addAttribute("etudiants", referentiel.rechercherEtudiants(q, classe));
        model.addAttribute("classes", referentiel.classes());
        model.addAttribute("q", q);
        model.addAttribute("classeFiltre", classe);
        if (modifier != null && !model.containsAttribute("form")) {
            etudiants.findWithClasseById(modifier).ifPresent(e -> {
                model.addAttribute("form", EtudiantForm.de(e));
                model.addAttribute("formId", e.getId());
            });
        }
        return "admin/etudiants";
    }

    @PostMapping("/admin/etudiants")
    public String enregistrerEtudiant(@RequestParam(required = false) Long id, @ModelAttribute EtudiantForm form,
                                      @RequestParam(required = false) MultipartFile photo, RedirectAttributes r) {
        return executer(r, () -> {
            referentiel.enregistrerEtudiant(id, form, photo);
            return id == null ? t("Étudiant ajouté. Il choisira son mot de passe via « Mot de passe oublié ».")
                    : t("Étudiant modifié.");
        }, form, id, "/admin/etudiants");
    }

    @PostMapping("/admin/etudiants/{id}/supprimer")
    public String supprimerEtudiant(@PathVariable Long id, RedirectAttributes r) {
        return executer(r, () -> { referentiel.supprimerEtudiant(id); return t("Étudiant supprimé."); },
                null, null, "/admin/etudiants");
    }

    @PostMapping("/admin/etudiants/import")
    public String importer(@RequestParam MultipartFile fichier, RedirectAttributes r) {
        try {
            ResultatImport res = referentiel.importerEtudiants(fichier);
            r.addFlashAttribute(res.erreurs().isEmpty() ? "succes" : "avertissement",
                    t("{0} étudiant(s) importé(s).", res.crees()) + (res.erreurs().isEmpty() ? "" : t(" Lignes ignorées :")));
            r.addFlashAttribute("erreursImport", res.erreurs());
        } catch (IllegalArgumentException e) {
            r.addFlashAttribute("erreur", e.getMessage());
        }
        return "redirect:/admin/etudiants";
    }

    /** Photo d'un etudiant : visible par l'admin et par l'etudiant lui-meme. */
    @GetMapping("/etudiants/{id}/photo")
    public ResponseEntity<Resource> photo(@PathVariable Long id, @AuthenticationPrincipal UserDetails compte) {
        Utilisateur u = utilisateurs.findByEmail(compte.getUsername()).orElseThrow();
        if (u.getRole() != Role.ADMIN && !u.getId().equals(id)) throw new AccessDeniedException("Photo d'un autre étudiant");
        try {
            JustificatifService.Fichier f = referentiel.photo(id);
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(f.typeContenu()))
                    .header("X-Content-Type-Options", "nosniff").body(new FileSystemResource(f.chemin()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ================= Classes =================

    @GetMapping("/admin/classes")
    public String classes(@AuthenticationPrincipal UserDetails compte, @RequestParam(required = false) Long modifier, Model model) {
        commun(compte, model);
        model.addAttribute("classes", referentiel.classes());
        model.addAttribute("effectifs", referentiel.effectifs());
        if (modifier != null && !model.containsAttribute("form")) {
            referentiel.classes().stream().filter(c -> c.getId().equals(modifier)).findFirst().ifPresent(c -> {
                model.addAttribute("form", new ClasseForm(c.getNom(), c.getNiveau(), c.getResponsable(), c.getAnneeUniversitaire()));
                model.addAttribute("formId", c.getId());
            });
        }
        return "admin/classes";
    }

    @PostMapping("/admin/classes")
    public String enregistrerClasse(@RequestParam(required = false) Long id, @ModelAttribute ClasseForm form, RedirectAttributes r) {
        return executer(r, () -> { referentiel.enregistrerClasse(id, form); return id == null ? t("Classe ajoutée.") : t("Classe modifiée."); },
                form, id, "/admin/classes");
    }

    @PostMapping("/admin/classes/{id}/supprimer")
    public String supprimerClasse(@PathVariable Long id, RedirectAttributes r) {
        return executer(r, () -> { referentiel.supprimerClasse(id); return t("Classe supprimée."); }, null, null, "/admin/classes");
    }

    // ================= Matieres =================

    @GetMapping("/admin/matieres")
    public String matieres(@AuthenticationPrincipal UserDetails compte, @RequestParam(required = false) Long modifier, Model model) {
        commun(compte, model);
        model.addAttribute("matieres", referentiel.matieres());
        if (modifier != null && !model.containsAttribute("form")) {
            referentiel.matieres().stream().filter(m -> m.getId().equals(modifier)).findFirst().ifPresent(m -> {
                model.addAttribute("form", new MatiereForm(m.getIntitule(), m.getCode(), m.getCoefficient()));
                model.addAttribute("formId", m.getId());
            });
        }
        return "admin/matieres";
    }

    @PostMapping("/admin/matieres")
    public String enregistrerMatiere(@RequestParam(required = false) Long id, @ModelAttribute MatiereForm form, RedirectAttributes r) {
        return executer(r, () -> { referentiel.enregistrerMatiere(id, form); return id == null ? t("Matière ajoutée.") : t("Matière modifiée."); },
                form, id, "/admin/matieres");
    }

    @PostMapping("/admin/matieres/{id}/supprimer")
    public String supprimerMatiere(@PathVariable Long id, RedirectAttributes r) {
        return executer(r, () -> { referentiel.supprimerMatiere(id); return t("Matière supprimée."); }, null, null, "/admin/matieres");
    }

    // ================= Enseignants =================

    @GetMapping("/admin/enseignants")
    public String enseignants(@AuthenticationPrincipal UserDetails compte, @RequestParam(required = false) Long modifier, Model model) {
        commun(compte, model);
        model.addAttribute("enseignants", referentiel.enseignants());
        model.addAttribute("matieres", referentiel.matieres());
        if (modifier != null && !model.containsAttribute("form")) {
            referentiel.enseignants().stream().filter(e -> e.getId().equals(modifier)).findFirst().ifPresent(e -> {
                model.addAttribute("form", new EnseignantForm(e.getNom(), e.getPrenom(), e.getEmail(), e.getTelephone(),
                        e.getSpecialite(), e.getMatieres().stream().map(m -> m.getId()).collect(java.util.stream.Collectors.toSet()),
                        e.getDateNaissance()));
                model.addAttribute("formId", e.getId());
            });
        }
        return "admin/enseignants";
    }

    @PostMapping("/admin/enseignants")
    public String enregistrerEnseignant(@RequestParam(required = false) Long id, @ModelAttribute EnseignantForm form, RedirectAttributes r) {
        return executer(r, () -> {
            referentiel.enregistrerEnseignant(id, form);
            return id == null ? t("Enseignant ajouté. Il choisira son mot de passe via « Mot de passe oublié ».") : t("Enseignant modifié.");
        }, form, id, "/admin/enseignants");
    }

    @PostMapping("/admin/enseignants/{id}/supprimer")
    public String supprimerEnseignant(@PathVariable Long id, RedirectAttributes r) {
        return executer(r, () -> { referentiel.supprimerEnseignant(id); return t("Enseignant supprimé."); }, null, null, "/admin/enseignants");
    }

    // ================= Outils =================

    private void commun(UserDetails compte, Model model) {
        model.addAttribute("utilisateur", utilisateurs.findByEmail(compte.getUsername()).orElseThrow());
    }

    /** Execute l'action ; en cas d'erreur, renvoie le message et les valeurs saisies pour rouvrir le formulaire. */
    private String executer(RedirectAttributes r, Supplier<String> action, Object form, Long id, String page) {
        try {
            r.addFlashAttribute("succes", action.get());
        } catch (IllegalArgumentException | IllegalStateException e) {
            r.addFlashAttribute("erreur", e.getMessage());
            if (form != null) {
                r.addFlashAttribute("form", form);
                r.addFlashAttribute("formId", id);
                r.addFlashAttribute("ouvrir", true);
            }
        }
        return "redirect:" + page;
    }
}
