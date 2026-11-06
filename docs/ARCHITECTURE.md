# JobRadar Architecture

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
│  Follow-up Engine│      │ Pipeline Funnel  │       │ Multi-Sink Export│
│ (Reminders/Alert)│      │  (Metrics/Stats) │       │ (MD, iCal, CSV)  │
└──────────────────┘      └──────────────────┘       └──────────────────┘
```

## Core Modules (`src/core/`)

1. **`types.ts`**:
   - Strongly typed primitives: `JobApplication`, `ApplicationStatus`, `WorkplaceType`, `SalarySpec`, `InterviewStage`, `FollowUpReminder`, `JobRadarLedger`, `ReminderAlert`, `PipelineStats`.
2. **`validator.ts`**:
   - Integrity validation:
     - Detects duplicate application IDs.
     - Enforces state transition coherence (e.g. applications in `screening`/`interviewing`/`offer_received` must have a valid `appliedAt` date).
     - **Verifiable Salary Source Requirement**: Prohibits unsubstantiated salary numbers without a documented source (`job_posting`, `recruiter_email`, `offer_letter`, etc.).
     - Prevents temporal inconsistencies (`appliedAt < discoveredAt`).
3. **`ledger.ts`**:
   - In-memory and disk persistence management for `jobradar.json`.
   - Application registration (`addApplication`), status transitions (`updateApplicationStatus`), and filtering.
4. **`reminders.ts`**:
   - Proactive candidate alert engine:
     - Identifies **stale applications** (e.g. >10 days without interaction) to recommend recruiter follow-ups.
     - Flags long-abandoned positions (>30 days) as likely ghosted.
     - Calculates approaching offer decision deadlines (`offerDeadline`).
     - Extracts upcoming interview stages scheduled within the next 7 days.
5. **`stats.ts`**:
   - Conversion funnel analysis:
     - Total applications, active vs. closed.
     - Response rate (percentage progressing to screening).
     - Interview conversion rate.
     - Offer rate.

## Export Sinks (`src/exporters/`)

- **`markdown.ts`**: Generates high-level funnel summaries, urgent alerts table, and full application catalog in formatted GitHub Flavored Markdown.
- **`ical.ts`**: Zero-dependency RFC 5545 iCalendar (`.ics`) generator mapping follow-ups and interview rounds directly into Google Calendar, Apple Calendar, and Microsoft Outlook.
- **`csv.ts`**: Standard CSV output formatted for spreadsheet analysis.

## Core Size & Architectural Constraints

- **Strict Core Size Guard**: The core directory (`src/core/`) must stay strictly under **1,500 non-empty lines** to ensure rapid auditing and maintainability.
- **Zero Runtime Dependencies**: Standard library only (`node:fs`, `node:path`, `node:crypto`).
- **Privacy First**: All data remains offline on local disk; zero tracking or telemetry.
