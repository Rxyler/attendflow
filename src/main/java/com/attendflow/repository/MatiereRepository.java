package com.attendflow.repository;

import com.attendflow.model.Matiere;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatiereRepository extends JpaRepository<Matiere, Long> {

    Optional<Matiere> findByCode(String code);

    @EntityGraph(attributePaths = "enseignants")
    List<Matiere> findAllByOrderByIntituleAsc();

    boolean existsByCodeAndIdNot(String code, Long id);
}