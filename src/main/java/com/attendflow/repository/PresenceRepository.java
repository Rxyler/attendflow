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

    /** Avant suppression d'un etudiant : son historique de presences est conserve. */
    boolean existsByEtudiant(Etudiant etudiant);

    /** F-17 : presences deja saisies pour une seance. */
    List<Presence> findBySeance(Seance seance);

    /** F-27 / F-28 : historique d'un etudiant, le plus recent d'abord (avec matiere et enseignant). */
    @EntityGraph(attributePaths = {"seance", "seance.matiere", "seance.enseignant"})
    List<Presence> findByEtudiantOrderBySeanceDateDesc(Etudiant etudiant);

    /** F-26 : presences des seances d'un enseignant sur une periode. */
    @EntityGraph(attributePaths = "seance")
    List<Presence> findBySeanceEnseignantAndSeanceDateBetween(Enseignant enseignant, LocalDate debut, LocalDate fin);

    /** Tableau de bord admin : toutes les presences sur une periode. */
    @EntityGraph(attributePaths = "seance")
    List<Presence> findBySeanceDateBetween(LocalDate debut, LocalDate fin);

    /** F-29 : presences d'une periode avec tout ce qu'affiche le rapport. */
    @EntityGraph(attributePaths = {"seance", "seance.classe", "seance.matiere", "seance.enseignant", "etudiant", "etudiant.classe"})
    @Query("select p from Presence p where p.seance.date between :du and :au")
    List<Presence> pourRapport(@Param("du") LocalDate du, @Param("au") LocalDate au);

    /** Etudiants a absences frequentes : toutes les presences avec l'etudiant et sa classe. */
    @EntityGraph(attributePaths = {"etudiant", "etudiant.classe"})
    List<Presence> findAllBy();
}
