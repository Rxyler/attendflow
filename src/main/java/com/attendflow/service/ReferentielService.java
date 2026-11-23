package com.attendflow.service;

import com.attendflow.model.Classe;
import com.attendflow.model.Enseignant;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Matiere;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ReferentielService {

    record EtudiantForm(String nom, String prenom, String email, String telephone, String matricule,
                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateNaissance, Long classeId) {
        public static EtudiantForm de(Etudiant e) {
            return new EtudiantForm(e.getNom(), e.getPrenom(), e.getEmail(), e.getTelephone(), e.getMatricule(),
                    e.getDateNaissance(), e.getClasse().getId());
        }
    }

    record ClasseForm(String nom, String niveau, String responsable, String anneeUniversitaire) {}

    record MatiereForm(String intitule, String code, Double coefficient) {}

    record EnseignantForm(String nom, String prenom, String email, String telephone, String specialite,
                          Set<Long> matiereIds, @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateNaissance) {}

    record ResultatImport(int crees, List<String> erreurs) {}

    List<Etudiant> rechercherEtudiants(String recherche, Long classeId);

    Etudiant enregistrerEtudiant(Long id, EtudiantForm form, MultipartFile photo);

    void supprimerEtudiant(Long id);

    ResultatImport importerEtudiants(MultipartFile csv);

    JustificatifService.Fichier photo(Long etudiantId);

    List<Classe> classes();

    Map<Long, Long> effectifs();

    Classe enregistrerClasse(Long id, ClasseForm form);

    void supprimerClasse(Long id);

    List<Matiere> matieres();

    Matiere enregistrerMatiere(Long id, MatiereForm form);

    void supprimerMatiere(Long id);

    List<Enseignant> enseignants();

    Enseignant enregistrerEnseignant(Long id, EnseignantForm form);

    void supprimerEnseignant(Long id);
}
