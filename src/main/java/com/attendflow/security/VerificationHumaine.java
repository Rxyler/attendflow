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

@ControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class VerificationHumaine extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(VerificationHumaine.class);
    private static final Set<String> FORMULAIRES = Set.of("/login", "/mot-de-passe-oublie");
    private static final String URL_CLOUDFLARE = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final String cleSite;
    private final String cleSecrete;
    private final RestClient client;

    public VerificationHumaine(@Value("${attendflow.turnstile.site-key:}") String cleSite,
                               @Value("${attendflow.turnstile.secret-key:}") String cleSecrete) {
        this.cleSite = System.getenv("RENDER") != null && cleSite.startsWith("1x0000") ? "" : cleSite;
        this.cleSecrete = cleSecrete;
        var fabrique = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        fabrique.setReadTimeout(Duration.ofSeconds(5));
        this.client = RestClient.builder().requestFactory(fabrique).build();
    }

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
