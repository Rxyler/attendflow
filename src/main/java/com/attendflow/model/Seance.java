package com.attendflow.model;

import com.attendflow.model.enums.EtatSeance;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seance planifiee, fournie par le projet partenaire (RG-09) :
 * AttendFlow la stocke localement mais ne la cree ni ne la modifie.
 */
@Entity
@Table(name = "seance")
@Getter
@Setter
@NoArgsConstructor
public class Seance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Identifiant d'origine dans le planning du projet partenaire (RG-09). */
    @Column(name = "id_externe", nullable = false, unique = true, length = 64)
    private String idExterne;

    @Column(name = "date_seance", nullable = false)
    private LocalDate date;

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EtatSeance etat = EtatSeance.PLANIFIEE;

    @Column(name = "date_synchro")
    private LocalDateTime dateSynchro;

    /** Classe "1" -- "0..*" Seance : planifie */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "classe_id", nullable = false)
    private Classe classe;

    /** Matiere "1" -- "0..*" Seance : concerne */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "matiere_id", nullable = false)
    private Matiere matiere;

    /** Salle "1" -- "0..*" Seance : accueille */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "salle_id", nullable = false)
    private Salle salle;

    /** Enseignant "1" -- "0..*" Seance : assure (RG-03) */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private Enseignant enseignant;

    /**
     * Seance "1" *-- "0..*" Presence : genere (composition).
     * Une seance annulee n'est jamais supprimee : ses presences sont conservees (RG-10).
     */
    @OneToMany(mappedBy = "seance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Presence> presences = new ArrayList<>();

    public Seance(String idExterne, LocalDate date, LocalTime heureDebut, LocalTime heureFin,
                  Classe classe, Matiere matiere, Salle salle, Enseignant enseignant) {
        this.idExterne = idExterne;
        this.date = date;
        this.heureDebut = heureDebut;
        this.heureFin = heureFin;
        this.classe = classe;
        this.matiere = matiere;
        this.salle = salle;
        this.enseignant = enseignant;
    }

    /** RG-10 : une seance annulee n'est plus proposee a la prise de presences. */
    public boolean isOuvertePourPresences() {
        return etat != EtatSeance.ANNULEE;
    }
}
