package com.attendflow.repository;

import com.attendflow.model.TokenReinitialisation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenReinitialisationRepository extends JpaRepository<TokenReinitialisation, Long> {

    Optional<TokenReinitialisation> findByToken(String token);

    void deleteByUtilisateur(com.attendflow.model.Utilisateur utilisateur);
}
