# JobRadar Architecture — v1.0.0 Stable

JobRadar is a deterministic, privacy-first **Job Application Tracker, Interview Lifecycle Monitor, and Follow-up Reminder Engine**. It gives candidates a centralized local ledger (`jobradar.json`) to track applications across companies, salary expectations with verifiable sources, interview stages, and follow-up deadlines without relying on cloud services.

## System Design & Component Overview

```
                      ┌───────────────────────────┐
                      │    jobradar.json Ledger   │
                      │  (JobRadarLedger Schema)  │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Validator & Auditor    │
                      │ (Integrity & Verifiability│
                      └─────────────┬─────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐       ┌──────────────────┐
│  Follow-up Engine│      │ Parser & Diff    │       │ Multi-Sink Export│
│ (Reminders/Alert)│      │ (Ingestion/Audit)│       │(HTML,MD,iCal,CSV)│
└──────────────────┘      └──────────────────┘       └──────────────────┘
```

## Core Modules (`src/core/`)

1. **`types.ts`**:
   - Strongly typed primitives: `JobApplication`, `ApplicationStatus`, `WorkplaceType`, `SalarySpec`, `InterviewStage`, `FollowUpReminder`, `JobRadarLedger`, `ReminderAlert`, `PipelineStats`, `TargetCriteria`, `TargetAuditResult`, `PostingDiffResult`.
2. **`validator.ts`**:
   - Integrity validation:
     - Detects duplicate application IDs.
     - Enforces state transition coherence (applications in `screening`/`interviewing`/`offer_received` must have a valid `appliedAt` date).
     - **Verifiable Salary Source Requirement**: Prohibits unsubstantiated salary numbers without a documented source (`job_posting`, `recruiter_email`, `offer_letter`, etc.).
     - Prevents temporal inconsistencies (`appliedAt < discoveredAt`).
3. **`ledger.ts`**:
   - In-memory and disk persistence management for `jobradar.json`.
   - Application registration (`addApplication`), status transitions (`updateApplicationStatus`), deletion (`removeApplication`), stage management (`addStage`, `updateStageResult`), manual reminder management (`addManualReminder`, `completeReminder`), and CSV bulk ingestion (`importFromCsv`).
4. **`reminders.ts`**:
   - Proactive candidate alert engine:
     - Identifies **stale applications** (>10 days without interaction) to recommend recruiter follow-ups.
     - Flags long-abandoned positions (>30 days) as likely ghosted.
     - Calculates approaching offer decision deadlines (`offerDeadline`).
     - Extracts upcoming interview stages scheduled within the next 7 days.
5. **`stats.ts`**:
   - Conversion funnel analysis:
     - Total applications, active vs. closed.
     - Response rate (percentage progressing to screening).
     - Interview conversion rate.
     - Offer rate.
6. **`board.ts`**:
   - ASCII/Unicode Kanban terminal view grouping applications across stages with pending reminder badges (`🔔`).
7. **`matcher.ts`**:
   - Skill gap reconciliation comparing application tags with candidate competencies declared in CareerVault's `career.json`.
8. **`parser.ts`**:
   - Safe offline parser extracting roles, companies, workplace modes, verifiable salaries, and technology keywords from plain text and HTML OpenGraph metadata.
9. **`target-audit.ts`**:
   - Reverse job search engine evaluating application fit against user-defined `TargetCriteria`.
10. **`diff.ts`**:
    - Line-by-line diff engine detecting alterations to compensation, required seniority, and newly added requirements between posting snapshots.

## Export Sinks (`src/exporters/`)

- **`html.ts`**: Self-contained interactive dashboard (dark/light theme, KPI summary cards, responsive Kanban board, and data table).
- **`markdown.ts`**: Formatted GitHub Flavored Markdown summary and catalog.
- **`ical.ts`**: Zero-dependency RFC 5545 iCalendar (`.ics`) generator mapping follow-ups and interview rounds directly into Google Calendar, Apple Calendar, and Microsoft Outlook.
- **`csv.ts`**: Standard CSV output formatted for spreadsheet analysis.

## Architectural Constraints

- **Strict Core Size Guard**: The core directory (`src/core/`) must stay strictly under **1,500 non-empty lines** to ensure rapid auditing and maintainability.
- **Zero Runtime Dependencies**: Standard library only (`node:fs`, `node:path`, `node:crypto`).
- **Privacy First**: All data remains offline on local disk; zero tracking or telemetry.
