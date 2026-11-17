package com.attendflow.service.impl;

import com.attendflow.model.*;
import com.attendflow.repository.*;
import com.attendflow.service.JustificatifService;
import com.attendflow.service.ReferentielService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReferentielServiceImpl implements ReferentielService {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Set<String> FORMATS_PHOTO = Set.of("png", "jpg", "jpeg");

    private final EtudiantRepository etudiants;
    private final EnseignantRepository enseignants;
    private final ClasseRepository classes;
    private final MatiereRepository matieres;
    private final UtilisateurRepository utilisateurs;
    private final SeanceRepository seances;
    private final PresenceRepository presences;
    private final NotificationRepository notifications;
    private final TokenReinitialisationRepository tokens;
    private final PasswordEncoder encoder;
    private final StockageFichiers stockage;
    private final Path dossierPhotos;

    public ReferentielServiceImpl(EtudiantRepository etudiants, EnseignantRepository enseignants, ClasseRepository classes,
                                  MatiereRepository matieres, UtilisateurRepository utilisateurs, SeanceRepository seances,
                                  PresenceRepository presences, NotificationRepository notifications,
                                  TokenReinitialisationRepository tokens, PasswordEncoder encoder, StockageFichiers stockage,
                                  @Value("${attendflow.uploads.photos:uploads/photos}") String dossierPhotos) {
        this.etudiants = etudiants;
        this.enseignants = enseignants;
        this.classes = classes;
        this.matieres = matieres;
        this.utilisateurs = utilisateurs;
        this.seances = seances;
        this.presences = presences;
        this.notifications = notifications;
        this.tokens = tokens;
        this.encoder = encoder;
        this.stockage = stockage;
        this.dossierPhotos = Paths.get(dossierPhotos).toAbsolutePath().normalize();
    }

    // ================= Etudiants =================

    @Override
    @Transactional(readOnly = true)
    public List<Etudiant> rechercherEtudiants(String recherche, Long classeId) {
        String motif = "%" + (recherche == null ? "" : recherche.trim().toLowerCase(Locale.ROOT)) + "%";
        return etudiants.rechercher(motif).stream()
                .filter(e -> classeId == null || e.getClasse().getId().equals(classeId))
                .toList();
    }

    @Override
    public Etudiant enregistrerEtudiant(Long id, EtudiantForm f, MultipartFile photo) {
        String email = emailValide(f.email(), id);
        String matricule = requis(f.matricule(), "Le matricule", 30);
        if (id == null ? etudiants.existsByMatricule(matricule) : etudiants.existsByMatriculeAndIdNot(matricule, id)) {
            throw new IllegalArgumentException("Le matricule " + matricule + " existe déjà.");   // RG-06
        }
        if (f.dateNaissance() != null && f.dateNaissance().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de naissance ne peut pas être dans le futur.");
        }
        Classe classe = f.classeId() == null ? null : classes.findById(f.classeId()).orElse(null);
        if (classe == null) throw new IllegalArgumentException("Choisissez une classe.");

        Etudiant e = id == null
                ? new Etudiant(null, null, email, motDePasseAleatoire(), matricule, classe)
                : etudiants.findById(id).orElseThrow(() -> new IllegalArgumentException("Étudiant introuvable."));
        e.setNom(requis(f.nom(), "Le nom", 80));
        e.setPrenom(requis(f.prenom(), "Le prénom", 80));
        e.setEmail(email);
        e.setTelephone(optionnel(f.telephone(), 30));
        e.setMatricule(matricule);
        e.setDateNaissance(f.dateNaissance());
        e.setClasse(classe);
        if (photo != null && !photo.isEmpty()) {
            String nom = stockage.enregistrer(photo, dossierPhotos, FORMATS_PHOTO, "PNG ou JPG");
            stockage.supprimer(dossierPhotos, e.getPhoto());
            e.setPhoto(nom);
        }
        return etudiants.save(e);
    }

    @Override
    public void supprimerEtudiant(Long id) {
        Etudiant e = etudiants.findById(id).orElseThrow(() -> new IllegalArgumentException("Étudiant introuvable."));
        if (presences.existsByEtudiant(e)) {
            throw new IllegalStateException(e.getNomComplet()
                    + " a déjà des présences enregistrées : la suppression effacerait son historique.");
        }
        supprimerCompte(e);
        stockage.supprimer(dossierPhotos, e.getPhoto());
        etudiants.delete(e);
    }

    @Override
    public ResultatImport importerEtudiants(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) throw new IllegalArgumentException("Choisissez un fichier CSV ou Excel.");
        String nom = Objects.requireNonNullElse(fichier.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        List<List<String>> lignes = nom.endsWith(".xlsx") ? lireExcel(fichier) : lireCsv(fichier);
        if (lignes.isEmpty()) throw new IllegalArgumentException("Le fichier est vide.");

        List<String> colonnes = lignes.getFirst().stream()
                .map(c -> c.replace("﻿", "").trim().toLowerCase(Locale.ROOT).replace("é", "e").replace(" ", "_")).toList();
        for (String obligatoire : List.of("nom", "prenom", "email", "matricule", "classe")) {
            if (!colonnes.contains(obligatoire)) {
                throw new IllegalArgumentException("Colonne « " + obligatoire + " » absente de l'en-tête.");
            }
        }

        int crees = 0;
        List<String> erreurs = new ArrayList<>();
        for (int i = 1; i < lignes.size(); i++) {
            List<String> valeurs = lignes.get(i);
            if (valeurs.stream().allMatch(String::isBlank)) continue;
            Map<String, String> v = new HashMap<>();
            for (int c = 0; c < colonnes.size() && c < valeurs.size(); c++) v.put(colonnes.get(c), valeurs.get(c).trim());
            try {
                Classe classe = classes.findByNom(v.get("classe"))
                        .orElseThrow(() -> new IllegalArgumentException("classe « " + v.get("classe") + " » inconnue"));
                enregistrerEtudiant(null, new EtudiantForm(v.get("nom"), v.get("prenom"), v.get("email"),
                        v.get("telephone"), v.get("matricule"), date(v.get("date_naissance")), classe.getId()), null);
                crees++;
            } catch (IllegalArgumentException ex) {
                erreurs.add("Ligne " + (i + 1) + " : " + ex.getMessage());
            }
        }
        return new ResultatImport(crees, erreurs);
    }

    private List<List<String>> lireCsv(MultipartFile fichier) {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(fichier.getInputStream(), StandardCharsets.UTF_8))) {
            List<String> lignes = r.lines().toList();
            String sep = !lignes.isEmpty() && lignes.getFirst().contains(";") ? ";" : ",";
            // shortcut: pas de champs entre guillemets contenant le separateur ; utiliser une librairie CSV si les fichiers recus en ont
            return lignes.stream().map(l -> Arrays.asList(l.split(sep, -1))).toList();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Premiere feuille du classeur ; les dates Excel sont converties en AAAA-MM-JJ. */
    private List<List<String>> lireExcel(MultipartFile fichier) {
        DataFormatter formateur = new DataFormatter(Locale.FRANCE);
        try (Workbook wb = WorkbookFactory.create(fichier.getInputStream())) {
            List<List<String>> lignes = new ArrayList<>();
            for (Row row : wb.getSheetAt(0)) {
                List<String> valeurs = new ArrayList<>();
                for (int c = 0; c < Math.max(row.getLastCellNum(), 0); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                    valeurs.add(cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)
                            ? cell.getLocalDateTimeCellValue().toLocalDate().toString()
                            : formateur.formatCellValue(cell));
                }
                lignes.add(valeurs);
            }
            return lignes;
        } catch (IOException | RuntimeException e) {
            throw new IllegalArgumentException("Fichier Excel illisible (.xlsx attendu).");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public JustificatifService.Fichier photo(Long etudiantId) {
        Etudiant e = etudiants.findById(etudiantId).filter(x -> x.getPhoto() != null)
                .orElseThrow(() -> new IllegalArgumentException("Pas de photo"));
        return new JustificatifService.Fichier(stockage.chemin(dossierPhotos, e.getPhoto()), stockage.typeContenu(e.getPhoto()));
    }

    // ================= Classes =================

    @Override
    @Transactional(readOnly = true)
    public List<Classe> classes() {
        return classes.findAllByOrderByNomAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Long> effectifs() {
        return etudiants.compterParClasse().stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }

    @Override
    public Classe enregistrerClasse(Long id, ClasseForm f) {
        String nom = requis(f.nom(), "Le nom", 80);
        if (id == null ? classes.findByNom(nom).isPresent() : classes.existsByNomAndIdNot(nom, id)) {
            throw new IllegalArgumentException("La classe " + nom + " existe déjà.");
        }
        String annee = optionnel(f.anneeUniversitaire(), 9);
        if (annee != null && !annee.matches("\\d{4}-\\d{4}")) {
            throw new IllegalArgumentException("Année universitaire au format 2026-2027.");
        }
        Classe c = id == null ? new Classe()
                : classes.findById(id).orElseThrow(() -> new IllegalArgumentException("Classe introuvable."));
        c.setNom(nom);
        c.setNiveau(optionnel(f.niveau(), 50));
        c.setResponsable(optionnel(f.responsable(), 120));
        c.setAnneeUniversitaire(annee);
        return classes.save(c);
    }

    @Override
    public void supprimerClasse(Long id) {
        Classe c = classes.findById(id).orElseThrow(() -> new IllegalArgumentException("Classe introuvable."));
        if (etudiants.existsByClasse(c)) throw new IllegalStateException("La classe " + c.getNom() + " contient des étudiants.");
        if (seances.existsByClasse(c)) throw new IllegalStateException("La classe " + c.getNom() + " a des séances dans l'emploi du temps.");
        classes.delete(c);
    }

    // ================= Matieres =================

    @Override
    @Transactional(readOnly = true)
    public List<Matiere> matieres() {
        return matieres.findAllByOrderByIntituleAsc();
    }

    @Override
    public Matiere enregistrerMatiere(Long id, MatiereForm f) {
        String code = requis(f.code(), "Le code", 20).toUpperCase(Locale.ROOT);
        if (id == null ? matieres.findByCode(code).isPresent() : matieres.existsByCodeAndIdNot(code, id)) {
            throw new IllegalArgumentException("Le code " + code + " existe déjà.");
        }
        if (f.coefficient() != null && f.coefficient() <= 0) {
            throw new IllegalArgumentException("Le coefficient doit être positif.");
        }
        Matiere m = id == null ? new Matiere()
                : matieres.findById(id).orElseThrow(() -> new IllegalArgumentException("Matière introuvable."));
        m.setIntitule(requis(f.intitule(), "L'intitulé", 120));
        m.setCode(code);
        m.setCoefficient(f.coefficient());
        return matieres.save(m);
    }

    @Override
    public void supprimerMatiere(Long id) {
        Matiere m = matieres.findById(id).orElseThrow(() -> new IllegalArgumentException("Matière introuvable."));
        if (seances.existsByMatiere(m)) throw new IllegalStateException("La matière " + m.getIntitule() + " a des séances.");
        m.getEnseignants().forEach(e -> e.getMatieres().remove(m));   // l'enseignant porte l'association
        matieres.delete(m);
    }

    // ================= Enseignants =================

    @Override
    @Transactional(readOnly = true)
    public List<Enseignant> enseignants() {
        return enseignants.findAllByOrderByNomAscPrenomAsc();
    }

    @Override
    public Enseignant enregistrerEnseignant(Long id, EnseignantForm f) {
        String email = emailValide(f.email(), id);
        List<Matiere> choisies = f.matiereIds() == null ? List.of() : matieres.findAllById(f.matiereIds());
        if (choisies.isEmpty()) {
            throw new IllegalArgumentException("Affectez au moins une matière.");   // Enseignant "0..*" -- "1..*" Matiere
        }
        Enseignant e = id == null
                ? new Enseignant(null, null, email, motDePasseAleatoire(), null)
                : enseignants.findById(id).orElseThrow(() -> new IllegalArgumentException("Enseignant introuvable."));
        e.setNom(requis(f.nom(), "Le nom", 80));
        e.setPrenom(requis(f.prenom(), "Le prénom", 80));
        e.setEmail(email);
        e.setTelephone(optionnel(f.telephone(), 30));
        e.setSpecialite(optionnel(f.specialite(), 120));
        e.getMatieres().clear();
        e.getMatieres().addAll(choisies);
        return enseignants.save(e);
    }

    @Override
    public void supprimerEnseignant(Long id) {
        Enseignant e = enseignants.findById(id).orElseThrow(() -> new IllegalArgumentException("Enseignant introuvable."));
        if (seances.existsByEnseignant(e)) {
            throw new IllegalStateException(e.getNomComplet() + " a des séances dans l'emploi du temps.");
        }
        supprimerCompte(e);
        enseignants.delete(e);
    }

    // ================= Outils =================

    /** Les comptes crees n'ont pas de mot de passe connu : l'utilisateur le choisit via "Mot de passe oublie" (F-02). */
    private String motDePasseAleatoire() {
        return encoder.encode(UUID.randomUUID().toString());
    }

    private void supprimerCompte(Utilisateur u) {
        notifications.deleteByDestinataire(u);
        tokens.deleteByUtilisateur(u);
    }

    private String emailValide(String email, Long id) {
        String e = requis(email, "L'email", 150).toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(e).matches()) throw new IllegalArgumentException("Email invalide : " + e);
        if (id == null ? utilisateurs.existsByEmail(e) : utilisateurs.existsByEmailAndIdNot(e, id)) {
            throw new IllegalArgumentException("L'email " + e + " est déjà utilisé.");   // RG-06
        }
        return e;
    }

    private static String requis(String valeur, String champ, int max) {
        if (valeur == null || valeur.isBlank()) throw new IllegalArgumentException(champ + " est obligatoire.");
        if (valeur.trim().length() > max) throw new IllegalArgumentException(champ + " dépasse " + max + " caractères.");
        return valeur.trim();
    }

    private static String optionnel(String valeur, int max) {
        if (valeur == null || valeur.isBlank()) return null;
        if (valeur.trim().length() > max) throw new IllegalArgumentException("Une valeur dépasse " + max + " caractères.");
        return valeur.trim();
    }

    private static LocalDate date(String texte) {
        if (texte == null || texte.isBlank()) return null;
        for (String format : List.of("yyyy-MM-dd", "dd/MM/yyyy")) {
            try {
                return LocalDate.parse(texte.trim(), DateTimeFormatter.ofPattern(format));
            } catch (DateTimeParseException ignored) {
                // essaie le format suivant
            }
        }
        throw new IllegalArgumentException("date « " + texte + " » invalide (AAAA-MM-JJ ou JJ/MM/AAAA)");
    }
}
