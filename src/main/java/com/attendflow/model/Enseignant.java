package com.attendflow.model;

import com.attendflow.model.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

/** Enseignant : assure des seances et enseigne une ou plusieurs matieres. */
@Entity
@Table(name = "enseignant")
@Getter
@Setter
@NoArgsConstructor
public class Enseignant extends Utilisateur {

    @Column(length = 120)
    private String specialite;

    /** Enseignant "0..*" -- "1..*" Matiere : enseigne */
    @ManyToMany
    @JoinTable(
            name = "enseignant_matiere",
            joinColumns = @JoinColumn(name = "enseignant_id"),
            inverseJoinColumns = @JoinColumn(name = "matiere_id")
    )
    private Set<Matiere> matieres = new HashSet<>();

    public Enseignant(String nom, String prenom, String email, String motDePasse, String specialite) {
        super(nom, prenom, email, motDePasse, Role.ENSEIGNANT);
        this.specialite = specialite;
    }
}
