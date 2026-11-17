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

    // Les @EntityGraph chargent classe, matiere, salle et enseignant avec la seance : les pages les affichent.

    /** Avant suppression : une classe, matiere ou enseignant utilise par une seance est conserve (historique). */
    boolean existsByClasse(Classe classe);

    boolean existsByMatiere(Matiere matiere);

    boolean existsByEnseignant(Enseignant enseignant);

    /** RG-09 : retrouver une seance par son identifiant d'origine lors de la synchronisation. */
    Optional<Seance> findByIdExterne(String idExterne);

    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    Optional<Seance> findWithDetailsById(Long id);

    /** F-13 / F-16 : seances d'un enseignant sur une periode (jour ou semaine). */
    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    List<Seance> findByEnseignantAndDateBetweenOrderByDateAscHeureDebutAsc(
            Enseignant enseignant, LocalDate debut, LocalDate fin);

    /** F-13 : emploi du temps d'une classe (vue etudiant). */
    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    List<Seance> findByClasseAndDateBetweenOrderByDateAscHeureDebutAsc(Classe classe, LocalDate debut, LocalDate fin);

    /** F-13 : vue admin de toutes les seances sur une periode. */
    @EntityGraph(attributePaths = {"classe", "matiere", "salle", "enseignant"})
    List<Seance> findByDateBetweenOrderByDateAscHeureDebutAsc(LocalDate debut, LocalDate fin);
}
