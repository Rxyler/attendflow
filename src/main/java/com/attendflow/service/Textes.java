package com.attendflow.service;

import org.springframework.context.i18n.LocaleContextHolder;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Properties;

/**
 * Messages produits cote serveur (erreurs, confirmations, emails, notifications, exports).
 * Le texte francais sert de cle : textes_en.properties donne sa version anglaise.
 * Ainsi le francais reste lisible dans le code et ne change jamais ; une phrase sans traduction
 * s'affiche simplement en francais. Les valeurs variables s'ecrivent {0}, {1}...
 */
public final class Textes {

    private static final Properties EN = new Properties();

    static {
        try (InputStream in = Textes.class.getResourceAsStream("/textes_en.properties")) {
            if (in != null) EN.load(new InputStreamReader(in, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new IllegalStateException("textes_en.properties illisible", e);
        }
    }

    private Textes() {
    }

    /** Dans la langue de la requete en cours (francais hors requete). */
    public static String t(String fr, Object... valeurs) {
        return t(LocaleContextHolder.getLocaleContext() == null ? Locale.FRENCH : LocaleContextHolder.getLocale(), fr, valeurs);
    }

    /** Dans une langue donnee : celle du destinataire d'un email ou d'une notification. */
    public static String t(Locale langue, String fr, Object... valeurs) {
        String modele = langue != null && "en".equals(langue.getLanguage()) ? EN.getProperty(fr, fr) : fr;
        for (int i = 0; i < valeurs.length; i++) modele = modele.replace("{" + i + "}", String.valueOf(valeurs[i]));
        return modele;
    }
}
