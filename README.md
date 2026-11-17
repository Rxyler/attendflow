# AttendFlow

Plateforme web de gestion des absences : prise de présence par séance, justificatifs, alertes,
tableaux de bord et rapports exportables. Les séances proviennent de l'emploi du temps d'un projet partenaire.

## Stack

| | |
|---|---|
| Langage | Java 25 |
| Framework | Spring Boot 4.1 (Spring MVC, Spring Security, Spring Data JPA / Hibernate) |
| Vues | Thymeleaf + Bootstrap 5.3, graphiques Chart.js |
| Base de données | PostgreSQL (H2 en mémoire pour les tests) |
| Exports / import | Apache POI (Excel), OpenPDF (PDF) |
| Build | Maven (wrapper fourni, Maven 3.9.11) |
| Divers | Lombok |

## Lancer le projet

1. **PostgreSQL** : créer une base vide `attendflow` (les tables sont créées au démarrage, `ddl-auto=update`).
2. **Variable d'environnement** `DB_PASSWORD` = mot de passe de l'utilisateur PostgreSQL
   (et `DB_USERNAME` si ce n'est pas `postgres`). Dans IntelliJ : *Run > Edit Configurations > Environment variables*.
   Le mot de passe n'est jamais écrit dans le code.
3. **Emails** : lancer Mailpit (voir *Emails* ci-dessous).
4. Lancer `AttendFlowApplication` (ou `./mvnw spring-boot:run`).
5. Ouvrir **http://localhost:8081** (port 8081 car 8080 est souvent pris par Oracle).

Au premier démarrage, `config/DonneesDemo` crée les données de démonstration : 6 matières, 4 classes,
3 enseignants, 12 étudiants, les paramètres par défaut, puis synchronise l'emploi du temps simulé.

### Comptes de démonstration

| Rôle | Email |
|---|---|
| Administrateur | `admin@univ.tn` |
| Enseignants | `ahmed.bensalah@univ.tn`, `sara.mansouri@univ.tn`, `rami.gharbi@univ.tn` |
| Étudiants | `prenom.nom@univ.tn` (ex. `manar.nouira@univ.tn`) |

Les mots de passe de démonstration sont dans `src/main/java/com/attendflow/config/DonneesDemo.java`.
Les comptes créés depuis l'interface reçoivent un mot de passe aléatoire : l'utilisateur choisit le sien
via « Mot de passe oublié » (le lien arrive par email).

## Emails

L'application envoie par email le lien de réinitialisation du mot de passe et une copie de chaque notification
(alerte de seuil, rappel avant séance, résumé du jour, décision sur un justificatif, séance modifiée).
Les envois se font en arrière-plan, après l'enregistrement en base : un serveur mail lent ou arrêté ne bloque
jamais une page, et l'email non envoyé est alors écrit dans la console.

**En développement : Mailpit** (les adresses de démonstration `@univ.tn` ne doivent pas recevoir de vrais emails).
Mailpit attrape tous les emails, quelle que soit l'adresse, et rien ne sort du PC.

```bash
winget install axllent.mailpit
mailpit --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025
```

Boîte de réception : **http://localhost:8025**. Aucune configuration dans l'application (valeurs par défaut).

**En production : Gmail** (ou tout serveur SMTP). Créer un *mot de passe d'application* Google
(compte Google > Sécurité > Validation en deux étapes > Mots de passe des applications), puis définir
ces variables d'environnement dans la configuration de lancement :

| Variable | Valeur |
|---|---|
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | votre adresse Gmail |
| `MAIL_PASSWORD` | le mot de passe d'application (16 lettres) |
| `MAIL_AUTH` / `MAIL_STARTTLS` | `true` / `true` |
| `MAIL_FROM` | votre adresse Gmail |
| `APP_URL` | l'adresse publique de l'application (liens dans les emails) |

Avec Gmail, utiliser des comptes dont l'adresse email est réelle et vous appartient.

## Tests

```bash
./mvnw test
```

61 tests (base H2 en mémoire, aucune configuration requise) : sécurité, synchronisation, prise de présence,
tableaux de bord, notifications, emails, justificatifs, référentiel, rapports et exports, paramètres.

## Fonctionnalités (cahier des charges)

| Domaine | Fonctions |
|---|---|
| Authentification | Connexion par rôle, réinitialisation du mot de passe par lien à usage unique (30 min), session 30 min |
| Emploi du temps | Synchronisation quotidienne ou à la demande avec le partenaire (F-12), journal, séances modifiées / annulées, vue semaine par rôle |
| Présences | Feuille par séance (RG-02, RG-03), « Tous présents », recherche, délai de modification (F-22), pas de saisie avant le début (F-23), historique des modifications (RG-08), séance annulée verrouillée (RG-10) |
| Justificatifs | Dépôt par l'étudiant (PDF / image, 5 Mo max, contenu vérifié), validation ou refus par l'administrateur |
| Alertes | Rappel avant séance (F-32), résumé quotidien (F-33), alerte de dépassement du seuil (F-34) |
| Tableaux de bord | Admin, enseignant, étudiant ; taux de présence (RG-04) et étudiants à risque (RG-05) |
| Référentiel | CRUD étudiants (photo, import Excel / CSV F-09, recherche F-10), classes, matières, enseignants |
| Rapports | Filtres (F-29), 4 graphiques (F-30), export PDF et Excel identiques à l'écran (F-31) |
| Paramètres | Seuils d'alerte, délai de modification, règles de calcul du taux |

## Compagnons et côté ludique

- **Mon profil** (`/profil`) : chaque utilisateur choisit un compagnon 3D (Plume, Tic, Pousse, Bulle, Filou, Comète) qui remplace ses initiales. Images générées avec Figma AI, paupières animées en SVG (clignement).
- **Tableau de bord étudiant** : niveau et titre, points (présent 10, retard 5, justifié 2), série et record, six badges, défi de la semaine, calendrier des 12 dernières semaines. Rien n’est stocké : tout est recalculé depuis les présences.
- Le compagnon réagit au clic, porte une aura selon le niveau (couronne au niveau 5) ; confettis à chaque nouveau badge ou niveau et sur « Tous présents ».
- Secret : ↑ ↑ ↓ ↓ ← → ← → B A.

## Organisation du code

```
src/main/java/com/attendflow/
  model/          entités JPA (héritage JOINED Utilisateur -> Admin / Enseignant / Etudiant) et enums
  repository/     interfaces Spring Data
  service/        interfaces métier ; service/impl/ leurs implémentations
  integration/    contrat avec le projet partenaire (EmploiDuTempsProvider) et sa simulation (EmploiDuTempsMock)
  security/       configuration Spring Security, chargement des comptes
  web/            contrôleurs MVC (web/admin/ pour l'administration)
  config/         données de démonstration
src/main/resources/
  templates/      pages Thymeleaf (fragments/layout.html : en-tête, menu, cartes)
  static/css/     thème AttendFlow
docs/diagramme-classes.puml   diagramme de classes (PlantUML, importable dans draw.io)
```

## Configuration utile (`application.properties`)

| Propriété | Défaut | Rôle |
|---|---|---|
| `server.port` | 8081 | Port HTTP |
| `attendflow.uploads.dir` | `uploads/justificatifs` | Fichiers des justificatifs |
| `attendflow.uploads.photos` | `uploads/photos` | Photos des étudiants |
| `attendflow.synchro.cron` | jours ouvrés 7h | Synchronisation automatique (`-` pour désactiver) |
| `attendflow.rappels.cron` | toutes les 5 min | Rappels avant séance |
| `attendflow.resume.cron` | jours ouvrés 18h | Résumé quotidien |

Les seuils et délais métier se règlent dans l'application : **Administration > Paramètres**.

## Limites connues

- L'emploi du temps partenaire est simulé (`EmploiDuTempsMock`) ; brancher la vraie API en implémentant `EmploiDuTempsProvider`.
- Import CSV : les champs entre guillemets contenant le séparateur ne sont pas gérés (utiliser l'Excel).
- Une séance supprimée (et non annulée) chez le partenaire n'est pas détectée.
- Les rappels avant séance sont envoyés aux enseignants uniquement.
- Les justificatifs ne passent pas par un antivirus (extension et contenu vérifiés seulement).
- Le calcul des étudiants à risque charge les présences en mémoire (suffisant pour un établissement).
