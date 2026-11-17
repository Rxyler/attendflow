package com.attendflow.repository;

import com.attendflow.model.Classe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClasseRepository extends JpaRepository<Classe, Long> {

    Optional<Classe> findByNom(String nom);

    List<Classe> findAllByOrderByNomAsc();

    boolean existsByNomAndIdNot(String nom, Long id);
}