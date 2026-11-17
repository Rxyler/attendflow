package com.attendflow.service;

/** F-02 : recuperation de mot de passe ("Mot de passe oublie"). */
public interface MotDePasseService {

    /**
     * Cree un jeton et envoie le lien si l'email existe.
     * Ne dit jamais si l'email existe, pour ne pas reveler les comptes.
     */
    void demanderReinitialisation(String email, String urlDeBase);

    boolean tokenValide(String token);

    /** @throws IllegalArgumentException si le jeton est invalide ou le mot de passe trop court */
    void reinitialiser(String token, String nouveauMotDePasse);
}
