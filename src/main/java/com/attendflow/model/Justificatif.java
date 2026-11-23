package com.attendflow.model;

import com.attendflow.model.enums.EtatJustificatif;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "justificatif")
@Getter
@Setter
@NoArgsConstructor
public class Justificatif {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "presence_id", nullable = false, unique = true)
    private Presence presence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Admin traitePar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_enseignant_id")
    private Enseignant traiteParEnseignant;

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
