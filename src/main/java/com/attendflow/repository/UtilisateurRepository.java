package com.attendflow.repository;

import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Couvre Admin, Enseignant et Etudiant (heritage) : utilise pour la connexion (F-01). */
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    /** F-16a : prevenir les administrateurs. */
    List<Utilisateur> findByRole(Role role);
}
