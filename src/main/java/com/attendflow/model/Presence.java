package com.attendflow.model;

import com.attendflow.model.enums.StatutPresence;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "presence",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_presence_seance_etudiant",
                columnNames = {"seance_id", "etudiant_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class Presence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPresence statut;

    @Column(length = 500)
    private String commentaire;

    @Column(name = "date_saisie", nullable = false)
    private LocalDateTime dateSaisie;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "seance_id", nullable = false)
    private Seance seance;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Etudiant etudiant;

    @OneToMany(mappedBy = "presence", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistoriqueModification> historique = new ArrayList<>();

    @OneToOne(mappedBy = "presence")
    private Justificatif justificatif;

    public Presence(Seance seance, Etudiant etudiant, StatutPresence statut) {
        this.seance = seance;
        this.etudiant = etudiant;
        this.statut = statut;
        this.dateSaisie = LocalDateTime.now();
    }
}
