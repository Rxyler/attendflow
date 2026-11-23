package com.attendflow.model;

import com.attendflow.model.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "etudiant")
@Getter
@Setter
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    @Column(nullable = false, unique = true, length = 30)
    private String matricule;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    private String photo;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "classe_id", nullable = false)
    private Classe classe;

    public Etudiant(String nom, String prenom, String email, String motDePasse, String matricule, Classe classe) {
        super(nom, prenom, email, motDePasse, Role.ETUDIANT);
        this.matricule = matricule;
        this.classe = classe;
    }
}
