package com.attendflow.model;

import com.attendflow.model.enums.Role;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "admin")
@NoArgsConstructor
public class Admin extends Utilisateur {

    public Admin(String nom, String prenom, String email, String motDePasse) {
        super(nom, prenom, email, motDePasse, Role.ADMIN);
    }
}
