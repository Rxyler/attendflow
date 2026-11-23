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

@Entity
@Table(name = "seance")
@Getter
@Setter
@NoArgsConstructor
public class Seance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "classe_id", nullable = false)
    private Classe classe;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "matiere_id", nullable = false)
    private Matiere matiere;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "salle_id", nullable = false)
    private Salle salle;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private Enseignant enseignant;

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

    public boolean isOuvertePourPresences() {
        return etat != EtatSeance.ANNULEE;
    }
}
