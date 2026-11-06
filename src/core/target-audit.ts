// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobApplication, TargetCriteria, TargetAuditResult, TargetAuditCheck } from './types.ts';

export function auditApplicationTargetFit(
  application: JobApplication,
  criteria?: TargetCriteria
): TargetAuditResult {
  if (!criteria) {
    return {
      applicationId: application.id,
      company: application.company,
      role: application.role,
      overallFit: true,
      passedCount: 0,
      warningCount: 0,
      failureCount: 0,
      checks: [
        {
          rule: 'Target Criteria',
          passed: true,
          details: 'No target criteria configured in ledger',
          severity: 'pass'
        }
      ]
    };
  }

  const checks: TargetAuditCheck[] = [];

  // 1. Blacklisted Companies
  if (criteria.blacklistedCompanies && criteria.blacklistedCompanies.length > 0) {
    const isBlacklisted = criteria.blacklistedCompanies.some(
      b => application.company.toLowerCase().includes(b.toLowerCase())
    );
    if (isBlacklisted) {
      checks.push({
        rule: 'Company Blacklist',
        passed: false,
        details: `Company "${application.company}" is in personal blacklist`,
        severity: 'fail'
      });
    } else {
      checks.push({
        rule: 'Company Blacklist',
        passed: true,
        details: 'Company is not blacklisted',
        severity: 'pass'
      });
    }
  }

  // 2. Minimum Salary
  if (criteria.minSalary !== undefined) {
    const appMax = application.salary?.max ?? application.salary?.min;
    if (appMax === undefined) {
      checks.push({
        rule: 'Minimum Salary',
        passed: false,
        details: `Salary unstated or unverified; target is ≥ ${criteria.minSalary} ${criteria.currency || 'EUR'}`,
        severity: 'warning'
      });
    } else if (appMax < criteria.minSalary) {
      checks.push({
        rule: 'Minimum Salary',
        passed: false,
        details: `Max verified compensation (${appMax}) is below target (${criteria.minSalary})`,
        severity: 'fail'
      });
    } else {
      checks.push({
        rule: 'Minimum Salary',
        passed: true,
        details: `Verified compensation (${appMax}) meets or exceeds target (${criteria.minSalary})`,
        severity: 'pass'
      });
    }
  }

  // 3. Preferred Workplace
  if (criteria.preferredWorkplace && criteria.preferredWorkplace.length > 0) {
    const matchesWorkplace = criteria.preferredWorkplace.includes(application.workplace);
    if (matchesWorkplace) {
      checks.push({
        rule: 'Workplace Preference',
        passed: true,
        details: `Workplace "${application.workplace}" matches preferences (${criteria.preferredWorkplace.join(', ')})`,
        severity: 'pass'
      });
    } else {
      checks.push({
        rule: 'Workplace Preference',
        passed: false,
        details: `Workplace "${application.workplace}" does not match preferences (${criteria.preferredWorkplace.join(', ')})`,
        severity: 'warning'
      });
    }
  }

  // 4. Target Roles
  if (criteria.targetRoles && criteria.targetRoles.length > 0) {
    const matchesRole = criteria.targetRoles.some(
      tr => application.role.toLowerCase().includes(tr.toLowerCase()) || tr.toLowerCase().includes(application.role.toLowerCase())
    );
    if (matchesRole) {
      checks.push({
        rule: 'Role Title Match',
        passed: true,
        details: `Role "${application.role}" aligns with target roles`,
        severity: 'pass'
      });
    } else {
      checks.push({
        rule: 'Role Title Match',
        passed: false,
        details: `Role "${application.role}" is not in target list (${criteria.targetRoles.join(', ')})`,
        severity: 'warning'
      });
    }
  }

  const passedCount = checks.filter(c => c.severity === 'pass').length;
  const warningCount = checks.filter(c => c.severity === 'warning').length;
  const failureCount = checks.filter(c => c.severity === 'fail').length;

  return {
    applicationId: application.id,
    company: application.company,
    role: application.role,
    overallFit: failureCount === 0,
    passedCount,
    warningCount,
    failureCount,
    checks
  };
}
