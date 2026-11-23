package com.attendflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "parametre")
@Getter
@Setter
@NoArgsConstructor
public class Parametre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seuil_absence", nullable = false)
    private Double seuilAbsence = 20.0;

    @Column(name = "nb_max_absences_non_justifiees", nullable = false)
    private Integer nbMaxAbsencesNonJustifiees = 8;

    @Column(name = "delai_modification_heures", nullable = false)
    private Integer delaiModificationHeures = 48;

    @Column(name = "retard_comme_present", nullable = false)
    private boolean retardCommePresent = true;

    @Column(name = "justifie_comme_present", nullable = false)
    private boolean justifieCommePresent = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Admin modifiePar;
}
