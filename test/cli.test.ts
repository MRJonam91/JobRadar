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
  assert.ok(out.includes('v1.'));
});

test('CLI: comprehensive lifecycle: init, add, show, board, stage, remind, remove', () => {
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
        'official_listing',
        '--tags',
        'kubernetes,rust'
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

    const raw = JSON.parse(readFileSync(ledgerFile, 'utf-8'));
    const appId = raw.applications[0].id;

    // 4. Show
    const showOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'show', appId, '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(showOut.includes('Application Card: Acme Inc — Platform Engineer'));
    assert.ok(showOut.includes('official_listing'));

    // 5. Stage add
    execFileSync(
      process.execPath,
      [
        CLI_PATH,
        'stage',
        'add',
        appId,
        '--name',
        'Technical Screen',
        '--date',
        '2026-11-20',
        '--file',
        ledgerFile
      ],
      { encoding: 'utf-8' }
    );

    // 6. Board
    const boardOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'board', '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(boardOut.includes('📌 JobRadar Kanban Board'));
    assert.ok(boardOut.includes('Acme Inc'));

    // 7. Remind add
    execFileSync(
      process.execPath,
      [
        CLI_PATH,
        'remind',
        'add',
        appId,
        '--date',
        '2026-11-19',
        '--reason',
        'Review company architecture',
        '--file',
        ledgerFile
      ],
      { encoding: 'utf-8' }
    );

    // 8. Doctor
    const doctorOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'doctor', '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(doctorOut.includes('passed without errors'));

    // 9. Remove
    const removeOut = execFileSync(
      process.execPath,
      [CLI_PATH, 'remove', appId, '--file', ledgerFile],
      { encoding: 'utf-8' }
    );
    assert.ok(removeOut.includes('Removed application'));

    const emptyRaw = JSON.parse(readFileSync(ledgerFile, 'utf-8'));
    assert.equal(emptyRaw.applications.length, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
