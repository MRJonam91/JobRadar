// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { JR_VERSION, VALID_STATUSES } from './constants.ts';
import type {
  JobRadarLedger,
  JobApplication,
  ApplicationStatus,
  WorkplaceType
} from './types.ts';
import { validateLedger } from './validator.ts';

export function createEmptyLedger(ownerName?: string, ownerEmail?: string): JobRadarLedger {
  const now = new Date().toISOString();
  return {
    version: JR_VERSION,
    updatedAt: now,
    owner: ownerName || ownerEmail ? { name: ownerName, email: ownerEmail } : undefined,
    applications: []
  };
}

export function loadLedger(filePath: string): JobRadarLedger {
  if (!existsSync(filePath)) {
    throw new Error(`Ledger file not found at: ${filePath}`);
  }
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const val = validateLedger(parsed);
  if (!val.valid) {
    const msgs = val.issues.map(i => `${i.path}: ${i.message}`).join('\n');
    throw new Error(`Ledger validation failed:\n${msgs}`);
  }
  return parsed as JobRadarLedger;
}

export function saveLedger(filePath: string, ledger: JobRadarLedger): void {
  ledger.updatedAt = new Date().toISOString();
  const val = validateLedger(ledger);
  if (!val.valid) {
    const msgs = val.issues.map(i => `${i.path}: ${i.message}`).join('\n');
    throw new Error(`Cannot save invalid ledger:\n${msgs}`);
  }
  writeFileSync(filePath, JSON.stringify(ledger, null, 2) + '\n', 'utf-8');
}

export function generateApplicationId(company: string): string {
  const cleanCompany = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8) || 'job';
  const rand = randomBytes(3).toString('hex');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${cleanCompany}-${today}-${rand}`;
}

export function addApplication(
  ledger: JobRadarLedger,
  params: {
    company: string;
    role: string;
    workplace?: WorkplaceType;
    location?: string;
    url?: string;
    status?: ApplicationStatus;
    appliedAt?: string;
    cvVersion?: string;
    notes?: string;
    tags?: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryPeriod?: 'year' | 'month' | 'hour';
    salarySource?: string;
  }
): JobApplication {
  const today = new Date().toISOString().slice(0, 10);
  const status = params.status || 'discovered';
  const appliedAt = status === 'discovered' ? undefined : (params.appliedAt || today);

  let salary = undefined;
  if (params.salaryMin !== undefined || params.salaryMax !== undefined) {
    salary = {
      currency: params.salaryCurrency || 'EUR',
      min: params.salaryMin,
      max: params.salaryMax,
      period: params.salaryPeriod || 'year',
      source: params.salarySource || 'unspecified'
    };
  }

  const newApp: JobApplication = {
    id: generateApplicationId(params.company),
    company: params.company.trim(),
    role: params.role.trim(),
    url: params.url?.trim(),
    workplace: params.workplace || 'remote',
    location: params.location?.trim(),
    status,
    dates: {
      discoveredAt: today,
      appliedAt,
      lastInteractionAt: appliedAt || today
    },
    salary,
    cv: params.cvVersion
      ? { versionId: params.cvVersion.trim() }
      : undefined,
    stages: [],
    reminders: [],
    tags: params.tags || [],
    notes: params.notes?.trim()
  };

  ledger.applications.push(newApp);
  return newApp;
}

export function updateApplicationStatus(
  ledger: JobRadarLedger,
  appId: string,
  newStatus: ApplicationStatus,
  notes?: string
): JobApplication {
  const app = ledger.applications.find(
    a => a.id === appId || a.id.toLowerCase().includes(appId.toLowerCase())
  );
  if (!app) {
    throw new Error(`Application with ID or substring "${appId}" not found`);
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  app.status = newStatus;
  app.dates.lastInteractionAt = today;

  if (newStatus !== 'discovered' && !app.dates.appliedAt) {
    app.dates.appliedAt = today;
  }

  if (notes) {
    app.notes = app.notes ? `${app.notes}\n[${today}] ${notes}` : `[${today}] ${notes}`;
  }

  return app;
}
