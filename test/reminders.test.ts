// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectApplicationReminders } from '../src/core/reminders.ts';
import type { JobApplication } from '../src/core/types.ts';

test('Reminders: detects stale application past threshold', () => {
  const apps: JobApplication[] = [
    {
      id: 'app-stale',
      company: 'Silent Corp',
      role: 'Backend Dev',
      workplace: 'remote',
      status: 'applied',
      dates: {
        discoveredAt: '2026-10-01',
        appliedAt: '2026-10-02',
        lastInteractionAt: '2026-10-02'
      },
      stages: [],
      reminders: [],
      tags: []
    }
  ];

  const alerts = detectApplicationReminders(apps, {
    referenceDate: '2026-10-20',
    staleThresholdDays: 10
  });

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0]?.type, 'stale_application');
  assert.equal(alerts[0]?.isOverdue, true);
  assert.ok(alerts[0]?.details.includes('recommended follow-up'));
});

test('Reminders: flags offer deadline approaching and expired', () => {
  const apps: JobApplication[] = [
    {
      id: 'app-offer',
      company: 'Dream Offer Inc',
      role: 'Staff Engineer',
      workplace: 'remote',
      status: 'offer_received',
      dates: {
        discoveredAt: '2026-10-01',
        appliedAt: '2026-10-02',
        lastInteractionAt: '2026-10-20',
        offerDeadline: '2026-10-25'
      },
      stages: [],
      reminders: [],
      tags: []
    }
  ];

  // Test before deadline
  const alertsBefore = detectApplicationReminders(apps, {
    referenceDate: '2026-10-22'
  });
  assert.equal(alertsBefore.length, 1);
  assert.equal(alertsBefore[0]?.type, 'offer_deadline');
  assert.equal(alertsBefore[0]?.isOverdue, false);
  assert.ok(alertsBefore[0]?.details.includes('Decision required within 3 days'));

  // Test after deadline
  const alertsAfter = detectApplicationReminders(apps, {
    referenceDate: '2026-10-28'
  });
  assert.equal(alertsAfter.length, 1);
  assert.equal(alertsAfter[0]?.isOverdue, true);
  assert.ok(alertsAfter[0]?.details.includes('Offer expired 3 days ago'));
});
