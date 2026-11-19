package com.attendflow.service;

import com.attendflow.model.Etudiant;
import com.attendflow.model.Justificatif;
import com.attendflow.model.Utilisateur;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

/** F-24 (l'etudiant depose) et F-25 (l'administrateur, ou l'enseignant de la seance, valide ou refuse). */
public interface JustificatifService {

    record Fichier(Path chemin, String typeContenu) {}

    /**
     * Depose un justificatif pour une absence de l'etudiant. Un justificatif refuse peut etre remplace.
     * @throws IllegalArgumentException fichier, motif ou absence invalide (message affichable)
     * @throws IllegalStateException    un justificatif est deja en attente ou accepte
     */
    Justificatif deposer(Etudiant etudiant, Long presenceId, String motif, MultipartFile fichier);

    List<Justificatif> mesJustificatifs(Etudiant etudiant);

    /** Admin : tous ; enseignant : ceux des absences de ses seances. */
    List<Justificatif> enAttente(Utilisateur utilisateur);

    List<Justificatif> traitesRecemment(Utilisateur utilisateur);

    /**
     * F-25 : si accepte, la presence passe a JUSTIFIE (modification tracee, RG-08).
     * @throws org.springframework.security.access.AccessDeniedException ni admin ni l'enseignant de la seance
     */
    void traiter(Utilisateur traitant, Long justificatifId, boolean accepte);

    /** @throws org.springframework.security.access.AccessDeniedException ni admin, ni l'enseignant de la seance, ni l'etudiant concerne */
    Fichier fichier(Utilisateur utilisateur, Long justificatifId);
}
