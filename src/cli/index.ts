#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import { resolve } from 'node:path';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { JR_VERSION, VALID_STATUSES, VALID_WORKPLACE_TYPES } from '../core/constants.ts';
import type { ApplicationStatus, WorkplaceType, InterviewStage } from '../core/types.ts';
import {
  createEmptyLedger,
  loadLedger,
  saveLedger,
  addApplication,
  updateApplicationStatus,
  findApplication,
  removeApplication,
  addStage,
  updateStageResult,
  addManualReminder,
  completeReminder,
  importFromCsv
} from '../core/ledger.ts';
import { validateLedger } from '../core/validator.ts';
import { detectApplicationReminders } from '../core/reminders.ts';
import { computePipelineStats } from '../core/stats.ts';
import { renderTerminalBoard } from '../core/board.ts';
import { computeSkillGap } from '../core/matcher.ts';
import { exportLedgerToMarkdown } from '../exporters/markdown.ts';
import { exportLedgerToICal } from '../exporters/ical.ts';
import { exportLedgerToCsv } from '../exporters/csv.ts';

const DEFAULT_LEDGER_FILE = 'jobradar.json';

function printSponsorLine(force: boolean = false) {
  if (process.env.NO_SPONSOR === '1' || process.env.CI || !process.stdout.isTTY) {
    if (!force) return;
  }
  if (force || Math.random() < 0.1) {
    console.log('\n💖 Support JobRadar development: https://github.com/sponsors/MRJonam91 (or https://ko-fi.com/mrjonam)');
  }
}

function parseCliArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

function showHelp() {
  console.log(`
JobRadar v${JR_VERSION} — Deterministic Job Application Tracker & Reminder Engine
Copyright (c) 2026 Manoj Rollo (MRJonam91)

USAGE:
  jobradar <command> [subcommand] [options]

PRIMARY COMMANDS:
  init                           Initialize a new jobradar.json ledger in current directory
  add                            Add a new job application
  list                           List applications in tabular format
  board                          Display ASCII/Unicode Kanban board of active pipeline
  show <id>                      Display comprehensive card and history for an application
  status <id> <newStatus>        Update the lifecycle status of an application
  remove <id>                    Remove an application from the ledger
  remind                         Show active follow-up reminders and stale applications
  stats                          Display conversion funnel and pipeline statistics
  export                         Export ledger to Markdown, iCal, CSV, or JSON
  import --csv <file>            Bulk import applications from CSV
  gap <id> [--career <path>]     Calculate skill match and gap with CareerVault profile
  doctor                         Audit and validate ledger integrity

SUBCOMMANDS:
  stage add <id> --name <str> --date <YYYY-MM-DD> [--type <type>] [--interviewer <str>]
  stage result <id> <stageId> <passed|pending|failed> [--notes <str>]
  remind add <id> --date <YYYY-MM-DD> --reason <str>
  remind done <id> <reminderId>

GLOBAL OPTIONS:
  --file <path>                  Path to ledger file (default: jobradar.json)
  -h, --help                     Show help menu
  -v, --version                  Show version

EXAMPLES:
  jobradar init
  jobradar add --company "Acme Cloud" --role "Staff SRE" --status applied --salary-min 95000 --salary-source "job_posting"
  jobradar stage add acme-cloud --name "System Design" --date "2026-11-15" --type system_design
  jobradar board
  jobradar remind
  jobradar gap acme-cloud --career ../CareerVault/career.json
  jobradar export --format ical --out calendar.ics
`);
  printSponsorLine(true);
}

function main() {
  const rawArgs = process.argv.slice(2);
  const { flags, positional } = parseCliArgs(rawArgs);

  if (flags.help || flags.h || positional.length === 0) {
    showHelp();
    process.exit(0);
  }

  if (flags.version || flags.v) {
    console.log(`v${JR_VERSION}`);
    process.exit(0);
  }

  const ledgerPath = resolve(process.cwd(), (flags.file as string) || DEFAULT_LEDGER_FILE);
  const command = positional[0]?.toLowerCase();

  try {
    switch (command) {
      case 'init': {
        if (existsSync(ledgerPath) && !flags.force) {
          console.error(`Ledger file already exists at ${ledgerPath}. Use --force to overwrite.`);
          process.exit(1);
        }
        const ledger = createEmptyLedger(flags.owner as string);
        saveLedger(ledgerPath, ledger);
        console.log(`Initialized empty JobRadar ledger at: ${ledgerPath}`);
        printSponsorLine();
        break;
      }

      case 'add': {
        const company = flags.company as string;
        const role = flags.role as string;
        if (!company || !role) {
          console.error('Error: --company and --role are required to add an application.');
          process.exit(1);
        }

        const workplace = (flags.workplace as WorkplaceType) || 'remote';
        if (!VALID_WORKPLACE_TYPES.includes(workplace)) {
          console.error(`Invalid workplace. Must be one of: ${VALID_WORKPLACE_TYPES.join(', ')}`);
          process.exit(1);
        }

        const status = (flags.status as ApplicationStatus) || 'discovered';
        if (!VALID_STATUSES.includes(status)) {
          console.error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
          process.exit(1);
        }

        const ledger = existsSync(ledgerPath)
          ? loadLedger(ledgerPath)
          : createEmptyLedger();

        const tags = typeof flags.tags === 'string'
          ? flags.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        const salaryMin = flags['salary-min'] !== undefined ? Number(flags['salary-min']) : undefined;
        const salaryMax = flags['salary-max'] !== undefined ? Number(flags['salary-max']) : undefined;
        const salarySource = flags['salary-source'] as string | undefined;

        const newApp = addApplication(ledger, {
          company,
          role,
          url: flags.url as string | undefined,
          workplace,
          location: flags.location as string | undefined,
          status,
          cvVersion: flags.cv as string | undefined,
          notes: flags.notes as string | undefined,
          tags,
          salaryMin,
          salaryMax,
          salarySource
        });

        saveLedger(ledgerPath, ledger);
        console.log(`Added application [${newApp.id}] for ${newApp.role} at ${newApp.company} (Status: ${newApp.status})`);
        printSponsorLine();
        break;
      }

      case 'show': {
        const id = positional[1];
        if (!id) {
          console.error('Usage: jobradar show <id>');
          process.exit(1);
        }
        const ledger = loadLedger(ledgerPath);
        const app = findApplication(ledger, id);
        if (!app) {
          console.error(`Application "${id}" not found.`);
          process.exit(1);
        }

        console.log(`\n📄 Application Card: ${app.company} — ${app.role}`);
        console.log(`- ID:               ${app.id}`);
        console.log(`- Status:           ${app.status.toUpperCase()}`);
        console.log(`- Workplace:        ${app.workplace} ${app.location ? `(${app.location})` : ''}`);
        console.log(`- Discovered:       ${app.dates.discoveredAt}`);
        console.log(`- Applied:          ${app.dates.appliedAt || 'N/A'}`);
        console.log(`- Last Contact:     ${app.dates.lastInteractionAt}`);
        if (app.url) console.log(`- Posting URL:      ${app.url}`);
        if (app.cv?.versionId) console.log(`- CV Version:       ${app.cv.versionId}`);
        if (app.salary) {
          console.log(`- Verified Salary:  ${app.salary.currency} ${app.salary.min ?? '?'}-${app.salary.max ?? '?'} / ${app.salary.period} (Source: ${app.salary.source})`);
        }
        if (app.tags.length > 0) console.log(`- Tags:             ${app.tags.join(', ')}`);

        if (app.stages && app.stages.length > 0) {
          console.log('\n  Interview Rounds:');
          for (const s of app.stages) {
            console.log(`    [${s.result || 'pending'}] ${s.date}: ${s.name} ${s.interviewer ? `(${s.interviewer})` : ''} - ID: ${s.id}`);
            if (s.notes) console.log(`      Notes: ${s.notes}`);
          }
        }

        if (app.reminders && app.reminders.length > 0) {
          console.log('\n  Follow-up Reminders:');
          for (const r of app.reminders) {
            const statusTag = r.completed ? '✓ DONE' : '⏳ PENDING';
            console.log(`    [${statusTag}] Due: ${r.dueDate} - ${r.reason} (ID: ${r.id})`);
          }
        }
        console.log('');
        printSponsorLine();
        break;
      }

      case 'board': {
        const ledger = loadLedger(ledgerPath);
        console.log(renderTerminalBoard(ledger.applications));
        printSponsorLine();
        break;
      }

      case 'remove': {
        const id = positional[1];
        if (!id) {
          console.error('Usage: jobradar remove <id>');
          process.exit(1);
        }
        const ledger = loadLedger(ledgerPath);
        const removed = removeApplication(ledger, id);
        if (removed) {
          saveLedger(ledgerPath, ledger);
          console.log(`Removed application "${id}" from ledger.`);
        } else {
          console.error(`Application "${id}" not found.`);
          process.exit(1);
        }
        printSponsorLine();
        break;
      }

      case 'list': {
        const ledger = loadLedger(ledgerPath);
        let list = ledger.applications;

        if (flags.status) {
          list = list.filter(a => a.status === flags.status);
        }
        if (flags.company) {
          list = list.filter(a => a.company.toLowerCase().includes(String(flags.company).toLowerCase()));
        }

        if (flags.json) {
          console.log(JSON.stringify(list, null, 2));
          return;
        }

        if (list.length === 0) {
          console.log('No applications matched.');
          return;
        }

        console.log(`\nJobRadar Applications (${list.length}):\n`);
        console.log(
          'ID'.padEnd(26) +
          'Company'.padEnd(20) +
          'Role'.padEnd(26) +
          'Status'.padEnd(16) +
          'Discovered'.padEnd(12) +
          'Applied'.padEnd(12)
        );
        console.log('-'.repeat(112));

        for (const app of list) {
          console.log(
            app.id.padEnd(26) +
            app.company.slice(0, 18).padEnd(20) +
            app.role.slice(0, 24).padEnd(26) +
            app.status.padEnd(16) +
            app.dates.discoveredAt.padEnd(12) +
            (app.dates.appliedAt || '—').padEnd(12)
          );
        }
        console.log('');
        printSponsorLine();
        break;
      }

      case 'status': {
        const id = positional[1];
        const newStatus = positional[2] as ApplicationStatus;
        if (!id || !newStatus) {
          console.error('Usage: jobradar status <id> <newStatus> [--notes "notes"]');
          process.exit(1);
        }

        const ledger = loadLedger(ledgerPath);
        const updated = updateApplicationStatus(ledger, id, newStatus, flags.notes as string);
        saveLedger(ledgerPath, ledger);
        console.log(`Updated application [${updated.id}] status to: ${updated.status}`);
        printSponsorLine();
        break;
      }

      case 'stage': {
        const sub = positional[1]?.toLowerCase();
        const appId = positional[2];
        if (!sub || !appId) {
          console.error('Usage: jobradar stage add <appId> --name "..." --date "..." | jobradar stage result <appId> <stageId> <passed|failed>');
          process.exit(1);
        }

        const ledger = loadLedger(ledgerPath);

        if (sub === 'add') {
          const name = flags.name as string;
          const date = flags.date as string;
          if (!name || !date) {
            console.error('Error: --name and --date are required to add an interview stage.');
            process.exit(1);
          }
          const stage = addStage(ledger, appId, {
            name,
            date,
            type: (flags.type as InterviewStage['type']) || 'technical',
            interviewer: flags.interviewer as string | undefined,
            notes: flags.notes as string | undefined
          });
          saveLedger(ledgerPath, ledger);
          console.log(`Added interview stage [${stage.id}] "${stage.name}" on ${stage.date} for ${appId}`);
        } else if (sub === 'result') {
          const stageId = positional[3];
          const result = positional[4] as 'passed' | 'pending' | 'failed';
          if (!stageId || !result) {
            console.error('Usage: jobradar stage result <appId> <stageId> <passed|pending|failed>');
            process.exit(1);
          }
          const updated = updateStageResult(ledger, appId, stageId, result, flags.notes as string | undefined);
          saveLedger(ledgerPath, ledger);
          console.log(`Updated stage [${updated.id}] result to "${updated.result}"`);
        } else {
          console.error(`Unknown stage subcommand "${sub}". Use "add" or "result".`);
          process.exit(1);
        }
        printSponsorLine();
        break;
      }

      case 'remind': {
        const sub = positional[1]?.toLowerCase();

        if (sub === 'add') {
          const appId = positional[2];
          const date = flags.date as string;
          const reason = flags.reason as string;
          if (!appId || !date || !reason) {
            console.error('Usage: jobradar remind add <appId> --date "YYYY-MM-DD" --reason "..."');
            process.exit(1);
          }
          const ledger = loadLedger(ledgerPath);
          const rem = addManualReminder(ledger, appId, date, reason);
          saveLedger(ledgerPath, ledger);
          console.log(`Added reminder [${rem.id}] for ${appId} due on ${rem.dueDate}`);
          return;
        }

        if (sub === 'done') {
          const appId = positional[2];
          const remId = positional[3];
          if (!appId || !remId) {
            console.error('Usage: jobradar remind done <appId> <reminderId>');
            process.exit(1);
          }
          const ledger = loadLedger(ledgerPath);
          completeReminder(ledger, appId, remId);
          saveLedger(ledgerPath, ledger);
          console.log(`Marked reminder "${remId}" as completed for ${appId}`);
          return;
        }

        const ledger = loadLedger(ledgerPath);
        const alerts = detectApplicationReminders(ledger.applications, {
          referenceDate: flags['reference-date'] as string | undefined
        });

        if (alerts.length === 0) {
          console.log('No pending follow-ups or overdue reminders! All applications up to date.');
          return;
        }

        console.log(`\n🚨 Active Follow-up Reminders & Alerts (${alerts.length}):\n`);
        for (const a of alerts) {
          const badge = a.isOverdue ? '🚨 [OVERDUE]' : '⏳ [UPCOMING]';
          console.log(`${badge} ${a.company} — ${a.role} (${a.type})`);
          console.log(`   Due: ${a.dueDate} (${a.daysDiff} days) | Status: ${a.status}`);
          console.log(`   Action: ${a.details}\n`);
        }
        printSponsorLine();
        break;
      }

      case 'gap': {
        const appId = positional[1];
        if (!appId) {
          console.error('Usage: jobradar gap <appId> [--career <path-to-career.json>]');
          process.exit(1);
        }

        const ledger = loadLedger(ledgerPath);
        const app = findApplication(ledger, appId);
        if (!app) {
          console.error(`Application "${appId}" not found.`);
          process.exit(1);
        }

        const careerPath = (flags.career as string) || resolve(process.cwd(), '../CareerVault/career.json');
        if (!existsSync(careerPath)) {
          console.error(`Career profile not found at ${careerPath}. Use --career <path-to-career.json> to supply one.`);
          process.exit(1);
        }

        const rawProfile = JSON.parse(readFileSync(careerPath, 'utf-8'));
        const gapReport = computeSkillGap(app, rawProfile);

        console.log(`\n🎯 Skill Gap & Verification: ${app.company} — ${app.role}`);
        console.log(`Match Rate: ${gapReport.matchPercentage}% (${gapReport.matchedCount}/${gapReport.totalRequiredTags})`);

        if (gapReport.matched.length > 0) {
          console.log('\n  ✓ Matched Verified Skills:');
          for (const m of gapReport.matched) {
            console.log(`    - ${m.tag} ➔ ${m.skillName} ${m.lastUsed ? `(last used: ${m.lastUsed})` : ''}`);
          }
        }

        if (gapReport.gaps.length > 0) {
          console.log('\n  ⚠️ Missing Skills / Gaps:');
          for (const g of gapReport.gaps) {
            console.log(`    - ${g}`);
          }
        }
        console.log('');
        printSponsorLine();
        break;
      }

      case 'import': {
        const csvFile = flags.csv as string;
        if (!csvFile) {
          console.error('Usage: jobradar import --csv <path-to-csv>');
          process.exit(1);
        }
        const fullCsvPath = resolve(process.cwd(), csvFile);
        if (!existsSync(fullCsvPath)) {
          console.error(`CSV file not found at ${fullCsvPath}`);
          process.exit(1);
        }
        const ledger = existsSync(ledgerPath) ? loadLedger(ledgerPath) : createEmptyLedger();
        const content = readFileSync(fullCsvPath, 'utf-8');
        const res = importFromCsv(ledger, content);
        saveLedger(ledgerPath, ledger);
        console.log(`Imported ${res.imported} application(s) successfully.`);
        if (res.errors.length > 0) {
          console.log(`Warnings/Errors (${res.errors.length}):`);
          for (const err of res.errors) console.log(`  - ${err}`);
        }
        printSponsorLine();
        break;
      }

      case 'stats': {
        const ledger = loadLedger(ledgerPath);
        const alerts = detectApplicationReminders(ledger.applications);
        const staleCount = alerts.filter(a => a.type === 'stale_application').length;
        const stats = computePipelineStats(ledger.applications, staleCount);

        if (flags.json) {
          console.log(JSON.stringify(stats, null, 2));
          return;
        }

        console.log('\n📊 JobRadar Pipeline & Conversion Stats:\n');
        console.log(`Total tracked:         ${stats.total}`);
        console.log(`Active pipelines:      ${stats.activeCount}`);
        console.log(`Closed / Concluded:    ${stats.closedCount}`);
        console.log(`Stale / Need Action:   ${stats.staleCount}`);
        console.log(`Response rate (screen): ${stats.responseRatePercent}%`);
        console.log(`Interview rate:        ${stats.interviewRatePercent}%`);
        console.log(`Offer rate:            ${stats.offerRatePercent}%`);
        console.log('\nBreakdown by Status:');
        for (const [s, count] of Object.entries(stats.byStatus)) {
          if (count > 0) {
            console.log(`  - ${s.padEnd(16)}: ${count}`);
          }
        }
        console.log('');
        printSponsorLine();
        break;
      }

      case 'export': {
        const ledger = loadLedger(ledgerPath);
        const format = (flags.format as string) || 'markdown';
        let output = '';

        if (format === 'markdown' || format === 'md') {
          output = exportLedgerToMarkdown(ledger);
        } else if (format === 'ical' || format === 'ics') {
          output = exportLedgerToICal(ledger);
        } else if (format === 'csv') {
          output = exportLedgerToCsv(ledger);
        } else if (format === 'json') {
          output = JSON.stringify(ledger, null, 2);
        } else {
          console.error('Supported formats: markdown, ical, csv, json');
          process.exit(1);
        }

        const outPath = flags.out as string | undefined;
        if (outPath) {
          writeFileSync(resolve(process.cwd(), outPath), output, 'utf-8');
          console.log(`Exported ledger to ${outPath}`);
        } else {
          console.log(output);
        }
        break;
      }

      case 'doctor':
      case 'check': {
        if (!existsSync(ledgerPath)) {
          console.error(`Ledger file not found at ${ledgerPath}`);
          process.exit(1);
        }
        const raw = readFileSync(ledgerPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const result = validateLedger(parsed);

        console.log(`\nAuditing ledger: ${ledgerPath}`);
        if (result.valid) {
          console.log('✅ Ledger schema and consistency checks passed without errors.');
        } else {
          console.log(`❌ Ledger has ${result.issues.length} issue(s):`);
          for (const issue of result.issues) {
            console.log(`   [${issue.severity.toUpperCase()}] ${issue.path}: ${issue.message}`);
          }
          process.exit(1);
        }
        printSponsorLine();
        break;
      }

      default:
        console.error(`Unknown command: "${command}". Run "jobradar --help" for available commands.`);
        process.exit(1);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    process.exit(1);
  }
}

main();
