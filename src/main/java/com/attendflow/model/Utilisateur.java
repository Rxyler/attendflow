package com.attendflow.model;

import com.attendflow.model.enums.Mascotte;
import com.attendflow.model.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Classe mere de tous les comptes (Admin, Enseignant, Etudiant).
 * Strategie JOINED : une table "utilisateur" pour les champs communs,
 * plus une table par sous-classe reliee par le meme id.
 */
@Entity
@Table(name = "utilisateur")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(nullable = false, length = 80)
    private String prenom;

    /** RG-06 : un email est unique. */
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 30)
    private String telephone;

    /** Mot de passe hache avec BCrypt (jamais en clair). */
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** Compagnon affiche a la place des initiales (null : initiales). */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Mascotte mascotte;

    /** Langue choisie (fr ou en) : sert aux emails et notifications ; null = francais. */
    @Column(length = 5)
    private String langue;

    protected Utilisateur(String nom, String prenom, String email, String motDePasse, Role role) {
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.role = role;
    }

    public String getNomComplet() {
        return prenom.equalsIgnoreCase(nom) ? nom : prenom + " " + nom;   // "Admin Admin" s'affiche "Admin"
    }
}
