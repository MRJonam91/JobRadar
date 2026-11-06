// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const CLI_PATH = resolve(process.cwd(), 'dist/cli/index.js');

test('CLI: --version outputs version', () => {
  const out = execFileSync(process.execPath, [CLI_PATH, '--version'], {
    encoding: 'utf-8'
  });
  assert.ok(out.includes('v1.'));
});

test('CLI: comprehensive lifecycle: init, parse, add from-file, audit, diff, export html, remove', () => {
  const tmp = mkdtempSync(resolve(tmpdir(), 'jobradar-beta-cli-test-'));
  const ledgerFile = resolve(tmp, 'test-ledger.json');
  const postingFile = resolve(tmp, 'posting.txt');
  const updatedPostingFile = resolve(tmp, 'posting-updated.txt');
  const htmlExportFile = resolve(tmp, 'report.html');

  try {
    // 1. Init
    execFileSync(process.execPath, [CLI_PATH, 'init', '--file', ledgerFile], {
      encoding: 'utf-8'
    });
    assert.ok(existsSync(ledgerFile));

    // Setup raw posting file
    writeFileSync(
      postingFile,
      `Staff Platform Engineer at CloudScale Inc
Location: 100% remote across EU.
Salary: € 95.000 - 115.000 per year.
Stack: Kubernetes, TypeScript, Go, Docker, Terraform.`,
      'utf-8'
    );

    // 2. Parse
    const parseOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'parse', '--file', postingFile],
      { encoding: 'utf-8' }
    );
    assert.ok(parseOut.includes('CloudScale Inc'));
    assert.ok(parseOut.includes('Staff Platform Engineer'));
    assert.ok(parseOut.includes('95000-115000'));

    // 3. Add via --from-file
    execFileSync(
      process.execPath,
      [CLI_PATH, 'add', '--from-file', postingFile, '--file', ledgerFile, '--status', 'applied'],
      { encoding: 'utf-8' }
    );

    const raw = JSON.parse(readFileSync(ledgerFile, 'utf-8'));
    assert.equal(raw.applications.length, 1);
    const app = raw.applications[0];
    assert.equal(app.company, 'CloudScale Inc');
    assert.equal(app.workplace, 'remote');
    assert.ok(app.rawPosting.includes('CloudScale Inc'));

    // 4. Criteria & Audit
    execFileSync(
      process.execPath,
      [CLI_PATH, 'criteria', '--min-salary', '90000', '--workplace', 'remote', '--file', ledgerFile],
      { encoding: 'utf-8' }
    );

    const auditOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'audit', app.id, '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(auditOut.includes('Target Criteria Audit'));
    assert.ok(auditOut.includes('COMPLIANT'));

    // Filter by tag
    const listTagOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'list', '--tag', 'kubernetes', '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(listTagOut.includes('CloudScale Inc'));

    // 5. Diff against updated posting
    writeFileSync(
      updatedPostingFile,
      `Staff Platform Engineer at CloudScale Inc
Location: 100% remote across EU.
Salary: € 105.000 - 125.000 per year.
Requirements: 7+ years in distributed systems.
Stack: Kubernetes, TypeScript, Go, Docker, Terraform, Kafka.`,
      'utf-8'
    );

    const diffOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'diff', app.id, '--file', updatedPostingFile, '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(diffOut.includes('Job Git Diff'));
    assert.ok(diffOut.includes('COMPENSATION CHANGE'));

    // 6. Export HTML
    execFileSync(
      process.execPath,
      [CLI_PATH, 'export', '--format', 'html', '--out', htmlExportFile, '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(existsSync(htmlExportFile));
    const htmlContent = readFileSync(htmlExportFile, 'utf-8');
    assert.ok(htmlContent.includes('CloudScale Inc'));
    assert.ok(htmlContent.includes('Kanban Pipeline'));

    // 7. Remove
    execFileSync(
      process.execPath,
      [CLI_PATH, 'remove', app.id, '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    const finalRaw = JSON.parse(readFileSync(ledgerFile, 'utf-8'));
    assert.equal(finalRaw.applications.length, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
