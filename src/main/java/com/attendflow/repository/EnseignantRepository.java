package com.attendflow.repository;

import com.attendflow.model.Enseignant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnseignantRepository extends JpaRepository<Enseignant, Long> {

    Optional<Enseignant> findByEmail(String email);

    @EntityGraph(attributePaths = "matieres")
    List<Enseignant> findAllByOrderByNomAscPrenomAsc();

    @EntityGraph(attributePaths = "matieres")
    Optional<Enseignant> findWithMatieresById(Long id);
}