package com.attendflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Parametres de la plateforme, definis par l'administrateur.
 * Une seule ligne en base (Admin "1..*" -- "1" Parametre : configure).
 */
@Entity
@Table(name = "parametre")
@Getter
@Setter
@NoArgsConstructor
public class Parametre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** RG-05 : seuil d'alerte en pourcentage d'absence (ex. 20.0). */
    @Column(name = "seuil_absence", nullable = false)
    private Double seuilAbsence = 20.0;

    /** RG-05 : nombre maximal d'absences non justifiees avant alerte. */
    @Column(name = "nb_max_absences_non_justifiees", nullable = false)
    private Integer nbMaxAbsencesNonJustifiees = 8;

    /** F-22 : delai pendant lequel l'enseignant peut modifier une prise de presence. */
    @Column(name = "delai_modification_heures", nullable = false)
    private Integer delaiModificationHeures = 48;

    /** RG-04 : mode de calcul du taux de presence. */
    @Column(name = "retard_comme_present", nullable = false)
    private boolean retardCommePresent = true;

    @Column(name = "justifie_comme_present", nullable = false)
    private boolean justifieCommePresent = true;

    /** Dernier administrateur ayant modifie les parametres. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Admin modifiePar;
}
