// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobRadarLedger } from '../core/types.ts';

function escapeCsvField(val: unknown): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportLedgerToCsv(ledger: JobRadarLedger): string {
  const headers = [
    'ID',
    'Company',
    'Role',
    'Workplace',
    'Location',
    'Status',
    'DiscoveredAt',
    'AppliedAt',
    'LastInteractionAt',
    'OfferDeadline',
    'SalaryMin',
    'SalaryMax',
    'SalaryCurrency',
    'SalaryPeriod',
    'SalarySource',
    'CvVersion',
    'Url',
    'Tags',
    'Notes'
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(',')];

  for (const app of ledger.applications) {
    const row = [
      escapeCsvField(app.id),
      escapeCsvField(app.company),
      escapeCsvField(app.role),
      escapeCsvField(app.workplace),
      escapeCsvField(app.location || ''),
      escapeCsvField(app.status),
      escapeCsvField(app.dates.discoveredAt),
      escapeCsvField(app.dates.appliedAt || ''),
      escapeCsvField(app.dates.lastInteractionAt),
      escapeCsvField(app.dates.offerDeadline || ''),
      escapeCsvField(app.salary?.min ?? ''),
      escapeCsvField(app.salary?.max ?? ''),
      escapeCsvField(app.salary?.currency ?? ''),
      escapeCsvField(app.salary?.period ?? ''),
      escapeCsvField(app.salary?.source ?? ''),
      escapeCsvField(app.cv?.versionId ?? ''),
      escapeCsvField(app.url || ''),
      escapeCsvField(app.tags.join(';')),
      escapeCsvField(app.notes || '')
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n') + '\n';
}
