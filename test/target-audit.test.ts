// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { auditApplicationTargetFit } from '../src/core/target-audit.ts';
import type { JobApplication, TargetCriteria } from '../src/core/types.ts';

test('Target Audit: passes when compensation and remote workplace align with target criteria', () => {
  const app: JobApplication = {
    id: 'app-target-ok',
    company: 'Prime Cloud',
    role: 'Principal SRE',
    workplace: 'remote',
    status: 'discovered',
    dates: { discoveredAt: '2026-11-01', lastInteractionAt: '2026-11-01' },
    salary: {
      currency: 'EUR',
      min: 100000,
      max: 120000,
      period: 'year',
      source: 'public_job_listing'
    },
    stages: [],
    reminders: [],
    tags: []
  };

  const criteria: TargetCriteria = {
    minSalary: 95000,
    preferredWorkplace: ['remote'],
    targetRoles: ['SRE', 'Principal'],
    blacklistedCompanies: ['BadCompany']
  };

  const res = auditApplicationTargetFit(app, criteria);
  assert.equal(res.overallFit, true);
  assert.equal(res.failureCount, 0);
  assert.equal(res.passedCount, 4);
});

test('Target Audit: detects violations (blacklisted company or below salary target)', () => {
  const app: JobApplication = {
    id: 'app-target-fail',
    company: 'BadCompany Ltd',
    role: 'Junior Dev',
    workplace: 'onsite',
    status: 'discovered',
    dates: { discoveredAt: '2026-11-01', lastInteractionAt: '2026-11-01' },
    salary: {
      currency: 'EUR',
      min: 30000,
      max: 35000,
      period: 'year',
      source: 'hr_call'
    },
    stages: [],
    reminders: [],
    tags: []
  };

  const criteria: TargetCriteria = {
    minSalary: 80000,
    preferredWorkplace: ['remote'],
    blacklistedCompanies: ['BadCompany']
  };

  const res = auditApplicationTargetFit(app, criteria);
  assert.equal(res.overallFit, false);
  assert.ok(res.failureCount >= 2);
  const blacklistCheck = res.checks.find(c => c.rule === 'Company Blacklist');
  assert.equal(blacklistCheck?.severity, 'fail');
});
