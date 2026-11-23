package com.attendflow.security;

import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TentativesConnexion {

    static final int MAX_ECHECS = 5;
    static final Duration BLOCAGE = Duration.ofMinutes(5);

    private record Etat(int echecs, Instant dernier) {}

    private final Map<String, Etat> etats = new ConcurrentHashMap<>();

    @EventListener
    public void echec(AuthenticationFailureBadCredentialsEvent e) {
        if (etats.size() > 10_000) etats.clear();
        etats.merge(cle(e.getAuthentication().getName()), new Etat(1, Instant.now()),
                (avant, nouveau) -> expire(avant) ? nouveau : new Etat(avant.echecs() + 1, nouveau.dernier()));
    }

    @EventListener
    public void succes(AuthenticationSuccessEvent e) {
        etats.remove(cle(e.getAuthentication().getName()));
    }

    public boolean bloque(String email) {
        Etat etat = email == null ? null : etats.get(cle(email));
        return etat != null && etat.echecs() >= MAX_ECHECS && !expire(etat);
    }

    static String cle(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static boolean expire(Etat etat) {
        return etat.dernier().plus(BLOCAGE).isBefore(Instant.now());
    }
}
