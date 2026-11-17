package com.attendflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Salle de cours, alimentee par la synchronisation avec le projet partenaire. */
@Entity
@Table(name = "salle")
@Getter
@Setter
@NoArgsConstructor
public class Salle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String nom;

    private Integer capacite;

    public Salle(String nom, Integer capacite) {
        this.nom = nom;
        this.capacite = capacite;
    }
}
