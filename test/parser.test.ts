// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJobPostingText } from '../src/core/parser.ts';

test('Parser: extracts metadata from raw HTML job posting with OpenGraph tags', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="Senior Platform SRE - Stripe" />
        <meta property="og:site_name" content="Stripe Careers" />
      </head>
      <body>
        <h1>Senior Platform SRE</h1>
        <p>We are looking for a full remote engineer to scale our global infrastructure.</p>
        <p>Compensation: € 95.000 - 120.000 per year plus equity.</p>
        <p>Required skills: Kubernetes, Docker, Go, and Terraform.</p>
      </body>
    </html>
  `;

  const parsed = parseJobPostingText(html, 'https://stripe.com/jobs/platform-sre');

  assert.equal(parsed.role, 'Senior Platform SRE');
  assert.equal(parsed.company, 'Stripe');
  assert.equal(parsed.workplace, 'remote');
  assert.ok(parsed.salary);
  assert.equal(parsed.salary.currency, 'EUR');
  assert.equal(parsed.salary.min, 95000);
  assert.equal(parsed.salary.max, 120000);
  assert.equal(parsed.salary.source, 'extracted_from_posting_text');

  assert.ok(parsed.extractedTags.includes('kubernetes'));
  assert.ok(parsed.extractedTags.includes('docker'));
  assert.ok(parsed.extractedTags.includes('go'));
  assert.ok(parsed.extractedTags.includes('terraform'));
});

test('Parser: extracts metadata from plain text with $k salary pattern', () => {
  const text = `
    Staff Distributed Engineer at Acme Corp
    Location: 100% remote across US and EU.
    Target Salary Range: $130k - $160k.
    Stack: Rust, Python, PostgreSQL, Kafka, Linux.
  `;

  const parsed = parseJobPostingText(text);

  assert.equal(parsed.role, 'Staff Distributed Engineer');
  assert.equal(parsed.company, 'Acme Corp');
  assert.equal(parsed.workplace, 'remote');
  assert.ok(parsed.salary);
  assert.equal(parsed.salary.currency, 'USD');
  assert.equal(parsed.salary.min, 130000);
  assert.equal(parsed.salary.max, 160000);

  assert.ok(parsed.extractedTags.includes('rust'));
  assert.ok(parsed.extractedTags.includes('python'));
  assert.ok(parsed.extractedTags.includes('kafka'));
  assert.ok(parsed.extractedTags.includes('linux'));
});
