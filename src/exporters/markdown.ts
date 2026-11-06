// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobRadarLedger } from '../core/types.ts';
import { computePipelineStats } from '../core/stats.ts';
import { detectApplicationReminders } from '../core/reminders.ts';

export function exportLedgerToMarkdown(ledger: JobRadarLedger): string {
  const alerts = detectApplicationReminders(ledger.applications);
  const stats = computePipelineStats(ledger.applications, alerts.filter(a => a.type === 'stale_application').length);

  const lines: string[] = [];

  lines.push('# JobRadar — Application Pipeline & Ledger');
  lines.push('');
  lines.push(`*Last updated: ${ledger.updatedAt.slice(0, 10)} | Total applications: ${stats.total}*`);
  lines.push('');

  // 1. Pipeline Overview
  lines.push('## 📊 Funnel & Pipeline Overview');
  lines.push('');
  lines.push('| Metric | Count / Value |');
  lines.push('|---|---|');
  lines.push(`| **Active Applications** | ${stats.activeCount} |`);
  lines.push(`| **Closed / Concluded** | ${stats.closedCount} |`);
  lines.push(`| **Response Rate** (Screening / Total Applied) | ${stats.responseRatePercent}% |`);
  lines.push(`| **Interview Rate** | ${stats.interviewRatePercent}% |`);
  lines.push(`| **Offer Rate** | ${stats.offerRatePercent}% |`);
  lines.push(`| **Stale / Pending Follow-up** | ${stats.staleCount} |`);
  lines.push('');

  // 2. Actionable Alerts
  if (alerts.length > 0) {
    lines.push('## ⚠️ Urgent Follow-ups & Reminders');
    lines.push('');
    lines.push('| Type | Company | Role | Due Date | Status | Details |');
    lines.push('|---|---|---|---|---|---|');
    for (const a of alerts) {
      const tag = a.isOverdue ? '🚨 OVERDUE' : '⏳ UPCOMING';
      lines.push(`| ${a.type} | **${a.company}** | ${a.role} | ${a.dueDate} | ${tag} | ${a.details} |`);
    }
    lines.push('');
  }

  // 3. Application Summary Table
  lines.push('## 📋 Applications Ledger');
  lines.push('');
  lines.push('| ID | Company | Role | Workplace | Status | Discovered | Applied | CV Used | Salary |');
  lines.push('|---|---|---|---|---|---|---|---|---|');

  for (const app of ledger.applications) {
    const sal = app.salary
      ? `${app.salary.currency} ${app.salary.min ?? '?'}-${app.salary.max ?? '?'} (${app.salary.source})`
      : '—';
    const cv = app.cv?.versionId || '—';
    const applied = app.dates.appliedAt || '—';

    lines.push(
      `| \`${app.id}\` | **${app.company}** | ${app.role} | ${app.workplace} | \`${app.status}\` | ${app.dates.discoveredAt} | ${applied} | ${cv} | ${sal} |`
    );
  }
  lines.push('');

  // 4. Details Section
  lines.push('## 🔍 Application Details');
  lines.push('');

  for (const app of ledger.applications) {
    lines.push(`### ${app.company} — ${app.role} (\`${app.status}\`)`);
    lines.push(`- **ID**: \`${app.id}\``);
    if (app.url) lines.push(`- **URL**: [Job Posting](${app.url})`);
    lines.push(`- **Workplace**: ${app.workplace} ${app.location ? `(${app.location})` : ''}`);
    lines.push(`- **Timeline**: Discovered: ${app.dates.discoveredAt} | Applied: ${app.dates.appliedAt || 'N/A'} | Last interaction: ${app.dates.lastInteractionAt}`);
    if (app.cv?.versionId) {
      lines.push(`- **CV Reference**: \`${app.cv.versionId}\` ${app.cv.notes ? `(${app.cv.notes})` : ''}`);
    }
    if (app.salary) {
      lines.push(`- **Verified Salary**: ${app.salary.currency} ${app.salary.min ?? '?'}-${app.salary.max ?? '?'} / ${app.salary.period} (Source: *${app.salary.source}*)`);
    }
    if (app.stages && app.stages.length > 0) {
      lines.push('- **Stages**:');
      for (const st of app.stages) {
        lines.push(`  - \`${st.date}\`: **${st.name}** [${st.result || 'pending'}] ${st.notes ? `— ${st.notes}` : ''}`);
      }
    }
    if (app.notes) {
      lines.push(`- **Notes**: ${app.notes}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
