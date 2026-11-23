package com.attendflow.repository;

import com.attendflow.model.Notification;
import com.attendflow.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByDestinataireOrderByDateDesc(Utilisateur destinataire);

    long countByDestinataireAndLueFalse(Utilisateur destinataire);

    List<Notification> findByDestinataireAndLueFalse(Utilisateur destinataire);

    Optional<Notification> findByIdAndDestinataire(Long id, Utilisateur destinataire);

    void deleteByDestinataire(Utilisateur destinataire);
}
