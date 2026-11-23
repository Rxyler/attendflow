package com.attendflow.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
public class SecurityConfig {

    static final String CDN = "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com";
    static final String CSP = "default-src 'self'; "
            + "script-src 'self' 'unsafe-inline' " + CDN + " https://challenges.cloudflare.com; "
            + "frame-src https://challenges.cloudflare.com; "
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
                        .failureHandler((req, rep, ex) -> rep.sendRedirect(req.getContextPath()
                                + (tentatives.bloque(req.getParameter("email")) ? "/login?bloque" : "/login?erreur")))
                        .permitAll())
                .logout(logout -> logout
                        .logoutSuccessUrl("/login?deconnexion")
                        .permitAll())
                .headers(h -> h
                        .contentSecurityPolicy(csp -> csp.policyDirectives(CSP))
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicyHeader(pp -> pp.policy("camera=(), microphone=(), geolocation=()")));
        return http.build();
    }
}
