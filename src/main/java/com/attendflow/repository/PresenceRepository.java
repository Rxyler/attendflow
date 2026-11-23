package com.attendflow.repository;

import com.attendflow.model.Enseignant;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Presence;
import com.attendflow.model.Seance;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PresenceRepository extends JpaRepository<Presence, Long> {

    boolean existsByEtudiant(Etudiant etudiant);

    List<Presence> findBySeance(Seance seance);

    @EntityGraph(attributePaths = {"seance", "seance.matiere", "seance.enseignant"})
    List<Presence> findByEtudiantOrderBySeanceDateDesc(Etudiant etudiant);

    @EntityGraph(attributePaths = "seance")
    List<Presence> findBySeanceEnseignantAndSeanceDateBetween(Enseignant enseignant, LocalDate debut, LocalDate fin);

    @EntityGraph(attributePaths = "seance")
    List<Presence> findBySeanceDateBetween(LocalDate debut, LocalDate fin);

    @EntityGraph(attributePaths = {"seance", "seance.classe", "seance.matiere", "seance.enseignant", "etudiant", "etudiant.classe"})
    @Query("select p from Presence p where p.seance.date between :du and :au")
    List<Presence> pourRapport(@Param("du") LocalDate du, @Param("au") LocalDate au);

    @EntityGraph(attributePaths = {"etudiant", "etudiant.classe"})
    List<Presence> findAllBy();
}
