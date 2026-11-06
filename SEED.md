# JobRadar: Decision Seed & Implementation Plan

IT — Scopo: Annunci e fasi delle candidature sono sparsi tra siti e file. Soluzione completata: Tracker deterministico locale con import manuale e parser di annunci, stato candidatura, CV usato, skill gap, diff e promemoria.

EN — Purpose: Job postings and application stages are scattered across sites and files. Completed solution: Deterministic local tracker with manual URL/file import, application status, CV revision, skill gap, diff and reminders.

## Stato del Piano di Sviluppo / Implementation Status (v1.0.0 Stable GA)

- [x] **Nome e Confini Conclusi**: `JobRadar` confermato come single source of truth per il tracking delle offerte e delle fasi di selezione.
- [x] **Regola di Verificabilità Salariale**: Divieto assoluto di stime arbitrarie; ogni importo richiede fonte verificabile (`salary.source`).
- [x] **Parser Locale Offline**: Estrazione sicura da testo e OpenGraph HTML di azienda, ruolo, workplace, stipendio verificato e skill.
- [x] **Reverse Match & Target Audit**: Valutazione di aderenza rispetto a criteri minimi (RAL, modalità remota, blacklist).
- [x] **Job Git Diff**: Rilevamento delle modifiche apportate dai datori di lavoro alle descrizioni dei requisiti e della retribuzione.
- [x] **Kanban Board da Terminale**: Visualizzazione a colonne per stadi di avanzamento.
- [x] **Integrazione CV / CareerVault**: Match oggettivo delle competenze con il profilo `career.json`.
- [x] **Esportatori Multipli**: HTML standalone, RFC 5545 iCalendar (`.ics`), Markdown e CSV bidirezionale.
- [x] **Suite di Test Deterministica**: 25 test con `node:test` (100% passati).
- [x] **Licenza & Governance**: Apache-2.0, NOTICE file, DCO (`git commit -s`), donazioni (.github/FUNDING.yml).
- [x] **Guardia Architetturale**: Core sotto le 1.500 righe e zero dipendenze runtime di terze parti.

## Roadmap Estensioni Future / Future Roadmap (v1.1+)

- Supporto a formati JSON Schema aggiuntivi per ATS open standard.
- Hook opzionale per sincronizzazione git locale automatica (`jobradar sync`).
- Preset configurabili per accordi salariali territoriali o settoriali (CCNL / bandi pubblici).
