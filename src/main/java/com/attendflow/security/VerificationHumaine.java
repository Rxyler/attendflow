package com.attendflow.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

/**
 * "Etes-vous un humain ?" (Cloudflare Turnstile) sur les formulaires publics : connexion et mot de passe oublie.
 * Le navigateur recoit un jeton du widget ; on le fait valider par Cloudflare avant que Spring Security ne lise le mot de passe.
 * En local, sans cles : cles de test de Cloudflare (widget visible). Tests : cles vides, verification desactivee.
 */
@ControllerAdvice   // aussi un @Component : filtre + cle du widget donnee aux pages
@Order(Ordered.HIGHEST_PRECEDENCE + 1)   // juste apres LimiteRequetes, avant la chaine Spring Security
public class VerificationHumaine extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(VerificationHumaine.class);
    private static final Set<String> FORMULAIRES = Set.of("/login", "/mot-de-passe-oublie");
    private static final String URL_CLOUDFLARE = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final String cleSite;
    private final String cleSecrete;
    private final RestClient client;

    public VerificationHumaine(@Value("${attendflow.turnstile.site-key:}") String cleSite,
                               @Value("${attendflow.turnstile.secret-key:}") String cleSecrete) {
        // Les cles de test (par defaut, voir application.properties) acceptent tout : jamais en ligne (Render definit RENDER).
        this.cleSite = System.getenv("RENDER") != null && cleSite.startsWith("1x0000") ? "" : cleSite;
        this.cleSecrete = cleSecrete;
        var fabrique = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        fabrique.setReadTimeout(Duration.ofSeconds(5));
        this.client = RestClient.builder().requestFactory(fabrique).build();
    }

    /** Cle publique du widget pour les pages (fragments/layout :: humain) ; null = pas de widget. */
    @ModelAttribute("cleTurnstile")
    public String cleTurnstile() {
        return isActive() ? cleSite : null;
    }

    public boolean isActive() {
        return !cleSite.isBlank() && !cleSecrete.isBlank();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !isActive() || !"POST".equals(req.getMethod())
                || !FORMULAIRES.contains(req.getRequestURI().substring(req.getContextPath().length()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse rep, FilterChain chaine)
            throws ServletException, IOException {
        if (valide(req.getParameter("cf-turnstile-response"), LimiteRequetes.visiteur(req))) {
            chaine.doFilter(req, rep);
        } else {
            rep.sendRedirect(req.getRequestURI() + "?robot");
        }
    }

    /** Refuse aussi si Cloudflare ne repond pas : un robot ne doit pas passer pendant une panne. */
    boolean valide(String jeton, String ip) {
        if (jeton == null || jeton.isBlank() || jeton.length() > 2048) return false;
        var formulaire = new LinkedMultiValueMap<String, String>();
        formulaire.add("secret", cleSecrete);
        formulaire.add("response", jeton);
        formulaire.add("remoteip", ip);
        try {
            Map<?, ?> reponse = client.post().uri(URL_CLOUDFLARE).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formulaire).retrieve().body(Map.class);
            return reponse != null && Boolean.TRUE.equals(reponse.get("success"));
        } catch (RuntimeException e) {
            LOG.warn("Verification Turnstile impossible : {}", e.getMessage());
            return false;
        }
    }
}
