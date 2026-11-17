package com.attendflow.service;

/** Envoi d'emails texte. Un echec d'envoi est journalise et ne bloque jamais l'utilisateur. */
public interface EmailService {

    void envoyer(String destinataire, String sujet, String texte);
}
