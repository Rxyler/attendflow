package com.attendflow.service.impl;

import static com.attendflow.service.Textes.t;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Enregistrement sur disque des fichiers deposes (justificatifs, photos).
 * Verifie l'extension ET les premiers octets du fichier ; le nom d'origine n'est jamais utilise.
 */
@Component
public class StockageFichiers {

    private static final Map<String, String> TYPES = Map.of(
            "pdf", "application/pdf", "png", "image/png", "jpg", "image/jpeg", "jpeg", "image/jpeg");
    private static final Map<String, byte[]> SIGNATURES = Map.of(
            "application/pdf", new byte[]{'%', 'P', 'D', 'F'},
            "image/png", new byte[]{(byte) 0x89, 'P', 'N', 'G'},
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});

    /**
     * @param extensions extensions autorisees, ex. Set.of("pdf", "png", "jpg", "jpeg")
     * @return le nom (aleatoire) du fichier enregistre dans {@code dossier}
     * @throws IllegalArgumentException fichier vide, format non autorise ou contenu qui ne correspond pas
     */
    public String enregistrer(MultipartFile fichier, Path dossier, Set<String> extensions, String formatsLisibles) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException(t("Ajoutez un fichier ({0}).", formatsLisibles));
        }
        String ext = extension(fichier.getOriginalFilename());
        if (!extensions.contains(ext)) throw new IllegalArgumentException(t("Format accepté : {0}.", formatsLisibles));
        byte[] signature = SIGNATURES.get(TYPES.get(ext));
        try (InputStream in = fichier.getInputStream()) {
            byte[] debut = in.readNBytes(signature.length);
            if (!Arrays.equals(debut, signature)) {
                throw new IllegalArgumentException(t("Le contenu du fichier ne correspond pas au format {0}.", ext.toUpperCase()));
            }
            Files.createDirectories(dossier);
            String nom = UUID.randomUUID() + "." + ext;
            fichier.transferTo(dossier.resolve(nom));
            return nom;
        } catch (IOException e) {
            throw new UncheckedIOException("Enregistrement du fichier impossible", e);
        }
    }

    /** Chemin du fichier, en refusant toute sortie du dossier (ex. "../"). */
    public Path chemin(Path dossier, String nom) {
        Path chemin = dossier.resolve(nom).normalize();
        if (!chemin.startsWith(dossier)) throw new IllegalArgumentException("Chemin invalide");
        return chemin;
    }

    public String typeContenu(String nom) {
        return TYPES.getOrDefault(extension(nom), "application/octet-stream");
    }

    public void supprimer(Path dossier, String nom) {
        if (nom == null) return;
        try {
            Files.deleteIfExists(chemin(dossier, nom));
        } catch (IOException | IllegalArgumentException ignored) {
            // un ancien fichier introuvable n'empeche pas l'operation en cours
        }
    }

    private static String extension(String nom) {
        if (nom == null || !nom.contains(".")) return "";
        return nom.substring(nom.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
