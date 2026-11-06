# Changelog — JobRadar

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.
Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e aderisce a [Semantic Versioning](https://semver.org/).

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/).

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
