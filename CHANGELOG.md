# Changelog — JobRadar

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e aderisce a [Semantic Versioning](https://semver.org/).

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/).

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
