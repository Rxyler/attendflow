package com.attendflow.service.impl;

import static com.attendflow.service.Textes.t;
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
import java.time.Period;
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
    private static final Pattern NOM_PERSONNE = Pattern.compile("\\p{L}[\\p{L}\\p{M}]*([ '’-]\\p{L}[\\p{L}\\p{M}]*)*");
    private static final Pattern MATRICULE = Pattern.compile("[0-9]{8}");
    private static final Pattern TELEPHONE = Pattern.compile("\\+?[0-9 ]{8,20}");
    private static final int AGE_ETUDIANT_MIN = 5, AGE_ETUDIANT_MAX = 24, AGE_ENSEIGNANT_MIN = 24, AGE_ENSEIGNANT_MAX = 100;
    private static final double COEFFICIENT_MAX = 20;

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
        if (!MATRICULE.matcher(matricule).matches()) {
            throw new IllegalArgumentException(t("Le matricule doit contenir exactement 8 chiffres (ex. 20260001)."));
        }
        if (id == null ? etudiants.existsByMatricule(matricule) : etudiants.existsByMatriculeAndIdNot(matricule, id)) {
            throw new IllegalArgumentException(t("Le matricule {0} existe déjà.", matricule));
        }
        verifierAge(f.dateNaissance(), AGE_ETUDIANT_MIN, AGE_ETUDIANT_MAX, "l'étudiant");
        Classe classe = f.classeId() == null ? null : classes.findById(f.classeId()).orElse(null);
        if (classe == null) throw new IllegalArgumentException(t("Choisissez une classe."));

        Etudiant e = id == null
                ? new Etudiant(null, null, email, motDePasseAleatoire(), matricule, classe)
                : etudiants.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Étudiant introuvable.")));
        e.setNom(nomPersonne(f.nom(), "Le nom"));
        e.setPrenom(nomPersonne(f.prenom(), "Le prénom"));
        e.setEmail(email);
        e.setTelephone(telephone(f.telephone()));
        e.setMatricule(matricule);
        e.setDateNaissance(f.dateNaissance());
        e.setClasse(classe);
        if (photo != null && !photo.isEmpty()) {
            String nom = stockage.enregistrer(photo, dossierPhotos, FORMATS_PHOTO, t("PNG ou JPG"));
            stockage.supprimer(dossierPhotos, e.getPhoto());
            e.setPhoto(nom);
        }
        return etudiants.save(e);
    }

    @Override
    public void supprimerEtudiant(Long id) {
        Etudiant e = etudiants.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Étudiant introuvable.")));
        if (presences.existsByEtudiant(e)) {
            throw new IllegalStateException(t("{0} a déjà des présences enregistrées : la suppression effacerait son historique.", e.getNomComplet()));
        }
        supprimerCompte(e);
        stockage.supprimer(dossierPhotos, e.getPhoto());
        etudiants.delete(e);
    }

    @Override
    public ResultatImport importerEtudiants(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) throw new IllegalArgumentException(t("Choisissez un fichier CSV ou Excel."));
        String nom = Objects.requireNonNullElse(fichier.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        List<List<String>> lignes = nom.endsWith(".xlsx") ? lireExcel(fichier) : lireCsv(fichier);
        if (lignes.isEmpty()) throw new IllegalArgumentException(t("Le fichier est vide."));

        List<String> colonnes = lignes.getFirst().stream()
                .map(c -> c.replace("﻿", "").trim().toLowerCase(Locale.ROOT).replace("é", "e").replace(" ", "_")).toList();
        for (String obligatoire : List.of("nom", "prenom", "email", "matricule", "classe")) {
            if (!colonnes.contains(obligatoire)) {
                throw new IllegalArgumentException(t("Colonne « {0} » absente de l'en-tête.", obligatoire));
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
                        .orElseThrow(() -> new IllegalArgumentException(t("classe « {0} » inconnue", v.get("classe"))));
                enregistrerEtudiant(null, new EtudiantForm(v.get("nom"), v.get("prenom"), v.get("email"),
                        v.get("telephone"), v.get("matricule"), date(v.get("date_naissance")), classe.getId()), null);
                crees++;
            } catch (IllegalArgumentException ex) {
                erreurs.add(t("Ligne {0} : {1}", i + 1, ex.getMessage()));
            }
        }
        return new ResultatImport(crees, erreurs);
    }

    private List<List<String>> lireCsv(MultipartFile fichier) {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(fichier.getInputStream(), StandardCharsets.UTF_8))) {
            List<String> lignes = r.lines().toList();
            String sep = !lignes.isEmpty() && lignes.getFirst().contains(";") ? ";" : ",";
            return lignes.stream().map(l -> Arrays.asList(l.split(sep, -1))).toList();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

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
            throw new IllegalArgumentException(t("Fichier Excel illisible (.xlsx attendu)."));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public JustificatifService.Fichier photo(Long etudiantId) {
        Etudiant e = etudiants.findById(etudiantId).filter(x -> x.getPhoto() != null)
                .orElseThrow(() -> new IllegalArgumentException("Pas de photo"));
        return new JustificatifService.Fichier(stockage.chemin(dossierPhotos, e.getPhoto()), stockage.typeContenu(e.getPhoto()));
    }

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
        String nom = avecLettre(requis(f.nom(), "Le nom", 80), "Le nom");
        if (id == null ? classes.findByNom(nom).isPresent() : classes.existsByNomAndIdNot(nom, id)) {
            throw new IllegalArgumentException(t("La classe {0} existe déjà.", nom));
        }
        String annee = optionnel(f.anneeUniversitaire(), 9);
        if (annee != null && (!annee.matches("\\d{4}-\\d{4}")
                || Integer.parseInt(annee.substring(5)) != Integer.parseInt(annee.substring(0, 4)) + 1)) {
            throw new IllegalArgumentException(t("Année universitaire au format 2026-2027."));
        }
        Classe c = id == null ? new Classe()
                : classes.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Classe introuvable.")));
        c.setNom(nom);
        c.setNiveau(optionnel(f.niveau(), 50));
        String responsable = optionnel(f.responsable(), 120);
        c.setResponsable(responsable == null ? null : nomPersonne(responsable, "Le responsable"));
        c.setAnneeUniversitaire(annee);
        return classes.save(c);
    }

    @Override
    public void supprimerClasse(Long id) {
        Classe c = classes.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Classe introuvable.")));
        if (etudiants.existsByClasse(c)) throw new IllegalStateException(t("La classe {0} contient des étudiants.", c.getNom()));
        if (seances.existsByClasse(c)) throw new IllegalStateException(t("La classe {0} a des séances dans l'emploi du temps.", c.getNom()));
        classes.delete(c);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Matiere> matieres() {
        return matieres.findAllByOrderByIntituleAsc();
    }

    @Override
    public Matiere enregistrerMatiere(Long id, MatiereForm f) {
        String code = requis(f.code(), "Le code", 20).toUpperCase(Locale.ROOT);
        if (id == null ? matieres.findByCode(code).isPresent() : matieres.existsByCodeAndIdNot(code, id)) {
            throw new IllegalArgumentException(t("Le code {0} existe déjà.", code));
        }
        if (f.coefficient() != null && !(f.coefficient() > 0 && f.coefficient() <= COEFFICIENT_MAX)) {
            throw new IllegalArgumentException(t("Le coefficient doit être compris entre 0 et {0}.", (int) COEFFICIENT_MAX));
        }
        Matiere m = id == null ? new Matiere()
                : matieres.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Matière introuvable.")));
        m.setIntitule(avecLettre(requis(f.intitule(), "L'intitulé", 120), "L'intitulé"));
        m.setCode(code);
        m.setCoefficient(f.coefficient());
        return matieres.save(m);
    }

    @Override
    public void supprimerMatiere(Long id) {
        Matiere m = matieres.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Matière introuvable.")));
        if (seances.existsByMatiere(m)) throw new IllegalStateException(t("La matière {0} a des séances.", m.getIntitule()));
        m.getEnseignants().forEach(e -> e.getMatieres().remove(m));
        matieres.delete(m);
    }

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
            throw new IllegalArgumentException(t("Affectez au moins une matière."));
        }
        Enseignant e = id == null
                ? new Enseignant(null, null, email, motDePasseAleatoire(), null)
                : enseignants.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Enseignant introuvable.")));
        e.setNom(nomPersonne(f.nom(), "Le nom"));
        e.setPrenom(nomPersonne(f.prenom(), "Le prénom"));
        e.setEmail(email);
        e.setTelephone(telephone(f.telephone()));
        verifierAge(f.dateNaissance(), AGE_ENSEIGNANT_MIN, AGE_ENSEIGNANT_MAX, "l'enseignant");
        e.setDateNaissance(f.dateNaissance());
        String specialite = optionnel(f.specialite(), 120);
        e.setSpecialite(specialite == null ? null : avecLettre(specialite, "La spécialité"));
        e.getMatieres().clear();
        e.getMatieres().addAll(choisies);
        return enseignants.save(e);
    }

    @Override
    public void supprimerEnseignant(Long id) {
        Enseignant e = enseignants.findById(id).orElseThrow(() -> new IllegalArgumentException(t("Enseignant introuvable.")));
        if (seances.existsByEnseignant(e)) {
            throw new IllegalStateException(t("{0} a des séances dans l'emploi du temps.", e.getNomComplet()));
        }
        supprimerCompte(e);
        enseignants.delete(e);
    }

    private String motDePasseAleatoire() {
        return encoder.encode(UUID.randomUUID().toString());
    }

    private void supprimerCompte(Utilisateur u) {
        notifications.deleteByDestinataire(u);
        tokens.deleteByUtilisateur(u);
    }

    private String emailValide(String email, Long id) {
        String e = requis(email, "L'email", 150).toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(e).matches()) throw new IllegalArgumentException(t("Email invalide : {0}", e));
        if (id == null ? utilisateurs.existsByEmail(e) : utilisateurs.existsByEmailAndIdNot(e, id)) {
            throw new IllegalArgumentException(t("L'email {0} est déjà utilisé.", e));
        }
        return e;
    }

    private static String requis(String valeur, String champ, int max) {
        if (valeur == null || valeur.isBlank()) throw new IllegalArgumentException(t("{0} est obligatoire.", t(champ)));
        if (valeur.trim().length() > max) throw new IllegalArgumentException(t("{0} dépasse {1} caractères.", t(champ), max));
        return valeur.trim();
    }

    private static String nomPersonne(String valeur, String champ) {
        String nom = requis(valeur, champ, 80).replaceAll("\\s+", " ");
        if (!NOM_PERSONNE.matcher(nom).matches()) {
            throw new IllegalArgumentException(t("{0} ne doit contenir que des lettres, des espaces, des tirets ou des apostrophes.", t(champ)));
        }
        return nom;
    }

    private static String avecLettre(String valeur, String champ) {
        if (valeur.codePoints().noneMatch(Character::isLetter)) {
            throw new IllegalArgumentException(t("{0} doit contenir au moins une lettre.", t(champ)));
        }
        return valeur;
    }

    private static void verifierAge(LocalDate naissance, int min, int max, String qui) {
        if (naissance == null) return;
        if (naissance.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(t("La date de naissance ne peut pas être dans le futur."));
        }
        int age = Period.between(naissance, LocalDate.now()).getYears();
        if (age < min || age > max) {
            throw new IllegalArgumentException(t("Date de naissance invalide : {0} doit avoir entre {1} et {2} ans.", t(qui), min, max));
        }
    }

    private static String telephone(String valeur) {
        String tel = optionnel(valeur, 30);
        if (tel == null) return null;
        long chiffres = tel.chars().filter(Character::isDigit).count();
        if (!TELEPHONE.matcher(tel).matches() || chiffres < 8 || chiffres > 15) {
            throw new IllegalArgumentException(t("Numéro de téléphone invalide : 8 à 15 chiffres, par exemple +216 20 123 456."));
        }
        return tel;
    }

    private static String optionnel(String valeur, int max) {
        if (valeur == null || valeur.isBlank()) return null;
        if (valeur.trim().length() > max) throw new IllegalArgumentException(t("Une valeur dépasse {0} caractères.", max));
        return valeur.trim();
    }

    private static LocalDate date(String texte) {
        if (texte == null || texte.isBlank()) return null;
        for (String format : List.of("yyyy-MM-dd", "dd/MM/yyyy")) {
            try {
                return LocalDate.parse(texte.trim(), DateTimeFormatter.ofPattern(format));
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new IllegalArgumentException(t("date « {0} » invalide (AAAA-MM-JJ ou JJ/MM/AAAA)", texte));
    }
}
