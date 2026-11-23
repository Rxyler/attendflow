package com.attendflow.security;

import com.attendflow.repository.UtilisateurRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UtilisateurDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;
    private final TentativesConnexion tentatives;

    public UtilisateurDetailsService(UtilisateurRepository utilisateurRepository, TentativesConnexion tentatives) {
        this.utilisateurRepository = utilisateurRepository;
        this.tentatives = tentatives;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return utilisateurRepository.findByEmail(TentativesConnexion.cle(email))
                .map(u -> User.withUsername(u.getEmail())
                        .password(u.getMotDePasse())
                        .roles(u.getRole().name())
                        .accountLocked(tentatives.bloque(email))
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Aucun compte pour " + email));
    }
}
