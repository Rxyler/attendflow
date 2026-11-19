package com.attendflow.service.impl;

import static com.attendflow.service.Textes.t;
import com.attendflow.model.*;
import com.attendflow.model.enums.StatutPresence;
import com.attendflow.repository.*;
import com.attendflow.service.RapportService;
import com.attendflow.service.StatistiqueService.EtudiantARisque;
import com.attendflow.service.StatistiqueService.Point;
import com.attendflow.service.TauxPresence;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.attendflow.service.TauxPresence.compter;

@Service
@Transactional(readOnly = true)
public class RapportServiceImpl implements RapportService {

    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PresenceRepository presences;
    private final ParametreRepository parametres;
    private final ClasseRepository classes;
    private final MatiereRepository matieres;
    private final EnseignantRepository enseignants;

    public RapportServiceImpl(PresenceRepository presences, ParametreRepository parametres, ClasseRepository classes,
                              MatiereRepository matieres, EnseignantRepository enseignants) {
        this.presences = presences;
        this.parametres = parametres;
        this.classes = classes;
        this.matieres = matieres;
        this.enseignants = enseignants;
    }

    @Override
    public Rapport generer(Utilisateur utilisateur, Filtres demandes) {
        LocalDate au = demandes.au() != null ? demandes.au() : LocalDate.now();
        LocalDate du = demandes.du() != null ? demandes.du() : au.minusDays(30);
        if (du.isAfter(au)) { LocalDate t = du; du = au; au = t; }   // periode saisie a l'envers
        // Un enseignant ne peut jamais voir les donnees d'un autre, quel que soit le filtre envoye.
        Long enseignantId = utilisateur instanceof Enseignant e ? e.getId() : demandes.enseignantId();
        Filtres f = new Filtres(du, au, demandes.classeId(), demandes.matiereId(), enseignantId);
        Parametre p = parametres.findFirstByOrderByIdAsc().orElseGet(Parametre::new);

        List<Presence> lignes = presences.pourRapport(du, au).stream()
                .filter(pr -> f.classeId() == null || pr.getSeance().getClasse().getId().equals(f.classeId()))
                .filter(pr -> f.matiereId() == null || pr.getSeance().getMatiere().getId().equals(f.matiereId()))
                .filter(pr -> f.enseignantId() == null || pr.getSeance().getEnseignant().getId().equals(f.enseignantId()))
                .toList();
        List<StatutPresence> statuts = statuts(lignes);

        List<ParClasse> parClasse = grouper(lignes, pr -> pr.getSeance().getClasse().getNom()).entrySet().stream()
                .map(e -> new ParClasse(e.getKey(), TauxPresence.taux(statuts(e.getValue()), p), e.getValue().size()))
                .sorted(Comparator.comparing(ParClasse::classe)).toList();

        List<ParMatiere> parMatiere = grouper(lignes, pr -> pr.getSeance().getMatiere().getIntitule()).entrySet().stream()
                .map(e -> new ParMatiere(e.getKey(), compter(statuts(e.getValue()), StatutPresence.ABSENT),
                        TauxPresence.taux(statuts(e.getValue()), p)))
                .sorted(Comparator.comparing(ParMatiere::absences).reversed()).toList();

        List<Point> evolution = grouper(lignes, pr -> pr.getSeance().getDate()).entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new Point(e.getKey(), TauxPresence.taux(statuts(e.getValue()), p))).toList();

        List<EtudiantARisque> aRisque = grouper(lignes, Presence::getEtudiant).entrySet().stream()
                .filter(e -> TauxPresence.seuilDepasse(statuts(e.getValue()), p))
                .map(e -> new EtudiantARisque(e.getKey(), TauxPresence.taux(statuts(e.getValue()), p),
                        compter(statuts(e.getValue()), StatutPresence.ABSENT)))
                .sorted(Comparator.comparing(EtudiantARisque::taux)).toList();

        List<LigneSeance> seances = grouper(lignes, Presence::getSeance).entrySet().stream()
                .map(e -> {
                    List<StatutPresence> s = statuts(e.getValue());
                    return new LigneSeance(e.getKey(), compter(s, StatutPresence.PRESENT), compter(s, StatutPresence.ABSENT),
                            compter(s, StatutPresence.RETARD), compter(s, StatutPresence.JUSTIFIE), TauxPresence.taux(s, p));
                })
                .sorted(Comparator.comparing((LigneSeance l) -> l.seance().getDate())
                        .thenComparing(l -> l.seance().getHeureDebut()).reversed())
                .toList();

        return new Rapport(f, description(f), seances.size(), TauxPresence.taux(statuts, p),
                compter(statuts, StatutPresence.PRESENT), compter(statuts, StatutPresence.ABSENT),
                compter(statuts, StatutPresence.RETARD), compter(statuts, StatutPresence.JUSTIFIE),
                parClasse, parMatiere, evolution, aRisque, seances);
    }

    private String description(Filtres f) {
        String classe = f.classeId() == null ? t("toutes") : classes.findById(f.classeId()).map(Classe::getNom).orElse("?");
        String matiere = f.matiereId() == null ? t("toutes") : matieres.findById(f.matiereId()).map(Matiere::getIntitule).orElse("?");
        String enseignant = f.enseignantId() == null ? t("tous") : enseignants.findById(f.enseignantId()).map(Utilisateur::getNomComplet).orElse("?");
        return t("Du {0} au {1} · Classe : {2} · Matière : {3} · Enseignant : {4}", f.du().format(JOUR), f.au().format(JOUR), classe, matiere, enseignant);
    }

    private static List<StatutPresence> statuts(List<Presence> lignes) {
        return lignes.stream().map(Presence::getStatut).toList();
    }

    private static <K> Map<K, List<Presence>> grouper(List<Presence> lignes, Function<Presence, K> cle) {
        return lignes.stream().collect(Collectors.groupingBy(cle, LinkedHashMap::new, Collectors.toList()));
    }
}
