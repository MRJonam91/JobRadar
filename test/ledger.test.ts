// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyLedger,
  addApplication,
  updateApplicationStatus
} from '../src/core/ledger.ts';

test('Ledger: creates empty ledger and adds valid application', () => {
  const ledger = createEmptyLedger('Test User', 'test@example.com');
  assert.equal(ledger.applications.length, 0);

  const app = addApplication(ledger, {
    company: 'Stripe',
    role: 'Infrastructure Engineer',
    workplace: 'remote',
    status: 'applied',
    cvVersion: 'cv-2026-v1',
    salaryMin: 90000,
    salaryMax: 110000,
    salarySource: 'job_board_listing'
  });

  assert.equal(ledger.applications.length, 1);
  assert.equal(app.company, 'Stripe');
  assert.equal(app.status, 'applied');
  assert.ok(app.id.startsWith('stripe-'));
  assert.equal(app.cv?.versionId, 'cv-2026-v1');
});

test('Ledger: updates application status and records interaction date', () => {
  const ledger = createEmptyLedger();
  const app = addApplication(ledger, {
    company: 'GitLab',
    role: 'Senior SRE',
    status: 'applied'
  });

  const updated = updateApplicationStatus(ledger, app.id, 'screening', 'Call with lead recruiter scheduled');
  assert.equal(updated.status, 'screening');
  assert.ok(updated.notes?.includes('Call with lead recruiter scheduled'));
});
