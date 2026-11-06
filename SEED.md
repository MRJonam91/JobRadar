# JobRadar: decision seed / punto di partenza

IT — Scopo: Annunci e fasi delle candidature sono sparsi tra siti e file. Prima prova: Tracker locale con import manuale di URL, stato candidatura, CV usato e promemoria.

EN — Purpose: Job postings and application stages are scattered across sites and files. First trial: Local tracker with manual URL import, application status, CV version and reminders.

## Decisioni prese / Decisions made (MVP v1.0.0)

- **Pilot & Scope**: Confermato nome `JobRadar`. Scope circoscritto al tracking deterministico locale di annunci, pipeline candidature (`discovered` ➔ `applied` ➔ `screening` ➔ `interviewing` ➔ `offer_received` ➔ `accepted`/`rejected`/`withdrawn`/`ghosted`), monitoraggio versioni CV e motore di promemoria follow-up / scadenze interviste.
- **Relazione con altri progetti**: Integrabile con `CareerVault` (per il riferimento a ID e revisioni del CV da `career.json`).
- **Verificabilità & Confini**: Vietate candidature automatiche; le stime o indicazioni di compenso richiedono obbligatoriamente fonte verificabile (`salary.source`), implementata con validazione rigorosa in `src/core/validator.ts`.
- **Licenza & Standard**: Applicati standard MRJonam91 (`../_repo-kit/REPO-STANDARDS.md`): Licenza Apache-2.0, NOTICE file, LICENSING.md bilingue, DCO (`git commit -s`), donazioni in `.github/FUNDING.yml`, CI con guard check core < 1500 LOC, test deterministici con `node:test`, esportatori Markdown, iCalendar (.ics) e CSV.
