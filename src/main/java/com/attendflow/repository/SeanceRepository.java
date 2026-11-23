package com.attendflow.repository;

import com.attendflow.model.Classe;
import com.attendflow.model.Enseignant;
import com.attendflow.model.Matiere;
import com.attendflow.model.Seance;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SeanceRepository extends JpaRepository<Seance, Long> {

    boolean existsByClasse(Classe classe);

    boolean existsByMatiere(Matiere matiere);

    boolean existsByEnseignant(Enseignant enseignant);

    Optional<Seance> findByIdExterne(String idExterne);

    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    Optional<Seance> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    List<Seance> findByEnseignantAndDateBetweenOrderByDateAscHeureDebutAsc(
            Enseignant enseignant, LocalDate debut, LocalDate fin);

    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    List<Seance> findByClasseAndDateBetweenOrderByDateAscHeureDebutAsc(Classe classe, LocalDate debut, LocalDate fin);

    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    List<Seance> findByDateBetweenOrderByDateAscHeureDebutAsc(LocalDate debut, LocalDate fin);
}
