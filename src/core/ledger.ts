// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { JR_VERSION, VALID_STATUSES, VALID_WORKPLACE_TYPES } from './constants.ts';
import type {
  JobRadarLedger,
  JobApplication,
  ApplicationStatus,
  WorkplaceType,
  InterviewStage,
  FollowUpReminder
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

export function findApplication(ledger: JobRadarLedger, idOrPattern: string): JobApplication | undefined {
  const lower = idOrPattern.toLowerCase();
  return ledger.applications.find(
    a => a.id.toLowerCase() === lower || a.id.toLowerCase().includes(lower) || a.company.toLowerCase().includes(lower)
  );
}

export function removeApplication(ledger: JobRadarLedger, idOrPattern: string): boolean {
  const app = findApplication(ledger, idOrPattern);
  if (!app) return false;
  const idx = ledger.applications.findIndex(a => a.id === app.id);
  if (idx !== -1) {
    ledger.applications.splice(idx, 1);
    return true;
  }
  return false;
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
  const app = findApplication(ledger, appId);
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

export function addStage(
  ledger: JobRadarLedger,
  appId: string,
  stage: {
    name: string;
    date: string;
    type?: InterviewStage['type'];
    interviewer?: string;
    notes?: string;
  }
): InterviewStage {
  const app = findApplication(ledger, appId);
  if (!app) {
    throw new Error(`Application "${appId}" not found`);
  }

  const randId = `st-${randomBytes(2).toString('hex')}`;
  const newStage: InterviewStage = {
    id: randId,
    name: stage.name.trim(),
    date: stage.date.trim(),
    type: stage.type || 'technical',
    interviewer: stage.interviewer?.trim(),
    notes: stage.notes?.trim(),
    result: 'pending'
  };

  if (!app.stages) app.stages = [];
  app.stages.push(newStage);

  // Auto transition to interviewing if applied/screening
  if (app.status === 'applied' || app.status === 'screening' || app.status === 'discovered') {
    app.status = 'interviewing';
  }
  app.dates.lastInteractionAt = new Date().toISOString().slice(0, 10);

  return newStage;
}

export function updateStageResult(
  ledger: JobRadarLedger,
  appId: string,
  stageId: string,
  result: 'passed' | 'pending' | 'failed',
  notes?: string
): InterviewStage {
  const app = findApplication(ledger, appId);
  if (!app) {
    throw new Error(`Application "${appId}" not found`);
  }

  const stage = (app.stages || []).find(
    s => s.id === stageId || s.name.toLowerCase().includes(stageId.toLowerCase())
  );
  if (!stage) {
    throw new Error(`Stage "${stageId}" not found in application "${app.id}"`);
  }

  stage.result = result;
  if (notes) {
    stage.notes = stage.notes ? `${stage.notes} | ${notes}` : notes;
  }
  app.dates.lastInteractionAt = new Date().toISOString().slice(0, 10);

  return stage;
}

export function addManualReminder(
  ledger: JobRadarLedger,
  appId: string,
  dueDate: string,
  reason: string
): FollowUpReminder {
  const app = findApplication(ledger, appId);
  if (!app) {
    throw new Error(`Application "${appId}" not found`);
  }

  const randId = `rem-${randomBytes(2).toString('hex')}`;
  const rem: FollowUpReminder = {
    id: randId,
    dueDate: dueDate.slice(0, 10),
    reason: reason.trim(),
    completed: false
  };

  if (!app.reminders) app.reminders = [];
  app.reminders.push(rem);

  return rem;
}

export function completeReminder(
  ledger: JobRadarLedger,
  appId: string,
  reminderId: string
): FollowUpReminder {
  const app = findApplication(ledger, appId);
  if (!app) {
    throw new Error(`Application "${appId}" not found`);
  }

  const rem = (app.reminders || []).find(
    r => r.id === reminderId || r.reason.toLowerCase().includes(reminderId.toLowerCase())
  );
  if (!rem) {
    throw new Error(`Reminder "${reminderId}" not found in application "${app.id}"`);
  }

  rem.completed = true;
  rem.completedAt = new Date().toISOString().slice(0, 10);
  app.dates.lastInteractionAt = rem.completedAt;

  return rem;
}

export function importFromCsv(
  ledger: JobRadarLedger,
  csvContent: string
): { imported: number; errors: string[] } {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { imported: 0, errors: ['CSV has no data rows'] };
  }

  let imported = 0;
  const errors: string[] = [];

  // Parse header
  const headerLine = lines[0]!;
  const headers = headerLine.split(',').map(h => h.replace(/^"|"$/g, '').trim());

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]!;
    // Basic CSV regex parser supporting quoted values
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const values: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawLine)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2] ?? '';
      values.push(val);
      if (values.length > headers.length + 5) break;
    }

    const row: Record<string, string> = {};
    headers.forEach((h, hIdx) => {
      row[h] = values[hIdx] ?? '';
    });

    const company = row.Company || row.company;
    const role = row.Role || row.role;

    if (!company || !role) {
      errors.push(`Row ${i + 1}: Missing Company or Role`);
      continue;
    }

    const wp = (row.Workplace || row.workplace || 'remote') as WorkplaceType;
    const st = (row.Status || row.status || 'discovered') as ApplicationStatus;
    const sMin = row.SalaryMin ? Number(row.SalaryMin) : undefined;
    const sMax = row.SalaryMax ? Number(row.SalaryMax) : undefined;
    const sSource = row.SalarySource || 'csv_import';

    try {
      addApplication(ledger, {
        company,
        role,
        workplace: VALID_WORKPLACE_TYPES.includes(wp) ? wp : 'remote',
        status: VALID_STATUSES.includes(st) ? st : 'discovered',
        location: row.Location || undefined,
        url: row.Url || undefined,
        cvVersion: row.CvVersion || undefined,
        notes: row.Notes || undefined,
        tags: row.Tags ? row.Tags.split(';').map(t => t.trim()) : [],
        salaryMin: sMin,
        salaryMax: sMax,
        salarySource: (sMin || sMax) ? sSource : undefined
      });
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { imported, errors };
}
