package com.attendflow.service;

public interface EmailService {

    void envoyer(String destinataire, String sujet, String texte);
}
