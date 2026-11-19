<p align="center">
  <img src="src/main/resources/static/images/logo.jpg" alt="Fas3a logo" width="120">
</p>

<h1 align="center">Fas3a</h1>

<p align="center">
  Attendance management for universities: take attendance per class session, handle absence excuses,
  send alerts and export reports.
  <br>
  <a href="https://attendflow-bwr9.onrender.com"><strong>Live demo</strong></a>
</p>

<p align="center">
  <img alt="Java 25" src="https://img.shields.io/badge/Java-25-orange">
  <img alt="Spring Boot 4.1" src="https://img.shields.io/badge/Spring%20Boot-4.1-6db33f">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-blue">
  <img alt="Tests" src="https://img.shields.io/badge/tests-76%20passing-brightgreen">
</p>

> The live demo runs on a free plan: the first visit after a period of inactivity can take 1 to 2 minutes to wake up.
> The interface is in French and English: use the FR / EN button next to the theme switch.

## Features

| Area | What it does |
|---|---|
| **Authentication** | Role-based login (admin, teacher, student), one-time password reset links (30 min), lockout after 5 failed attempts |
| **Timetable** | Daily or on-demand sync with the partner timetable system, sync log, changed and cancelled sessions, weekly view per role |
| **Attendance** | Per-session sheet, "everyone present" shortcut, search, edit window, no entry before the session starts, change history, cancelled sessions locked |
| **Absence excuses** | Students upload a PDF or image (5 MB max, content checked), admins approve or reject |
| **Alerts** | Reminder before each session, daily summary, alert when a student crosses the absence threshold (in-app and by email) |
| **Dashboards** | Admin, teacher and student views; attendance rate and at-risk students |
| **Records** | Manage students (photo, Excel / CSV import, search), classes, subjects and teachers |
| **Reports** | Filters, 4 charts, PDF and Excel exports that match the screen |
| **Settings** | Alert thresholds, edit window, attendance-rate rules |

Students also get a light game layer: a 3D companion that replaces their initials, levels, points, streaks,
badges and a weekly challenge, all computed from their attendance (nothing extra is stored).

## Tech stack

- **Backend:** Java 25, Spring Boot 4.1 (MVC, Security, Data JPA / Hibernate)
- **Frontend:** Thymeleaf, Bootstrap 5.3, Chart.js, GSAP, Lenis
- **Database:** PostgreSQL (H2 in memory for tests)
- **Exports and import:** Apache POI (Excel), OpenPDF (PDF)
- **Build and deploy:** Maven wrapper, Docker, Render + Neon

## Getting started

**Requirements:** JDK 25 and a PostgreSQL server.

1. Create an empty database named `attendflow`. Tables are created on startup.
2. Set the environment variable `DB_PASSWORD` (and `DB_USERNAME` if it is not `postgres`).
3. Run the app:
   ```bash
   ./mvnw spring-boot:run
   ```
4. Open http://localhost:8081

On first start the app fills in demo data: 6 subjects, 4 classes, 3 teachers and 12 students.

### Demo accounts

| Role | Email |
|---|---|
| Admin | `admin@univ.tn` |
| Teachers | `ahmed.bensalah@univ.tn`, `sara.mansouri@univ.tn`, `rami.gharbi@univ.tn` |
| Students | `firstname.lastname@univ.tn` (e.g. `manar.nouira@univ.tn`) |

Demo passwords are in [`DonneesDemo.java`](src/main/java/com/attendflow/config/DonneesDemo.java).
Accounts created from the interface get a random password; the user sets their own through "Mot de passe oublié".

### Emails

In development, run [Mailpit](https://mailpit.axllent.org) to catch every email locally (inbox at http://localhost:8025):

```bash
mailpit --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025
```

In production, set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_AUTH`, `MAIL_STARTTLS`,
`MAIL_FROM` and `APP_URL` (the public address used in email links).

## Tests

```bash
./mvnw test
```

79 tests run against an in-memory H2 database, with no setup. They cover security, timetable sync, attendance,
dashboards, notifications, emails, excuses, records, reports and exports, and settings.
`SecuriteEntreesTest` focuses on hostile input: SQL injection, XSS, missing CSRF tokens, oversized or invalid values,
brute-force lockout, and error pages that leak no technical details.
`LangueTest` checks the French default, the switch to English and that every French text has an English version.

## Deployment

The repository includes a `Dockerfile`. The live demo runs on Render (Docker, free plan) with a Neon PostgreSQL database.
Environment variables:

| Variable | Value |
|---|---|
| `DB_URL` | `jdbc:postgresql://<host>/<database>?sslmode=require` |
| `DB_USERNAME`, `DB_PASSWORD` | Database credentials |
| `APP_URL` | Public address of the app |
| `SHOW_SQL` | `false` |

Every push to `main` redeploys automatically.

## Project structure

```
src/main/java/com/attendflow/
  model/         JPA entities and enums
  repository/    Spring Data repositories
  service/       business interfaces, implementations in service/impl/
  integration/   partner timetable contract and its simulation
  security/      Spring Security configuration, login lockout
  web/           MVC controllers (web/admin/ for administration)
  config/        demo data
src/main/resources/
  templates/     Thymeleaf pages
  static/        CSS, JavaScript, images
docs/            class diagram (PlantUML) and design mockups
```

## Known limitations

- The partner timetable is simulated (`EmploiDuTempsMock`); plug in the real API by implementing `EmploiDuTempsProvider`.
- CSV import does not handle quoted fields containing the separator (use Excel instead).
- Uploaded files are checked by type and content, not scanned by an antivirus.
- The login lockout counter is kept in memory and resets when the app restarts.
- On the free hosting plan, uploaded files are erased on each restart and outgoing email is blocked.
