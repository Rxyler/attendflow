package com.attendflow.model.enums;

/** Compagnon choisi comme photo de profil ; l'image est dans static/images/mascottes. */
public enum Mascotte {
    PLUME("Plume", "Veille sur ton assiduité, même la nuit."),
    TIC("Tic", "Toujours à l’heure, jamais une minute de trop."),
    POUSSE("Pousse", "Grandit un peu à chaque cours."),
    BULLE("Bulle", "Flotte tranquillement entre deux séances."),
    FILOU("Filou", "Rusé, mais jamais en retard."),
    COMETE("Comète", "File d’une salle à l’autre.");

    private final String nom;
    private final String phrase;

    Mascotte(String nom, String phrase) {
        this.nom = nom;
        this.phrase = phrase;
    }

    public String getNom() { return nom; }

    public String getPhrase() { return phrase; }

    public String getImage() { return "/images/mascottes/" + name().toLowerCase() + ".svg"; }
}
