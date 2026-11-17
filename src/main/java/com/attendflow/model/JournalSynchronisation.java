package com.attendflow.model;

import com.attendflow.model.enums.StatutSynchronisation;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** F-12 : journal de chaque synchronisation de l'emploi du temps avec le projet partenaire. */
@Entity
@Table(name = "journal_synchronisation")
@Getter
@Setter
@NoArgsConstructor
public class JournalSynchronisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_synchro", nullable = false)
    private LocalDateTime dateSynchro;

    @Column(name = "nb_ajoutees", nullable = false)
    private Integer nbAjoutees = 0;

    @Column(name = "nb_modifiees", nullable = false)
    private Integer nbModifiees = 0;

    @Column(name = "nb_annulees", nullable = false)
    private Integer nbAnnulees = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutSynchronisation statut;

    @Column(length = 1000)
    private String message;

    /** Admin "0..1" -- "0..*" : null si la synchronisation est automatique (periodique). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declenche_par_id")
    private Admin declenchePar;
}
