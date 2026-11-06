// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { exportLedgerToHtml } from '../src/exporters/html.ts';
import type { JobRadarLedger } from '../src/core/types.ts';

test('HTML Exporter: produces standalone HTML with kanban board, KPI metrics and styling', () => {
  const ledger: JobRadarLedger = {
    version: '1.2.0-beta',
    updatedAt: '2026-11-06T12:00:00.000Z',
    applications: [
      {
        id: 'html-app-1',
        company: 'Stripe',
        role: 'Staff Infrastructure Engineer',
        workplace: 'remote',
        status: 'interviewing',
        dates: {
          discoveredAt: '2026-11-01',
          appliedAt: '2026-11-02',
          lastInteractionAt: '2026-11-05'
        },
        salary: {
          currency: 'EUR',
          min: 105000,
          max: 125000,
          period: 'year',
          source: 'job_posting'
        },
        stages: [
          { id: 'st-1', name: 'Technical Screening', date: '2026-11-04', result: 'passed' }
        ],
        reminders: [],
        tags: ['infrastructure', 'kubernetes']
      }
    ]
  };

  const html = exportLedgerToHtml(ledger);
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('<title>JobRadar — Application Pipeline &amp; Ledger</title>'));
  assert.ok(html.includes('Stripe'));
  assert.ok(html.includes('Staff Infrastructure Engineer'));
  assert.ok(html.includes('105000-125000'));
  assert.ok(html.includes('1 rounds'));
  assert.ok(html.includes('Kanban Pipeline'));
});
