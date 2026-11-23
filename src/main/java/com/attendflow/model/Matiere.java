package com.attendflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "matiere")
@Getter
@Setter
@NoArgsConstructor
public class Matiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String intitule;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    private Double coefficient;

    @ManyToMany(mappedBy = "matieres")
    private Set<Enseignant> enseignants = new HashSet<>();

    public Matiere(String intitule, String code, Double coefficient) {
        this.intitule = intitule;
        this.code = code;
        this.coefficient = coefficient;
    }
}
