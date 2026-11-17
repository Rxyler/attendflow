package com.attendflow.repository;

import com.attendflow.model.Salle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalleRepository extends JpaRepository<Salle, Long> {

    Optional<Salle> findByNom(String nom);
}
