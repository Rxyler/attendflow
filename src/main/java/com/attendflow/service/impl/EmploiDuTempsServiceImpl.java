package com.attendflow.service.impl;

import com.attendflow.model.Enseignant;
import com.attendflow.model.Etudiant;
import com.attendflow.model.Seance;
import com.attendflow.model.Utilisateur;
import com.attendflow.repository.SeanceRepository;
import com.attendflow.service.EmploiDuTempsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class EmploiDuTempsServiceImpl implements EmploiDuTempsService {

    private final SeanceRepository seances;

    public EmploiDuTempsServiceImpl(SeanceRepository seances) {
        this.seances = seances;
    }

    @Override
    public List<Seance> seancesDeLaSemaine(Utilisateur utilisateur, LocalDate lundi, Long classeId, Long enseignantId) {
        LocalDate vendredi = lundi.plusDays(4);
        return switch (utilisateur) {
            case Enseignant e -> seances.findByEnseignantAndDateBetweenOrderByDateAscHeureDebutAsc(e, lundi, vendredi);
            case Etudiant et -> seances.findByClasseAndDateBetweenOrderByDateAscHeureDebutAsc(et.getClasse(), lundi, vendredi);
            default -> seances.findByDateBetweenOrderByDateAscHeureDebutAsc(lundi, vendredi).stream()
                    .filter(s -> classeId == null || s.getClasse().getId().equals(classeId))
                    .filter(s -> enseignantId == null || s.getEnseignant().getId().equals(enseignantId))
                    .toList();
        };
    }

    @Override
    public Optional<Seance> seanceVisible(Utilisateur utilisateur, Long seanceId) {
        return seances.findWithDetailsById(seanceId).filter(s -> switch (utilisateur) {
            case Enseignant e -> s.getEnseignant().getId().equals(e.getId());
            case Etudiant et -> s.getClasse().getId().equals(et.getClasse().getId());
            default -> true;
        });
    }
}
