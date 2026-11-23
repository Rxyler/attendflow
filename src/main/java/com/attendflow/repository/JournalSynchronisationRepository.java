package com.attendflow.repository;

import com.attendflow.model.JournalSynchronisation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalSynchronisationRepository extends JpaRepository<JournalSynchronisation, Long> {

    @EntityGraph(attributePaths = "declenchePar")
    List<JournalSynchronisation> findTop20ByOrderByDateSynchroDesc();
}
