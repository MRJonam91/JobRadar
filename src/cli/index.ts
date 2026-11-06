#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import { resolve } from 'node:path';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { JR_VERSION, VALID_STATUSES, VALID_WORKPLACE_TYPES } from '../core/constants.ts';
import type { ApplicationStatus, WorkplaceType } from '../core/types.ts';
import {
  createEmptyLedger,
  loadLedger,
  saveLedger,
  addApplication,
  updateApplicationStatus
} from '../core/ledger.ts';
import { validateLedger } from '../core/validator.ts';
import { detectApplicationReminders } from '../core/reminders.ts';
import { computePipelineStats } from '../core/stats.ts';
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
  jobradar <command> [options]

COMMANDS:
  init                     Initialize a new jobradar.json ledger in current directory
  add                      Add a new job application
  list                     List applications in tabular format
  status <id> <newStatus>  Update the lifecycle status of an application
  remind                   Show active follow-up reminders and stale applications
  stats                    Display conversion funnel and pipeline statistics
  export                   Export ledger to Markdown, iCal, CSV, or JSON
  doctor                   Audit and validate ledger integrity

OPTIONS:
  --file <path>            Path to ledger file (default: jobradar.json)
  -h, --help               Show help menu
  -v, --version            Show version

ADD OPTIONS:
  --company <name>         Company name (required)
  --role <title>           Job title/position (required)
  --url <url>              Link to job posting or job board
  --workplace <type>       remote | hybrid | onsite (default: remote)
  --location <city>        Office location or timezone
  --status <status>        Initial status (default: discovered)
  --cv <version>           CV version used (e.g. cv-backend-2026-v2)
  --salary-min <number>    Minimum salary
  --salary-max <number>    Maximum salary
  --salary-source <str>    Verifiable source for salary (MANDATORY if salary provided)
  --tags <tag1,tag2>       Comma-separated tags
  --notes <notes>          Notes or recruiter remarks

EXAMPLES:
  jobradar init
  jobradar add --company "Acme Corp" --role "Senior Engineer" --workplace remote
  jobradar add --company "Stripe" --role "Staff SRE" --status applied --cv "v3.1" --salary-min 95000 --salary-max 120000 --salary-source "job_posting"
  jobradar list --status applied
  jobradar status stripe-2026 interviewing --notes "Passed screening call"
  jobradar remind
  jobradar export --format ical --out reminders.ics
  jobradar stats
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

      case 'remind': {
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
