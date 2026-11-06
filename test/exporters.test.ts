// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { exportLedgerToMarkdown } from '../src/exporters/markdown.ts';
import { exportLedgerToICal } from '../src/exporters/ical.ts';
import { exportLedgerToCsv } from '../src/exporters/csv.ts';
import type { JobRadarLedger } from '../src/core/types.ts';

const sampleLedger: JobRadarLedger = {
  version: '1.0.0',
  updatedAt: '2026-11-06T12:00:00.000Z',
  applications: [
    {
      id: 'app-01',
      company: 'OmniCorp',
      role: 'Staff Architect',
      workplace: 'remote',
      status: 'interviewing',
      dates: {
        discoveredAt: '2026-11-01',
        appliedAt: '2026-11-02',
        lastInteractionAt: '2026-11-04'
      },
      salary: {
        currency: 'EUR',
        min: 100000,
        max: 120000,
        period: 'year',
        source: 'recruiter_disclosure'
      },
      stages: [
        {
          id: 'st-01',
          name: 'Tech Interview',
          date: '2026-11-10',
          result: 'pending'
        }
      ],
      reminders: [
        {
          id: 'rem-01',
          dueDate: '2026-11-09',
          reason: 'Review system design concepts'
        }
      ],
      tags: ['platform'],
      notes: 'Initial feedback was positive'
    }
  ]
};

test('Exporters: Markdown exporter produces table and sections', () => {
  const md = exportLedgerToMarkdown(sampleLedger);
  assert.ok(md.includes('# JobRadar — Application Pipeline & Ledger'));
  assert.ok(md.includes('OmniCorp'));
  assert.ok(md.includes('Staff Architect'));
  assert.ok(md.includes('recruiter_disclosure'));
});

test('Exporters: iCal exporter produces valid RFC 5545 VCALENDAR', () => {
  const ics = exportLedgerToICal(sampleLedger);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('VERSION:2.0'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('OmniCorp'));
  assert.ok(ics.includes('END:VCALENDAR'));
});

test('Exporters: CSV exporter produces header and properly escaped values', () => {
  const csv = exportLedgerToCsv(sampleLedger);
  assert.ok(csv.startsWith('"ID","Company","Role"'));
  assert.ok(csv.includes('"OmniCorp"'));
  assert.ok(csv.includes('"Staff Architect"'));
});
