// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { diffJobPostings } from '../src/core/diff.ts';

test('Diff: detects changes in job posting requirements and salary numbers', () => {
  const original = `
    Senior Engineer at FinTech Corp
    Requirements:
    - 5 years TypeScript experience
    - Knowledge of SQL
    Compensation: € 70.000 - 85.000
  `;

  const updated = `
    Senior Engineer at FinTech Corp
    Requirements:
    - 7 years TypeScript experience
    - Knowledge of SQL and Kafka
    - AWS Certification required
    Compensation: € 80.000 - 95.000
  `;

  const diff = diffJobPostings('fintech-01', original, updated);
  assert.equal(diff.hasChanges, true);
  assert.ok(diff.addedLines.length > 0);
  assert.ok(diff.removedLines.length > 0);

  const salaryDiff = diff.extractedDifferences.find(d => d.includes('COMPENSATION CHANGE'));
  assert.ok(salaryDiff);
  assert.ok(salaryDiff.includes('80.000 - 95.000'));
});
