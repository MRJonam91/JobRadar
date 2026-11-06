# Changelog — JobRadar

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e aderisce a [Semantic Versioning](https://semver.org/).

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0-beta] - 2026-11-06

### Added
- **Job Posting Parser & Safe Extractor (`jobradar parse`)**:
  - Automatically extracts role, company, workplace mode (`remote`, `hybrid`, `onsite`), verifiable salary ranges (`€`, `$`, `k`), and technical keywords from plain text and HTML OpenGraph metadata.
  - New flag `jobradar add --from-file <path>` to auto-ingest postings and persist a `rawPosting` snapshot for future auditing.
- **Reverse Job Match & Target Criteria Audit (`jobradar audit <id>`)**:
  - Audits applications against personal preferences (`minSalary`, `preferredWorkplace`, `targetRoles`, `blacklistedCompanies`).
  - Reports clear pass/warning/fail rules without guesswork.
- **Job Git Diff (`jobradar diff <id> --file <updatedPosting>`)**:
  - Deterministic line-by-line diff between saved job posting snapshots and updated listings.
  - Automatically flags critical compensation changes and newly added mandatory requirements.
- **Interactive Standalone HTML Exporter (`jobradar export --format html`)**:
  - Zero-dependency, offline-capable single-file dashboard with dark/light theme support.
  - Includes KPI metric cards, responsive Kanban board, and full applications data table.
- **Advanced CLI Filtering & Sorting**:
  - Support for `--remote` filtering and `--sort salary|company` in `jobradar list`.
- **Extended Test Suite**: 25 deterministic unit tests passing in ~1.2s.

## [1.1.0-alpha] - 2026-11-06

### Added
- **ASCII/Unicode Terminal Kanban Board (`jobradar board`)**: visual pipeline columns (`DISCOVERED`, `APPLIED`, `SCREENING`, `INTERVIEWS`, `OFFER`) with pending reminder indicators.
- **Detailed Card Inspector (`jobradar show <id>`)**: inspect full application state, timeline, compensation records, interview rounds, and follow-ups.
- **Interactive Interview Stage Management**:
  - `jobradar stage add <appId> --name "..." --date "..."`: record upcoming technical and behavioral rounds.
  - `jobradar stage result <appId> <stageId> <passed|pending|failed>`: mark results and notes.
- **Interactive Reminder Management**:
  - `jobradar remind add <appId> --date "..." --reason "..."`: add ad-hoc follow-up dates.
  - `jobradar remind done <appId> <reminderId>`: mark reminders as completed with timestamp.
- **CareerVault Integration & Skill Gap Analysis (`jobradar gap <id> --career <path>`)**:
  - Deterministically verifies tags and requirements against `career.json` skills from CareerVault.
  - Reports matched skills and missing competencies without arbitrary estimation.
- **CSV Bulk Importer (`jobradar import --csv <path>`)**: bulk ingest applications from spreadsheets with round-trip reliability.
- **Application Deletion (`jobradar remove <id>`)**: safe removal of accidental entries.
- **Extended Test Suite**: 19 deterministic tests covering board rendering, matcher, stage lifecycle, and CSV imports.

## [1.0.0] - 2026-11-06

### Added
- **Core Ledger**: deterministic, local-first JSON ledger schema (`jobradar.json`) for tracking job applications and interview lifecycles.
- **Integrity & Verification**: validation engine guaranteeing date consistency, unique application IDs, valid state machine transitions, and requiring verifiable sources for salary ranges (zero unsubstantiated estimates).
- **Stage Progression & State Machine**: structured pipeline states (`discovered`, `applied`, `screening`, `interviewing`, `offer_received`, `accepted`, `rejected`, `withdrawn`, `ghosted`).
- **Smart Follow-up Reminders**: automated stale application detection (>10 days without interaction), upcoming interview notifications, and offer expiration alerts.
- **Exporters**:
  - Markdown summary table and candidate status cards.
  - RFC 5545 iCalendar (`.ics`) exporter for direct import into Google Calendar, Apple Calendar, and Outlook.
  - CSV export for spreadsheet analysis.
- **CLI Commands**: `init`, `add`, `list`, `status`, `remind`, `stats`, `export`, `doctor`.
- **Zero-Dependency Architecture**: written in pure TypeScript leveraging Node.js standard libraries (`node:fs`, `node:path`, `node:test`, `node:crypto`).
