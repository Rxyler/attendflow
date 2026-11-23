package com.attendflow.repository;

import com.attendflow.model.Parametre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParametreRepository extends JpaRepository<Parametre, Long> {

    @EntityGraph(attributePaths = "modifiePar")
    Optional<Parametre> findFirstByOrderByIdAsc();
}
