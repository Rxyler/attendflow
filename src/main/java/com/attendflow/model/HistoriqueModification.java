package com.attendflow.model;

import com.attendflow.model.enums.StatutPresence;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** RG-08 : trace de chaque modification d'une presence (auteur, date, ancienne et nouvelle valeur). */
@Entity
@Table(name = "historique_modification")
@Getter
@Setter
@NoArgsConstructor
public class HistoriqueModification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;

    @Enumerated(EnumType.STRING)
    @Column(name = "ancien_statut", nullable = false, length = 20)
    private StatutPresence ancienStatut;

    @Enumerated(EnumType.STRING)
    @Column(name = "nouveau_statut", nullable = false, length = 20)
    private StatutPresence nouveauStatut;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "presence_id", nullable = false)
    private Presence presence;

    /** Utilisateur "1" -- "0..*" HistoriqueModification : auteur */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    public HistoriqueModification(Presence presence, Utilisateur auteur,
                                  StatutPresence ancienStatut, StatutPresence nouveauStatut) {
        this.presence = presence;
        this.auteur = auteur;
        this.ancienStatut = ancienStatut;
        this.nouveauStatut = nouveauStatut;
        this.dateModification = LocalDateTime.now();
    }
}
