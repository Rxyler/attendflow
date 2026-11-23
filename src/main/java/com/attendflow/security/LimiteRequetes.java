package com.attendflow.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LimiteRequetes extends OncePerRequestFilter {

    private static final long MINUTE_MS = 60_000;

    private record Fenetre(long debut, int nombre) {}

    private final Map<String, Fenetre> fenetres = new ConcurrentHashMap<>();
    private final int maxParMinute;

    public LimiteRequetes(@Value("${attendflow.limite.requetes-par-minute:300}") int maxParMinute) {
        this.maxParMinute = maxParMinute;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String uri = req.getRequestURI();
        return maxParMinute <= 0 || uri.startsWith("/css/") || uri.startsWith("/js/") || uri.startsWith("/images/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse rep, FilterChain chaine)
            throws ServletException, IOException {
        if (fenetres.size() > 50_000) fenetres.clear();
        long maintenant = System.currentTimeMillis();
        Fenetre f = fenetres.compute(visiteur(req), (k, v) ->
                v == null || maintenant - v.debut() >= MINUTE_MS ? new Fenetre(maintenant, 1) : new Fenetre(v.debut(), v.nombre() + 1));
        if (f.nombre() > maxParMinute) {
            long attente = Math.max(1, (f.debut() + MINUTE_MS - maintenant) / 1000);
            rep.setStatus(429);
            rep.setHeader("Retry-After", String.valueOf(attente));
            rep.setContentType("text/plain;charset=UTF-8");
            rep.getWriter().write("Trop de requêtes : réessayez dans " + attente + " s. / Too many requests: try again in " + attente + " s.");
            return;
        }
        chaine.doFilter(req, rep);
    }

    static String visiteur(HttpServletRequest req) {
        String cf = req.getHeader("CF-Connecting-IP");
        return cf != null && !cf.isBlank() ? cf.trim() : req.getRemoteAddr();
    }
}
