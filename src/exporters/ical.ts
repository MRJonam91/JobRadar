// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobRadarLedger } from '../core/types.ts';
import { detectApplicationReminders } from '../core/reminders.ts';

function formatIcsDate(dateStr: string): string {
  // YYYY-MM-DD -> YYYYMMDD
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function exportLedgerToICal(ledger: JobRadarLedger): string {
  const alerts = detectApplicationReminders(ledger.applications);
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobRadar//Application Follow-ups & Interviews//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:JobRadar Applications'
  ];

  let eventIndex = 0;
  for (const a of alerts) {
    eventIndex++;
    const dt = formatIcsDate(a.dueDate);
    const uid = `jobradar-${a.applicationId}-${eventIndex}-${dt}@jobradar.local`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push(`DTEND;VALUE=DATE:${dt}`);
    lines.push(`SUMMARY:[JobRadar] ${escapeIcsText(a.company)} — ${escapeIcsText(a.role)} (${a.type})`);
    lines.push(`DESCRIPTION:${escapeIcsText(a.details)} | Application ID: ${a.applicationId}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
