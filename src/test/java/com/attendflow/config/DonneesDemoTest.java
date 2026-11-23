package com.attendflow.config;

import com.attendflow.model.Notification;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.NotificationRepository;
import com.attendflow.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class DonneesDemoTest {

    @Autowired DonneesDemo donneesDemo;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired NotificationRepository notifications;

    @Test
    void renommeLAncienneEtudianteEtSesMentions() {
        var lina = utilisateurs.findByEmail("lina.ferjani@univ.tn").orElseThrow();
        Long id = lina.getId();
        lina.setEmail(DonneesDemo.ANCIEN_EMAIL);
        lina.setPrenom("X");
        utilisateurs.save(lina);
        var admin = utilisateurs.findByEmail("admin@univ.tn").orElseThrow();
        var n = notifications.save(new Notification(admin, TypeNotification.INFORMATION, "Alerte",
                DonneesDemo.ANCIEN_NOM + " a déposé un justificatif."));

        donneesDemo.run();

        var renommee = utilisateurs.findByEmail("lina.ferjani@univ.tn").orElseThrow();
        assertThat(renommee.getId()).isEqualTo(id);
        assertThat(renommee.getNomComplet()).isEqualTo("Lina Ferjani");
        assertThat(utilisateurs.existsByEmail(DonneesDemo.ANCIEN_EMAIL)).isFalse();
        assertThat(notifications.findById(n.getId()).orElseThrow().getMessage()).isEqualTo("Lina Ferjani a déposé un justificatif.");
    }
}
