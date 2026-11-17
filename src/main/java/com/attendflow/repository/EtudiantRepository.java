package com.attendflow.repository;

import com.attendflow.model.Classe;
import com.attendflow.model.Etudiant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {

    /** F-17 : liste des etudiants chargee a l'ouverture d'une seance. */
    List<Etudiant> findByClasseOrderByNomAscPrenomAsc(Classe classe);

    /** RG-06 : verifier l'unicite du matricule avant creation. */
    boolean existsByMatricule(String matricule);

    @EntityGraph(attributePaths = "classe")
    Optional<Etudiant> findWithClasseByEmail(String email);

    @EntityGraph(attributePaths = "classe")
    Optional<Etudiant> findWithClasseById(Long id);

    /** F-10 : recherche par nom, prenom, matricule ou email ({@code motif} deja en minuscules, avec %). */
    @EntityGraph(attributePaths = "classe")
    @Query("select e from Etudiant e where lower(e.nom) like :motif or lower(e.prenom) like :motif "
            + "or lower(e.matricule) like :motif or lower(e.email) like :motif order by e.nom, e.prenom")
    List<Etudiant> rechercher(@Param("motif") String motif);

    boolean existsByMatriculeAndIdNot(String matricule, Long id);

    boolean existsByClasse(Classe classe);

    /** Effectif de chaque classe : [id classe, nombre d'etudiants]. */
    @Query("select e.classe.id, count(e) from Etudiant e group by e.classe.id")
    List<Object[]> compterParClasse();
}
