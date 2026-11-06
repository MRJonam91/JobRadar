// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLedger } from '../src/core/validator.ts';
import { JR_ERROR_VERIFICATION_FAILED } from '../src/core/constants.ts';

test('Validator: valid ledger passes cleanly', () => {
  const ledger = {
    version: '1.0.0',
    updatedAt: '2026-11-06T12:00:00.000Z',
    applications: [
      {
        id: 'job-01',
        company: 'Cloud Corp',
        role: 'SRE',
        workplace: 'remote',
        status: 'applied',
        dates: {
          discoveredAt: '2026-11-01',
          appliedAt: '2026-11-02',
          lastInteractionAt: '2026-11-02'
        },
        salary: {
          currency: 'EUR',
          min: 80000,
          max: 95000,
          period: 'year',
          source: 'official_career_page'
        },
        stages: [],
        reminders: [],
        tags: ['sre']
      }
    ]
  };

  const res = validateLedger(ledger);
  assert.equal(res.valid, true);
  assert.equal(res.issues.length, 0);
});

test('Validator: catches temporal inconsistency (appliedAt < discoveredAt)', () => {
  const ledger = {
    version: '1.0.0',
    updatedAt: '2026-11-06T12:00:00.000Z',
    applications: [
      {
        id: 'job-02',
        company: 'Broken Dates Inc',
        role: 'QA Engineer',
        workplace: 'onsite',
        status: 'applied',
        dates: {
          discoveredAt: '2026-11-05',
          appliedAt: '2026-11-01', // Before discovery!
          lastInteractionAt: '2026-11-01'
        },
        stages: [],
        reminders: [],
        tags: []
      }
    ]
  };

  const res = validateLedger(ledger);
  assert.equal(res.valid, false);
  const dateError = res.issues.find(i => i.message.includes(JR_ERROR_VERIFICATION_FAILED));
  assert.ok(dateError, 'Should report temporal inconsistency error');
});

test('Validator: enforces verifiable salary source requirement', () => {
  const ledger = {
    version: '1.0.0',
    updatedAt: '2026-11-06T12:00:00.000Z',
    applications: [
      {
        id: 'job-03',
        company: 'Speculative LLC',
        role: 'Architect',
        workplace: 'remote',
        status: 'discovered',
        dates: {
          discoveredAt: '2026-11-01',
          lastInteractionAt: '2026-11-01'
        },
        salary: {
          currency: 'EUR',
          min: 150000,
          max: 200000,
          period: 'year',
          source: '' // Empty source not allowed!
        },
        stages: [],
        reminders: [],
        tags: []
      }
    ]
  };

  const res = validateLedger(ledger);
  assert.equal(res.valid, false);
  const salaryError = res.issues.find(i => i.path.includes('salary.source'));
  assert.ok(salaryError, 'Should enforce verifiable salary source');
  assert.ok(salaryError.message.includes(JR_ERROR_VERIFICATION_FAILED));
});

test('Validator: detects duplicate application IDs', () => {
  const ledger = {
    version: '1.0.0',
    updatedAt: '2026-11-06T12:00:00.000Z',
    applications: [
      {
        id: 'dup-id',
        company: 'Company A',
        role: 'Dev',
        workplace: 'remote',
        status: 'discovered',
        dates: { discoveredAt: '2026-11-01', lastInteractionAt: '2026-11-01' },
        stages: [],
        reminders: [],
        tags: []
      },
      {
        id: 'dup-id',
        company: 'Company B',
        role: 'Dev',
        workplace: 'hybrid',
        status: 'discovered',
        dates: { discoveredAt: '2026-11-01', lastInteractionAt: '2026-11-01' },
        stages: [],
        reminders: [],
        tags: []
      }
    ]
  };

  const res = validateLedger(ledger);
  assert.equal(res.valid, false);
  const dupError = res.issues.find(i => i.message.includes('Duplicate application ID'));
  assert.ok(dupError);
});

test('Validator: validates targetCriteria format and values', () => {
  const invalidLedger = {
    version: '1.0.0',
    updatedAt: '2026-11-06T12:00:00.000Z',
    targetCriteria: {
      minSalary: -5000,
      preferredWorkplace: ['invalid_workplace']
    },
    applications: []
  };

  const res = validateLedger(invalidLedger);
  assert.equal(res.valid, false);
  assert.ok(res.issues.some(i => i.path === '$.targetCriteria.minSalary'));
  assert.ok(res.issues.some(i => i.path === '$.targetCriteria.preferredWorkplace'));
});
