# Changelog — JobRadar

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e aderisce a [Semantic Versioning](https://semver.org/).

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-06 — Official Stable Release (GA)

### Added
- **Core Ledger & Schema (`jobradar.json`)**:
  - Deterministic, local-first JSON ledger for job applications and interview lifecycles.
  - Strict state machine: `discovered` ➔ `applied` ➔ `screening` ➔ `interviewing` ➔ `offer_received` ➔ `accepted` / `rejected` / `withdrawn` / `ghosted`.
  - CV version tracking integrated with localized résumé profiles.
- **Integrity, Verifiability & Temporal Rules**:
  - Requires explicit, verifiable sources (`job_posting`, `recruiter_email`, `offer_letter`) for all salary figures; forbids unsubstantiated guesswork.
  - Prevents chronological inversions (`appliedAt < discoveredAt`).
  - Detects duplicate application IDs.
- **Posting Parser & Auto-Ingestion (`jobradar parse` / `jobradar add --from-file`)**:
  - Parses job postings from plain text and HTML OpenGraph metadata.
  - Automatically detects role, company, workplace mode (`remote`, `hybrid`, `onsite`), verifiable compensation, and technology tags.
  - Preserves an exact raw snapshot (`rawPosting`) for auditability.
- **Reverse Job Search & Target Criteria Audit (`jobradar audit`)**:
  - Audits postings against personal target criteria (`minSalary`, `preferredWorkplace`, `targetRoles`, `blacklistedCompanies`).
  - Highlights alignment or discrepancies without subjective scoring.
- **Job Git Diff (`jobradar diff`)**:
  - Line-by-line diff comparing original saved posting text against updated online descriptions.
  - Automatically flags alterations to compensation, required seniority, and newly added requirements.
- **Visual Terminal Kanban Board (`jobradar board`)**:
  - Clean ASCII/Unicode board grouping active applications by stage with pending reminder badges (`🔔`).
- **Comprehensive Card View (`jobradar show <id>`)**:
  - Detailed application inspector showing history, notes, compensation, interview stages, and follow-ups.
- **Interactive Interview & Reminder Lifecycle Management**:
  - `jobradar stage add` and `jobradar stage result`: add and track interview rounds.
  - `jobradar remind add` and `jobradar remind done`: manage follow-up deadlines with automated stale check (>10 days) and ghosting alerts (>30 days).
- **Skill Gap Matcher (`jobradar gap`)**:
  - Seamless integration with CareerVault's `career.json` profile to compute verifiable skill coverage.
- **Multi-Sink Exporters (`jobradar export`)**:
  - **Standalone Interactive HTML**: single-file dashboard with KPI cards, Kanban board, and dark/light mode.
  - **RFC 5545 iCalendar (`.ics`)**: direct sync with Google Calendar, Apple Calendar, and Microsoft Outlook.
  - **Markdown (`.md`)**: readable table and formatted cards for notes or static sites.
  - **CSV**: spreadsheet export with round-trip CSV bulk import (`jobradar import --csv`).
- **Zero-Dependency Architecture**:
  - Pure TypeScript targeting ECMAScript 2023 on Node.js (≥ 22.18).
  - Uses only native Node.js standard libraries (`node:fs`, `node:path`, `node:crypto`, `node:test`).
  - Core logic strictly constrained under 1,500 lines for maximum auditability.
- **Deterministic Test Suite**:
  - 25 comprehensive unit tests covering all core modules, exporters, and CLI commands.
