// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyLedger,
  addApplication,
  addStage,
  updateStageResult,
  addManualReminder,
  completeReminder,
  removeApplication
} from '../src/core/ledger.ts';

test('Stage & Reminder Management: addStage and updateStageResult', () => {
  const ledger = createEmptyLedger();
  const app = addApplication(ledger, {
    company: 'Stripe',
    role: 'SRE',
    status: 'applied'
  });

  const stage = addStage(ledger, app.id, {
    name: 'Technical Screen',
    date: '2026-11-15',
    type: 'technical',
    interviewer: 'Alex'
  });

  assert.equal(stage.name, 'Technical Screen');
  assert.equal(stage.result, 'pending');
  assert.equal(app.status, 'interviewing', 'Should auto-transition to interviewing');

  const updatedStage = updateStageResult(ledger, app.id, stage.id, 'passed', 'Good performance on Linux internals');
  assert.equal(updatedStage.result, 'passed');
  assert.ok(updatedStage.notes?.includes('Linux internals'));
});

test('Stage & Reminder Management: addManualReminder and completeReminder', () => {
  const ledger = createEmptyLedger();
  const app = addApplication(ledger, {
    company: 'GitLab',
    role: 'Lead Architect',
    status: 'interviewing'
  });

  const rem = addManualReminder(ledger, app.id, '2026-11-20', 'Send thank you email');
  assert.equal(rem.reason, 'Send thank you email');
  assert.equal(rem.completed, false);

  const done = completeReminder(ledger, app.id, rem.id);
  assert.equal(done.completed, true);
  assert.ok(done.completedAt);
});

test('Stage & Reminder Management: removeApplication removes entry cleanly', () => {
  const ledger = createEmptyLedger();
  const app = addApplication(ledger, {
    company: 'Mistake Corp',
    role: 'Wrong Role'
  });
  assert.equal(ledger.applications.length, 1);

  const removed = removeApplication(ledger, app.id);
  assert.equal(removed, true);
  assert.equal(ledger.applications.length, 0);
});
