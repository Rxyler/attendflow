package com.attendflow.model;

import com.attendflow.model.enums.TypeNotification;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeNotification type;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private boolean lue = false;

    @Column(name = "date_notification", nullable = false)
    private LocalDateTime date;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur destinataire;

    @Column(length = 200)
    private String lien;

    public Notification(Utilisateur destinataire, TypeNotification type, String titre, String message) {
        this.destinataire = destinataire;
        this.type = type;
        this.titre = titre;
        this.message = message;
        this.date = LocalDateTime.now();
    }

    public Notification(Utilisateur destinataire, TypeNotification type, String titre, String message, String lien) {
        this(destinataire, type, titre, message);
        this.lien = lien;
    }
}
