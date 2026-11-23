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

    List<Etudiant> findByClasseOrderByNomAscPrenomAsc(Classe classe);

    boolean existsByMatricule(String matricule);

    @EntityGraph(attributePaths = "classe")
    Optional<Etudiant> findWithClasseByEmail(String email);

    @EntityGraph(attributePaths = "classe")
    Optional<Etudiant> findWithClasseById(Long id);

    @EntityGraph(attributePaths = "classe")
    @Query("select e from Etudiant e where lower(e.nom) like :motif or lower(e.prenom) like :motif "
            + "or lower(e.matricule) like :motif or lower(e.email) like :motif order by e.nom, e.prenom")
    List<Etudiant> rechercher(@Param("motif") String motif);

    boolean existsByMatriculeAndIdNot(String matricule, Long id);

    boolean existsByClasse(Classe classe);

    @Query("select e.classe.id, count(e) from Etudiant e group by e.classe.id")
    List<Object[]> compterParClasse();
}
