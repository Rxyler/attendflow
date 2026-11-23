package com.attendflow.service;

public interface MotDePasseService {

    void demanderReinitialisation(String email, String urlDeBase);

    boolean tokenValide(String token);

    void reinitialiser(String token, String nouveauMotDePasse);
}
