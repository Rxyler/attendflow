package com.attendflow.service.impl;

import com.attendflow.model.TokenReinitialisation;
import com.attendflow.repository.TokenReinitialisationRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.EmailService;
import com.attendflow.service.MotDePasseService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        utilisateurs.findByEmail(email.trim()).ifPresent(u -> {
            String token = UUID.randomUUID().toString();
            tokens.save(new TokenReinitialisation(u, token, LocalDateTime.now().plusMinutes(DUREE_VALIDITE_MINUTES)));
            this.email.envoyer(u.getEmail(), "Fas3a - Réinitialisation de votre mot de passe",
                    "Bonjour " + u.getNomComplet() + ",\n\n"
                    + "Pour choisir un nouveau mot de passe, ouvrez ce lien (valable " + DUREE_VALIDITE_MINUTES + " minutes, une seule fois) :\n"
                    + urlDeBase + "/reinitialiser?token=" + token + "\n\n"
                    + "Si vous n'avez rien demandé, ignorez cet email : votre mot de passe reste inchangé.\n\n-- Fas3a");
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
                .orElseThrow(() -> new IllegalArgumentException("Ce lien est invalide ou a expiré."));
        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < LONGUEUR_MIN) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins " + LONGUEUR_MIN + " caractères.");
        }
        t.getUtilisateur().setMotDePasse(encoder.encode(nouveauMotDePasse));
        t.setUtilise(true);
    }
}
