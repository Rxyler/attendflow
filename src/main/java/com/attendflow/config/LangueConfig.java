package com.attendflow.config;

import com.attendflow.model.Utilisateur;
import com.attendflow.repository.UtilisateurRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.CookieLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

import java.security.Principal;
import java.time.Duration;
import java.util.Locale;

@Configuration
public class LangueConfig implements WebMvcConfigurer {

    private final UtilisateurRepository utilisateurs;

    public LangueConfig(UtilisateurRepository utilisateurs) {
        this.utilisateurs = utilisateurs;
        org.springframework.context.i18n.LocaleContextHolder.setDefaultLocale(Locale.FRENCH);
    }

    public static Locale supportee(Locale l) {
        return l != null && "en".equals(l.getLanguage()) ? Locale.ENGLISH : Locale.FRENCH;
    }

    public static Locale de(Utilisateur u) {
        return u != null && "en".equals(u.getLangue()) ? Locale.ENGLISH : Locale.FRENCH;
    }

    @Bean
    public LocaleResolver localeResolver() {
        CookieLocaleResolver r = new CookieLocaleResolver("af-langue") {
            @Override
            public void setLocale(HttpServletRequest req, HttpServletResponse res, Locale l) {
                super.setLocale(req, res, l == null ? null : supportee(l));
            }
        };
        r.setCookieMaxAge(Duration.ofDays(365));
        r.setDefaultLocaleFunction(req -> {
            Principal p = req.getUserPrincipal();
            return p == null ? Locale.FRENCH : utilisateurs.findByEmail(p.getName()).map(LangueConfig::de).orElse(Locale.FRENCH);
        });
        return r;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        LocaleChangeInterceptor changement = new LocaleChangeInterceptor();
        changement.setParamName("lang");
        changement.setIgnoreInvalidLocale(true);
        registry.addInterceptor(changement);
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
                String lang = req.getParameter("lang");
                Principal p = req.getUserPrincipal();
                if (lang != null && p != null) {
                    String code = supportee(Locale.forLanguageTag(lang)).getLanguage();
                    utilisateurs.findByEmail(p.getName()).filter(u -> !code.equals(u.getLangue())).ifPresent(u -> {
                        u.setLangue(code);
                        utilisateurs.save(u);
                    });
                }
                return true;
            }
        });
    }
}
