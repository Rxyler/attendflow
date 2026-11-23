package com.attendflow.service.impl;

import com.attendflow.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String expediteur;

    public EmailServiceImpl(JavaMailSender mailSender, @Value("${attendflow.mail.from:Fas3a <no-reply@fas3a.local>}") String expediteur) {
        this.mailSender = mailSender;
        this.expediteur = expediteur;
    }

    @Async
    @Override
    public void envoyer(String destinataire, String sujet, String texte) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(expediteur);
        message.setTo(destinataire);
        message.setSubject(sujet);
        message.setText(texte);
        try {
            mailSender.send(message);
            log.info("Email envoye a {} : {}", destinataire, sujet);
        } catch (MailException e) {
            log.warn("Email NON envoye a {} ({}) - sujet : {}\n{}", destinataire, e.getMessage(), sujet, texte);
        }
    }
}
