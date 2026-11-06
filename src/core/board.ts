// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobApplication, ApplicationStatus } from './types.ts';

const PIPELINE_COLUMNS: Array<{ status: ApplicationStatus; title: string }> = [
  { status: 'discovered', title: 'DISCOVERED' },
  { status: 'applied', title: 'APPLIED' },
  { status: 'screening', title: 'SCREENING' },
  { status: 'interviewing', title: 'INTERVIEWS' },
  { status: 'offer_received', title: 'OFFER' }
];

export function renderTerminalBoard(applications: JobApplication[]): string {
  const lines: string[] = [];

  lines.push('\n📌 JobRadar Kanban Board\n');

  for (const col of PIPELINE_COLUMNS) {
    const apps = applications.filter(a => a.status === col.status);
    lines.push(`┌─── [${col.title}] (${apps.length}) ` + '─'.repeat(Math.max(0, 50 - col.title.length)));

    if (apps.length === 0) {
      lines.push('│   (empty)');
    } else {
      for (const app of apps) {
        const salaryInfo = app.salary?.min
          ? ` [${app.salary.currency} ${app.salary.min}${app.salary.max ? `-${app.salary.max}` : ''}]`
          : '';
        const stagesCount = app.stages?.length ? ` (${app.stages.length} rounds)` : '';
        const pendingReminders = (app.reminders || []).filter(r => !r.completed).length;
        const reminderTag = pendingReminders > 0 ? ` 🔔 ${pendingReminders}` : '';

        lines.push(`│ • ${app.company} — ${app.role}${salaryInfo}${stagesCount}${reminderTag}`);
        lines.push(`│   ID: ${app.id} | Workplace: ${app.workplace} | Updated: ${app.dates.lastInteractionAt}`);
      }
    }
    lines.push('└───' + '─'.repeat(54) + '\n');
  }

  // Also summarize concluded (rejected, accepted, ghosted, withdrawn)
  const concluded = applications.filter(a =>
    ['accepted', 'rejected', 'withdrawn', 'ghosted'].includes(a.status)
  );

  if (concluded.length > 0) {
    lines.push(`📦 Concluded / Archived (${concluded.length}):`);
    for (const c of concluded) {
      lines.push(`   - [${c.status.toUpperCase()}] ${c.company} — ${c.role} (${c.id})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
