package com.attendflow.repository;

import com.attendflow.model.Etudiant;
import com.attendflow.model.Justificatif;
import com.attendflow.model.enums.EtatJustificatif;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JustificatifRepository extends JpaRepository<Justificatif, Long> {

    /** F-25 : liste admin, avec l'etudiant, sa classe et la seance concernee. */
    @EntityGraph(attributePaths = {"presence", "presence.etudiant", "presence.etudiant.classe",
            "presence.seance", "presence.seance.matiere"})
    List<Justificatif> findByEtatOrderByDateDepotAsc(EtatJustificatif etat);

    @EntityGraph(attributePaths = {"presence", "presence.etudiant", "presence.etudiant.classe",
            "presence.seance", "presence.seance.matiere", "traitePar"})
    List<Justificatif> findTop20ByEtatNotOrderByDateTraitementDesc(EtatJustificatif etat);

    /** Page "Mes justificatifs" de l'etudiant. */
    @EntityGraph(attributePaths = {"presence", "presence.seance", "presence.seance.matiere"})
    List<Justificatif> findByPresenceEtudiantOrderByDateDepotDesc(Etudiant etudiant);

    @EntityGraph(attributePaths = {"presence", "presence.etudiant"})
    Optional<Justificatif> findWithPresenceById(Long id);
}
