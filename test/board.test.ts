// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTerminalBoard } from '../src/core/board.ts';
import type { JobApplication } from '../src/core/types.ts';

test('Board: renders ASCII/Unicode columns for different application statuses', () => {
  const apps: JobApplication[] = [
    {
      id: 'app-disc',
      company: 'FutureCorp',
      role: 'Staff Engineer',
      workplace: 'remote',
      status: 'discovered',
      dates: { discoveredAt: '2026-11-01', lastInteractionAt: '2026-11-01' },
      stages: [],
      reminders: [],
      tags: []
    },
    {
      id: 'app-appl',
      company: 'TechFlow',
      role: 'Backend Dev',
      workplace: 'hybrid',
      status: 'applied',
      dates: { discoveredAt: '2026-11-01', appliedAt: '2026-11-02', lastInteractionAt: '2026-11-02' },
      stages: [],
      reminders: [],
      tags: []
    },
    {
      id: 'app-inter',
      company: 'Stripe',
      role: 'Platform SRE',
      workplace: 'remote',
      status: 'interviewing',
      dates: { discoveredAt: '2026-10-25', appliedAt: '2026-10-26', lastInteractionAt: '2026-11-04' },
      stages: [{ id: 'st-1', name: 'System Design', date: '2026-11-10', result: 'pending' }],
      reminders: [{ id: 'rem-1', dueDate: '2026-11-09', reason: 'Prep', completed: false }],
      tags: []
    }
  ];

  const board = renderTerminalBoard(apps);
  assert.ok(board.includes('📌 JobRadar Kanban Board'));
  assert.ok(board.includes('[DISCOVERED]'));
  assert.ok(board.includes('[APPLIED]'));
  assert.ok(board.includes('[INTERVIEWS]'));
  assert.ok(board.includes('FutureCorp'));
  assert.ok(board.includes('TechFlow'));
  assert.ok(board.includes('Stripe'));
  assert.ok(board.includes('🔔 1'), 'Should show pending reminder icon');
});
