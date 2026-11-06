// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const CLI_PATH = resolve(process.cwd(), 'dist/cli/index.js');

test('CLI: --version outputs version', () => {
  const out = execFileSync(process.execPath, [CLI_PATH, '--version'], {
    encoding: 'utf-8'
  });
  assert.ok(out.includes('v1.0.0'));
});

test('CLI: init, add, list, status and doctor flow', () => {
  const tmp = mkdtempSync(resolve(tmpdir(), 'jobradar-cli-test-'));
  const ledgerFile = resolve(tmp, 'test-ledger.json');

  try {
    // 1. Init
    execFileSync(process.execPath, [CLI_PATH, 'init', '--file', ledgerFile], {
      encoding: 'utf-8'
    });
    assert.ok(existsSync(ledgerFile));

    // 2. Add
    execFileSync(
      process.execPath,
      [
        CLI_PATH,
        'add',
        '--file',
        ledgerFile,
        '--company',
        'Acme Inc',
        '--role',
        'Platform Engineer',
        '--status',
        'applied',
        '--salary-min',
        '90000',
        '--salary-max',
        '105000',
        '--salary-source',
        'official_listing'
      ],
      { encoding: 'utf-8' }
    );

    // 3. List
    const listOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'list', '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(listOut.includes('Acme Inc'));
    assert.ok(listOut.includes('Platform Engineer'));

    // 4. Status update
    const raw = JSON.parse(readFileSync(ledgerFile, 'utf-8'));
    const appId = raw.applications[0].id;

    execFileSync(
      process.execPath,
      [CLI_PATH, 'status', appId, 'interviewing', '--file', ledgerFile, '--notes', 'Passed screening call'],
      { encoding: 'utf-8' }
    );

    const updatedRaw = JSON.parse(readFileSync(ledgerFile, 'utf-8'));
    assert.equal(updatedRaw.applications[0].status, 'interviewing');
    assert.ok(updatedRaw.applications[0].notes.includes('Passed screening call'));

    // 5. Doctor
    const doctorOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'doctor', '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(doctorOut.includes('passed without errors'));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
