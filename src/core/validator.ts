// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import {
  VALID_STATUSES,
  VALID_WORKPLACE_TYPES,
  VALID_SALARY_PERIODS,
  JR_ERROR_VERIFICATION_FAILED
} from './constants.ts';
import type {
  JobRadarLedger,
  JobApplication,
  LedgerValidationIssue,
  LedgerValidationResult
} from './types.ts';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function isValidDateString(val: unknown): boolean {
  if (typeof val !== 'string' || !DATE_REGEX.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

export function validateLedger(ledger: unknown): LedgerValidationResult {
  const issues: LedgerValidationIssue[] = [];

  if (!ledger || typeof ledger !== 'object') {
    return {
      valid: false,
      issues: [{ path: '$', message: 'Ledger must be a non-null object', severity: 'error' }]
    };
  }

  const l = ledger as Partial<JobRadarLedger>;

  if (!Array.isArray(l.applications)) {
    return {
      valid: false,
      issues: [{ path: '$.applications', message: 'applications must be an array', severity: 'error' }]
    };
  }

  const seenIds = new Set<string>();

  l.applications.forEach((app, idx) => {
    const p = `$.applications[${idx}]`;

    if (!app || typeof app !== 'object') {
      issues.push({ path: p, message: 'Application must be an object', severity: 'error' });
      return;
    }

    // id
    if (!app.id || typeof app.id !== 'string' || app.id.trim() === '') {
      issues.push({ path: `${p}.id`, message: 'Application ID is required and must be non-empty', severity: 'error' });
    } else {
      if (seenIds.has(app.id)) {
        issues.push({ path: `${p}.id`, message: `Duplicate application ID "${app.id}"`, severity: 'error' });
      }
      seenIds.add(app.id);
    }

    // company & role
    if (!app.company || typeof app.company !== 'string' || app.company.trim() === '') {
      issues.push({ path: `${p}.company`, message: 'Company name is required', severity: 'error' });
    }
    if (!app.role || typeof app.role !== 'string' || app.role.trim() === '') {
      issues.push({ path: `${p}.role`, message: 'Role title is required', severity: 'error' });
    }

    // workplace
    if (!app.workplace || !(VALID_WORKPLACE_TYPES as readonly string[]).includes(app.workplace)) {
      issues.push({
        path: `${p}.workplace`,
        message: `Workplace must be one of: ${VALID_WORKPLACE_TYPES.join(', ')}`,
        severity: 'error'
      });
    }

    // status
    if (!app.status || !(VALID_STATUSES as readonly string[]).includes(app.status)) {
      issues.push({
        path: `${p}.status`,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        severity: 'error'
      });
    }

    // dates
    if (!app.dates || typeof app.dates !== 'object') {
      issues.push({ path: `${p}.dates`, message: 'dates object is required', severity: 'error' });
    } else {
      if (!isValidDateString(app.dates.discoveredAt)) {
        issues.push({ path: `${p}.dates.discoveredAt`, message: 'discoveredAt must be a valid ISO date', severity: 'error' });
      }
      if (!isValidDateString(app.dates.lastInteractionAt)) {
        issues.push({ path: `${p}.dates.lastInteractionAt`, message: 'lastInteractionAt must be a valid ISO date', severity: 'error' });
      }

      if (app.status !== 'discovered' && app.status !== 'withdrawn') {
        if (!app.dates.appliedAt) {
          issues.push({
            path: `${p}.dates.appliedAt`,
            message: `appliedAt is required when status is "${app.status}"`,
            severity: 'error'
          });
        }
      }

      if (app.dates.appliedAt) {
        if (!isValidDateString(app.dates.appliedAt)) {
          issues.push({ path: `${p}.dates.appliedAt`, message: 'appliedAt must be a valid ISO date', severity: 'error' });
        } else if (app.dates.discoveredAt && isValidDateString(app.dates.discoveredAt)) {
          const disc = new Date(app.dates.discoveredAt.slice(0, 10)).getTime();
          const appl = new Date(app.dates.appliedAt.slice(0, 10)).getTime();
          if (appl < disc) {
            issues.push({
              path: `${p}.dates.appliedAt`,
              message: `${JR_ERROR_VERIFICATION_FAILED}: appliedAt cannot be prior to discoveredAt`,
              severity: 'error'
            });
          }
        }
      }

      if (app.dates.offerDeadline && !isValidDateString(app.dates.offerDeadline)) {
        issues.push({ path: `${p}.dates.offerDeadline`, message: 'offerDeadline must be a valid ISO date', severity: 'error' });
      }
    }

    // salary (Verifiable source constraint as mandated by seed specification)
    if (app.salary !== undefined) {
      if (typeof app.salary !== 'object' || app.salary === null) {
        issues.push({ path: `${p}.salary`, message: 'salary must be an object', severity: 'error' });
      } else {
        const hasRange = typeof app.salary.min === 'number' || typeof app.salary.max === 'number';
        if (hasRange) {
          if (!app.salary.source || typeof app.salary.source !== 'string' || app.salary.source.trim().length < 3) {
            issues.push({
              path: `${p}.salary.source`,
              message: `${JR_ERROR_VERIFICATION_FAILED}: verifiable salary source required (e.g. job_posting, recruiter_email, contract)`,
              severity: 'error'
            });
          }
          if (typeof app.salary.min === 'number' && typeof app.salary.max === 'number' && app.salary.max < app.salary.min) {
            issues.push({ path: `${p}.salary.max`, message: 'salary.max cannot be less than salary.min', severity: 'error' });
          }
        }
        if (app.salary.period && !(VALID_SALARY_PERIODS as readonly string[]).includes(app.salary.period)) {
          issues.push({
            path: `${p}.salary.period`,
            message: `salary.period must be one of: ${VALID_SALARY_PERIODS.join(', ')}`,
            severity: 'error'
          });
        }
      }
    }

    // stages
    if (app.stages !== undefined) {
      if (!Array.isArray(app.stages)) {
        issues.push({ path: `${p}.stages`, message: 'stages must be an array', severity: 'error' });
      } else {
        const stageIds = new Set<string>();
        app.stages.forEach((st, sIdx) => {
          const sp = `${p}.stages[${sIdx}]`;
          if (!st || typeof st !== 'object') {
            issues.push({ path: sp, message: 'Interview stage must be an object', severity: 'error' });
            return;
          }
          if (!st.name || typeof st.name !== 'string') {
            issues.push({ path: `${sp}.name`, message: 'Stage name is required', severity: 'error' });
          }
          if (!isValidDateString(st.date)) {
            issues.push({ path: `${sp}.date`, message: 'Stage date must be a valid ISO date', severity: 'error' });
          }
          if (st.id) {
            if (stageIds.has(st.id)) {
              issues.push({ path: `${sp}.id`, message: `Duplicate stage ID "${st.id}" in application`, severity: 'error' });
            }
            stageIds.add(st.id);
          }
        });
      }
    }

    // reminders
    if (app.reminders !== undefined) {
      if (!Array.isArray(app.reminders)) {
        issues.push({ path: `${p}.reminders`, message: 'reminders must be an array', severity: 'error' });
      } else {
        app.reminders.forEach((rem, rIdx) => {
          const rp = `${p}.reminders[${rIdx}]`;
          if (!rem || typeof rem !== 'object') {
            issues.push({ path: rp, message: 'Reminder must be an object', severity: 'error' });
            return;
          }
          if (!isValidDateString(rem.dueDate)) {
            issues.push({ path: `${rp}.dueDate`, message: 'Reminder dueDate must be a valid ISO date', severity: 'error' });
          }
          if (!rem.reason || typeof rem.reason !== 'string' || rem.reason.trim() === '') {
            issues.push({ path: `${rp}.reason`, message: 'Reminder reason is required', severity: 'error' });
          }
        });
      }
    }
  });

  // targetCriteria validation
  if (l.targetCriteria !== undefined) {
    const cp = '$.targetCriteria';
    if (!l.targetCriteria || typeof l.targetCriteria !== 'object') {
      issues.push({ path: cp, message: 'targetCriteria must be an object', severity: 'error' });
    } else {
      const tc = l.targetCriteria;
      if (tc.minSalary !== undefined && (typeof tc.minSalary !== 'number' || tc.minSalary < 0)) {
        issues.push({ path: `${cp}.minSalary`, message: 'minSalary must be a non-negative number', severity: 'error' });
      }
      if (tc.preferredWorkplace !== undefined) {
        if (!Array.isArray(tc.preferredWorkplace)) {
          issues.push({ path: `${cp}.preferredWorkplace`, message: 'preferredWorkplace must be an array', severity: 'error' });
        } else {
          for (const wp of tc.preferredWorkplace) {
            if (!(VALID_WORKPLACE_TYPES as readonly string[]).includes(wp)) {
              issues.push({
                path: `${cp}.preferredWorkplace`,
                message: `Invalid workplace "${wp}". Must be one of: ${VALID_WORKPLACE_TYPES.join(', ')}`,
                severity: 'error'
              });
            }
          }
        }
      }
    }
  }

  const errors = issues.filter(i => i.severity === 'error');
  return {
    valid: errors.length === 0,
    issues
  };
}
