package com.attendflow.service.impl;

import com.attendflow.config.LangueConfig;
import static com.attendflow.service.Textes.t;
import com.attendflow.model.TokenReinitialisation;
import com.attendflow.repository.TokenReinitialisationRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.EmailService;
import com.attendflow.service.MotDePasseService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class MotDePasseServiceImpl implements MotDePasseService {

    static final int DUREE_VALIDITE_MINUTES = 30;
    static final int LONGUEUR_MIN = 8;

    private final UtilisateurRepository utilisateurs;
    private final TokenReinitialisationRepository tokens;
    private final PasswordEncoder encoder;
    private final EmailService email;

    public MotDePasseServiceImpl(UtilisateurRepository utilisateurs, TokenReinitialisationRepository tokens,
                                 PasswordEncoder encoder, EmailService email) {
        this.utilisateurs = utilisateurs;
        this.tokens = tokens;
        this.encoder = encoder;
        this.email = email;
    }

    @Override
    @Transactional
    public void demanderReinitialisation(String email, String urlDeBase) {
        utilisateurs.findByEmail(email.trim().toLowerCase(Locale.ROOT)).ifPresent(u -> {
            String token = UUID.randomUUID().toString();
            tokens.save(new TokenReinitialisation(u, token, LocalDateTime.now().plusMinutes(DUREE_VALIDITE_MINUTES)));
            this.email.envoyer(u.getEmail(), t(LangueConfig.de(u), "Fas3a - Réinitialisation de votre mot de passe"),
                    t(LangueConfig.de(u), "Bonjour {0},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable {1} minutes, une seule fois) :\n{2}\n\n"
                            + "Si vous n'avez rien demandé, ignorez cet email : votre mot de passe reste inchangé.\n\n-- Fas3a",
                            u.getNomComplet(), DUREE_VALIDITE_MINUTES, urlDeBase + "/reinitialiser?token=" + token));
        });
    }

    @Override
    @Transactional(readOnly = true)
    public boolean tokenValide(String token) {
        return tokens.findByToken(token).map(TokenReinitialisation::isValide).orElse(false);
    }

    @Override
    @Transactional
    public void reinitialiser(String token, String nouveauMotDePasse) {
        TokenReinitialisation t = tokens.findByToken(token)
                .filter(TokenReinitialisation::isValide)
                .orElseThrow(() -> new IllegalArgumentException(t("Ce lien est invalide ou a expiré.")));
        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < LONGUEUR_MIN) {
            throw new IllegalArgumentException(t("Le mot de passe doit contenir au moins {0} caractères.", LONGUEUR_MIN));
        }
        if (nouveauMotDePasse.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException(t("Le mot de passe est trop long (72 caractères maximum)."));
        }
        t.getUtilisateur().setMotDePasse(encoder.encode(nouveauMotDePasse));
        t.setUtilise(true);
    }
}
