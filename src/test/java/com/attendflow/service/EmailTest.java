package com.attendflow.service;

import com.attendflow.model.Notification;
import com.attendflow.model.Utilisateur;
import com.attendflow.model.enums.TypeNotification;
import com.attendflow.repository.NotificationRepository;
import com.attendflow.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;

/** Pas @Transactional : les emails partent apres le commit, il faut de vrais commits. */
@SpringBootTest
@AutoConfigureMockMvc
class EmailTest {

    @MockitoBean JavaMailSender mailSender;
    @Autowired MockMvc mvc;
    @Autowired NotificationService notificationService;
    @Autowired NotificationRepository notifications;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired TransactionTemplate transaction;

    SimpleMailMessage envoye() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, timeout(3000)).send(captor.capture());
        return captor.getValue();
    }

    @Test
    void lienDeReinitialisationParEmail() throws Exception {
        mvc.perform(post("/mot-de-passe-oublie").with(csrf()).param("email", "sara.mansouri@univ.tn"))
                .andExpect(redirectedUrl("/mot-de-passe-oublie?envoye"));
        SimpleMailMessage m = envoye();
        assertThat(m.getTo()).containsExactly("sara.mansouri@univ.tn");
        assertThat(m.getText()).contains("/reinitialiser?token=");
    }

    @Test
    void emailInconnuNEnvoieRien() throws Exception {
        mvc.perform(post("/mot-de-passe-oublie").with(csrf()).param("email", "personne@nulle-part.tn"));
        verify(mailSender, after(500).never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void notificationCopieeParEmail() {
        Utilisateur rami = utilisateurs.findByEmail("rami.gharbi@univ.tn").orElseThrow();
        Notification n = transaction.execute(t -> notificationService.notifier(
                new Notification(rami, TypeNotification.AVERTISSEMENT, "Test email", "Contenu du test.")));
        try {
            SimpleMailMessage m = envoye();
            assertThat(m.getTo()).containsExactly("rami.gharbi@univ.tn");
            assertThat(m.getSubject()).isEqualTo("Fas3a - Test email");
            assertThat(m.getText()).contains("Contenu du test.", "/notifications");
        } finally {
            notifications.deleteById(n.getId());
        }
    }

    @Test
    void pasDEmailSiLaTransactionEstAnnulee() {
        Utilisateur rami = utilisateurs.findByEmail("rami.gharbi@univ.tn").orElseThrow();
        transaction.executeWithoutResult(t -> {
            notificationService.notifier(new Notification(rami, TypeNotification.INFORMATION, "Annulee", "x"));
            t.setRollbackOnly();
        });
        verify(mailSender, after(500).never()).send(any(SimpleMailMessage.class));
    }
}
