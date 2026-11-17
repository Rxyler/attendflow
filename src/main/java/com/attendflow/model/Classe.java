package com.attendflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** Classe (groupe d'etudiants) pour une annee universitaire. */
@Entity
@Table(name = "classe")
@Getter
@Setter
@NoArgsConstructor
public class Classe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(length = 50)
    private String niveau;

    @Column(length = 120)
    private String responsable;

    /** RG-07 : ex. "2026-2027". */
    @Column(name = "annee_universitaire", length = 9)
    private String anneeUniversitaire;

    @OneToMany(mappedBy = "classe")
    private List<Etudiant> etudiants = new ArrayList<>();

    public Classe(String nom, String niveau, String responsable, String anneeUniversitaire) {
        this.nom = nom;
        this.niveau = niveau;
        this.responsable = responsable;
        this.anneeUniversitaire = anneeUniversitaire;
    }

    /** Attribut derive /effectif (F-06) : calcule, pas stocke en base. */
    @Transient
    public int getEffectif() {
        return etudiants.size();
    }
}
