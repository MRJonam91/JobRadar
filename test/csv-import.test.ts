// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyLedger, importFromCsv } from '../src/core/ledger.ts';
import { exportLedgerToCsv } from '../src/exporters/csv.ts';

test('CSV Import: round-trip export then import into ledger', () => {
  const ledger = createEmptyLedger();

  const csvData = [
    '"ID","Company","Role","Workplace","Location","Status","DiscoveredAt","AppliedAt","LastInteractionAt","OfferDeadline","SalaryMin","SalaryMax","SalaryCurrency","SalaryPeriod","SalarySource","CvVersion","Url","Tags","Notes"',
    '"test-1","Acme Systems","Senior Engineer","remote","","applied","2026-11-01","2026-11-02","2026-11-02","","90000","110000","EUR","year","public_post","v1","","typescript;node","great team"',
    '"test-2","Beta Labs","Data Architect","hybrid","Rome","discovered","2026-11-03","","2026-11-03","","","","","","","","","python;sql",""'
  ].join('\n');

  const res = importFromCsv(ledger, csvData);
  assert.equal(res.imported, 2);
  assert.equal(res.errors.length, 0);
  assert.equal(ledger.applications.length, 2);

  const exportedAgain = exportLedgerToCsv(ledger);
  assert.ok(exportedAgain.includes('"Acme Systems"'));
  assert.ok(exportedAgain.includes('"Beta Labs"'));
});
