package com.attendflow.model;

import com.attendflow.model.enums.EtatJustificatif;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Justificatif d'absence depose par l'etudiant (F-24) et traite par l'admin (F-25). */
@Entity
@Table(name = "justificatif")
@Getter
@Setter
@NoArgsConstructor
public class Justificatif {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Chemin du fichier PDF/image depose. */
    @Column(nullable = false)
    private String fichier;

    @Column(length = 500)
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EtatJustificatif etat = EtatJustificatif.EN_ATTENTE;

    @Column(name = "date_depot", nullable = false)
    private LocalDateTime dateDepot;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    /** Presence "1" -- "0..1" Justificatif : une presence a au plus un justificatif. */
    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "presence_id", nullable = false, unique = true)
    private Presence presence;

    /** Admin "0..1" -- "0..*" Justificatif : traite (vide tant qu'il est en attente). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Admin traitePar;

    /**
     * Enseignant "0..1" -- "0..*" Justificatif : l'enseignant de la seance peut aussi trancher.
     * Colonne a part : traite_par_id reste liee a la table admin dans les bases deja creees.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_enseignant_id")
    private Enseignant traiteParEnseignant;

    /** Qui a accepte ou refuse : l'administrateur ou l'enseignant (null tant qu'il est en attente). */
    public Utilisateur getTraitant() {
        return traitePar != null ? traitePar : traiteParEnseignant;
    }

    public Justificatif(Presence presence, String fichier, String motif) {
        this.presence = presence;
        this.fichier = fichier;
        this.motif = motif;
        this.dateDepot = LocalDateTime.now();
    }
}
