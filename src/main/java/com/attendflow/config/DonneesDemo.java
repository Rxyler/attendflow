package com.attendflow.config;

import com.attendflow.model.*;
import com.attendflow.repository.ClasseRepository;
import com.attendflow.repository.MatiereRepository;
import com.attendflow.repository.NotificationRepository;
import com.attendflow.repository.ParametreRepository;
import com.attendflow.repository.SeanceRepository;
import com.attendflow.repository.UtilisateurRepository;
import com.attendflow.service.SynchronisationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.attendflow.service.Textes.t;

@Component
public class DonneesDemo implements CommandLineRunner {

    private static final String MDP_DEMO = "1234";
    private static final String MDP_ADMIN_DEMO = "admin";

    @Value("${attendflow.demo.motdepasse:}")
    private String motDePasseDemo = "";

    private final UtilisateurRepository utilisateurs;
    private final ClasseRepository classes;
    private final MatiereRepository matieres;
    private final SeanceRepository seances;
    private final PasswordEncoder encoder;
    private final SynchronisationService synchronisation;
    private final ParametreRepository parametres;
    private final NotificationRepository notifications;

    public DonneesDemo(UtilisateurRepository utilisateurs, ClasseRepository classes, MatiereRepository matieres,
                       SeanceRepository seances, PasswordEncoder encoder, SynchronisationService synchronisation,
                       ParametreRepository parametres, NotificationRepository notifications) {
        this.parametres = parametres;
        this.notifications = notifications;
        this.utilisateurs = utilisateurs;
        this.classes = classes;
        this.matieres = matieres;
        this.seances = seances;
        this.encoder = encoder;
        this.synchronisation = synchronisation;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Matiere devWeb = matiere("Développement Web", "DEV-WEB", 3.0);
        Matiere java = matiere("Java", "JAVA", 3.0);
        Matiere bdd = matiere("Base de données", "BDD", 2.5);
        Matiere algo = matiere("Algorithmique", "ALGO", 2.0);
        Matiere res = matiere("Réseaux", "RES", 2.5);
        Matiere sys = matiere("Systèmes", "SYS", 2.0);

        Classe info3 = classe("3ème INFO", "Licence 3", "Ahmed Ben Salah");
        Classe info2 = classe("2ème INFO", "Licence 2", "Rami Gharbi");
        Classe info1 = classe("1ère INFO", "Licence 1", "Sara Mansouri");
        Classe res3 = classe("3ème RÉSEAUX", "Licence 3", "Rami Gharbi");

        if (!utilisateurs.existsByEmail("admin@univ.tn")) {
            utilisateurs.save(new Admin("Admin", "Admin", "admin@univ.tn", encoder.encode(mdp(MDP_ADMIN_DEMO))));
        }
        utilisateurs.findByEmail("admin@univ.tn").filter(u -> "Super".equals(u.getPrenom()))
                .ifPresent(u -> { u.setPrenom("Admin"); utilisateurs.save(u); });
        enseignant("Ben Salah", "Ahmed", "ahmed.bensalah@univ.tn", "Développement Web", devWeb, java);
        enseignant("Mansouri", "Sara", "sara.mansouri@univ.tn", "Bases de données", bdd, algo);
        enseignant("Gharbi", "Rami", "rami.gharbi@univ.tn", "Réseaux et systèmes", res, sys);

        renommerEtudiante();
        lierAnciennesNotifications();
        etudiant("Ferjani", "Lina", "20260001", info3);
        etudiant("Trabelsi", "Ahmed", "20260002", info3);
        etudiant("Ben Ali", "Mariem", "20260003", info3);
        etudiant("Jlassi", "Mohamed", "20260004", info3);
        etudiant("Saad", "Rim", "20260012", info3);
        etudiant("Karray", "Yasmine", "20260005", info2);
        etudiant("Ghorbel", "Sami", "20260006", info2);
        etudiant("Chaabane", "Karim", "20260007", info2);
        etudiant("Sfar", "Ines", "20260008", info1);
        etudiant("Hamdi", "Firas", "20260009", info1);
        etudiant("Zouari", "Nour", "20260010", res3);
        etudiant("Ben Amor", "Oussama", "20260011", res3);

        if (parametres.count() == 0) parametres.save(new Parametre());

        if (seances.count() == 0) synchronisation.synchroniser(null);
        remplacerMotsDePassePublics();
    }

    private Matiere matiere(String intitule, String code, double coefficient) {
        return matieres.findByCode(code).orElseGet(() -> matieres.save(new Matiere(intitule, code, coefficient)));
    }

    private Classe classe(String nom, String niveau, String responsable) {
        return classes.findByNom(nom).orElseGet(() -> classes.save(new Classe(nom, niveau, responsable, "2026-2027")));
    }

    private boolean motDePasseDemoDefini() {
        return motDePasseDemo != null && motDePasseDemo.length() >= 8;
    }

    private String mdp(String publicParDefaut) {
        return motDePasseDemoDefini() ? motDePasseDemo : publicParDefaut;
    }

    private void remplacerMotsDePassePublics() {
        if (motDePasseDemo != null && !motDePasseDemo.isEmpty() && !motDePasseDemoDefini()) {
            org.slf4j.LoggerFactory.getLogger(DonneesDemo.class).warn("DEMO_PASSWORD ignore : 8 caracteres minimum");
            return;
        }
        if (!motDePasseDemoDefini()) return;
        String nouveau = encoder.encode(motDePasseDemo);
        for (var u : utilisateurs.findAll()) {
            if (encoder.matches(MDP_DEMO, u.getMotDePasse()) || encoder.matches(MDP_ADMIN_DEMO, u.getMotDePasse())) {
                u.setMotDePasse(nouveau);
                utilisateurs.save(u);
            }
        }
    }

    private void enseignant(String nom, String prenom, String email, String specialite, Matiere... ses) {
        Enseignant e = utilisateurs.findByEmail(email)
                .map(Enseignant.class::cast)
                .orElseGet(() -> new Enseignant(nom, prenom, email, encoder.encode(mdp(MDP_DEMO)), specialite));
        if (e.getMatieres().isEmpty()) e.getMatieres().addAll(Set.of(ses));
        utilisateurs.save(e);
    }

    static final String ANCIEN_NOM = "Manar Nouira", ANCIEN_EMAIL = "manar.nouira@univ.tn";

    private void renommerEtudiante() {
        String ancien = ANCIEN_NOM, nouveau = "Lina Ferjani";
        utilisateurs.findByEmail(ANCIEN_EMAIL).ifPresent(u -> {
            u.setPrenom("Lina");
            u.setNom("Ferjani");
            u.setEmail("lina.ferjani@univ.tn");
            utilisateurs.save(u);
        });
        for (var n : notifications.findAll()) {
            if (n.getMessage() != null && n.getMessage().contains(ancien)) {
                n.setMessage(n.getMessage().replace(ancien, nouveau));
                notifications.save(n);
            }
        }
    }

    private void lierAnciennesNotifications() {
        Map<String, String> liens = Map.of(
                "Nouveau justificatif", "/admin/justificatifs",
                "Justificatif accepté", "/etudiant/justificatifs",
                "Justificatif refusé", "/etudiant/justificatifs",
                "Séance dans 15 minutes", "/enseignant",
                "Absences du jour", "/enseignant",
                "Séance changée dans le planning source", "/admin/synchronisation",
                "Seuil d'absence dépassé", "");
        for (var n : notifications.findAll()) {
            if (n.getLien() != null) continue;
            liens.forEach((fr, lien) -> {
                if (!fr.equals(n.getTitre()) && !t(Locale.ENGLISH, fr).equals(n.getTitre())) return;
                n.setLien(!lien.isEmpty() ? lien
                        : n.getDestinataire().getRole() == com.attendflow.model.enums.Role.ADMIN ? "/rapports" : "/etudiant/historique");
                notifications.save(n);
            });
        }
    }

    private void etudiant(String nom, String prenom, String matricule, Classe classe) {
        String email = (prenom + "." + nom.replace(" ", "")).toLowerCase() + "@univ.tn";
        if (utilisateurs.existsByEmail(email)) return;
        utilisateurs.save(new Etudiant(nom, prenom, email, encoder.encode(mdp(MDP_DEMO)), matricule, classe));
    }
}
