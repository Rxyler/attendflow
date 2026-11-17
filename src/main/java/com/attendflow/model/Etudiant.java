package com.attendflow.model;

import com.attendflow.model.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** Etudiant : appartient a une seule classe par annee universitaire (RG-07). */
@Entity
@Table(name = "etudiant")
@Getter
@Setter
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    /** RG-06 : un matricule est unique. */
    @Column(nullable = false, unique = true, length = 30)
    private String matricule;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    /** Chemin ou nom du fichier photo. */
    private String photo;

    /** Classe "1" -- "0..*" Etudiant : contient */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "classe_id", nullable = false)
    private Classe classe;

    public Etudiant(String nom, String prenom, String email, String motDePasse, String matricule, Classe classe) {
        super(nom, prenom, email, motDePasse, Role.ETUDIANT);
        this.matricule = matricule;
        this.classe = classe;
    }
}
