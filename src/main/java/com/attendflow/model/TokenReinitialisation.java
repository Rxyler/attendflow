package com.attendflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** F-02 : jeton a usage unique envoye pour reinitialiser un mot de passe oublie. */
@Entity
@Table(name = "token_reinitialisation")
@Getter
@Setter
@NoArgsConstructor
public class TokenReinitialisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(nullable = false)
    private boolean utilise = false;

    /** Utilisateur "1" -- "0..*" TokenReinitialisation : demande */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    public TokenReinitialisation(Utilisateur utilisateur, String token, LocalDateTime dateExpiration) {
        this.utilisateur = utilisateur;
        this.token = token;
        this.dateExpiration = dateExpiration;
    }

    public boolean isValide() {
        return !utilise && LocalDateTime.now().isBefore(dateExpiration);
    }
}
