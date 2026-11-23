package com.attendflow.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * F-01 connexion email + mot de passe, F-03 redirection selon le role,
 * F-04 deconnexion (l'expiration de session est dans application.properties).
 */
@Configuration
public class SecurityConfig {

    static final String CDN = "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com";
    static final String CSP = "default-src 'self'; "
            + "script-src 'self' 'unsafe-inline' " + CDN + " https://challenges.cloudflare.com; "
            + "frame-src https://challenges.cloudflare.com; "   // le widget "Etes-vous un humain ?" (VerificationHumaine)
            + "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com " + CDN + "; "
            + "font-src 'self' https://fonts.gstatic.com; "
            + "img-src 'self' data: blob:; "
            + "connect-src 'self'; "
            + "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, TentativesConnexion tentatives) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login", "/mot-de-passe-oublie", "/reinitialiser",
                                "/css/**", "/js/**", "/images/**", "/error").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/enseignant/**").hasRole("ENSEIGNANT")
                        .requestMatchers("/etudiant/**").hasRole("ETUDIANT")
                        .requestMatchers("/seances/**", "/rapports/**").hasAnyRole("ADMIN", "ENSEIGNANT")
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/login")
                        .usernameParameter("email")
                        .passwordParameter("motDePasse")
                        .defaultSuccessUrl("/", true)
                        // Meme message pour un compte bloque, existant ou non : on ne revele pas les comptes.
                        .failureHandler((req, rep, ex) -> rep.sendRedirect(req.getContextPath()
                                + (tentatives.bloque(req.getParameter("email")) ? "/login?bloque" : "/login?erreur")))
                        .permitAll())
                .logout(logout -> logout
                        .logoutSuccessUrl("/login?deconnexion")
                        .permitAll())
                // Le navigateur ne charge que nos fichiers et ceux des 3 CDN utilises ; rien ne part vers un autre site.
                // shortcut: 'unsafe-inline' reste necessaire (petits scripts en ligne des pages) ; passer a des nonces
                // si la page doit resister seule a une injection de script.
                .headers(h -> h
                        .contentSecurityPolicy(csp -> csp.policyDirectives(CSP))
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicyHeader(pp -> pp.policy("camera=(), microphone=(), geolocation=()")));
        return http.build();
    }
}
