package com.attendflow.service;

import com.attendflow.model.Etudiant;
import com.attendflow.model.Justificatif;
import com.attendflow.model.Utilisateur;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

public interface JustificatifService {

    record Fichier(Path chemin, String typeContenu) {}

    Justificatif deposer(Etudiant etudiant, Long presenceId, String motif, MultipartFile fichier);

    List<Justificatif> mesJustificatifs(Etudiant etudiant);

    List<Justificatif> enAttente(Utilisateur utilisateur);

    List<Justificatif> traitesRecemment(Utilisateur utilisateur);

    void traiter(Utilisateur traitant, Long justificatifId, boolean accepte);

    Fichier fichier(Utilisateur utilisateur, Long justificatifId);
}
