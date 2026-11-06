// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import {
  DEFAULT_STALE_DAYS_THRESHOLD,
  DEFAULT_GHOSTED_DAYS_THRESHOLD
} from './constants.ts';
import type { JobApplication, ReminderAlert } from './types.ts';

function parseDateOnly(str: string): Date {
  const [y, m, d] = str.slice(0, 10).split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

function diffInCalendarDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / msPerDay);
}

export function detectApplicationReminders(
  applications: JobApplication[],
  options?: {
    referenceDate?: string;
    staleThresholdDays?: number;
    ghostedThresholdDays?: number;
  }
): ReminderAlert[] {
  const refDate = options?.referenceDate
    ? parseDateOnly(options.referenceDate)
    : new Date();

  const staleThreshold = options?.staleThresholdDays ?? DEFAULT_STALE_DAYS_THRESHOLD;
  const ghostedThreshold = options?.ghostedThresholdDays ?? DEFAULT_GHOSTED_DAYS_THRESHOLD;

  const alerts: ReminderAlert[] = [];

  for (const app of applications) {
    // 1. Check manual reminders
    for (const rem of app.reminders || []) {
      if (!rem.completed) {
        const dueDate = parseDateOnly(rem.dueDate);
        const daysDiff = diffInCalendarDays(dueDate, refDate); // positive if refDate > dueDate (overdue)
        const isOverdue = daysDiff > 0;

        alerts.push({
          applicationId: app.id,
          company: app.company,
          role: app.role,
          status: app.status,
          type: 'manual_reminder',
          dueDate: rem.dueDate.slice(0, 10),
          details: rem.reason,
          daysDiff: Math.abs(daysDiff),
          isOverdue
        });
      }
    }

    // 2. Offer deadline check
    if (app.status === 'offer_received' && app.dates.offerDeadline) {
      const deadlineDate = parseDateOnly(app.dates.offerDeadline);
      const daysUntil = diffInCalendarDays(refDate, deadlineDate); // positive if deadline in future
      const isOverdue = daysUntil < 0;

      alerts.push({
        applicationId: app.id,
        company: app.company,
        role: app.role,
        status: app.status,
        type: 'offer_deadline',
        dueDate: app.dates.offerDeadline.slice(0, 10),
        details: isOverdue
          ? `Offer expired ${Math.abs(daysUntil)} days ago`
          : `Decision required within ${daysUntil} days`,
        daysDiff: Math.abs(daysUntil),
        isOverdue
      });
    }

    // 3. Upcoming interview stages
    for (const st of app.stages || []) {
      if (st.result === 'pending' || !st.result) {
        const stageDate = parseDateOnly(st.date);
        const daysUntil = diffInCalendarDays(refDate, stageDate);
        if (daysUntil >= 0 && daysUntil <= 7) {
          alerts.push({
            applicationId: app.id,
            company: app.company,
            role: app.role,
            status: app.status,
            type: 'upcoming_interview',
            dueDate: st.date.slice(0, 10),
            details: `Interview: ${st.name} ${st.interviewer ? `with ${st.interviewer}` : ''}`.trim(),
            daysDiff: daysUntil,
            isOverdue: false
          });
        }
      }
    }

    // 4. Stale application follow-up check (for active non-closed applications)
    const activeStatuses = ['applied', 'screening', 'interviewing'];
    if (activeStatuses.includes(app.status)) {
      const lastInt = parseDateOnly(app.dates.lastInteractionAt);
      const inactiveDays = diffInCalendarDays(lastInt, refDate);

      // Check if there are future planned stages
      const hasFutureStage = (app.stages || []).some(s => {
        const sd = parseDateOnly(s.date);
        return diffInCalendarDays(refDate, sd) >= 0;
      });

      if (!hasFutureStage && inactiveDays >= staleThreshold) {
        const isGhostCandidate = inactiveDays >= ghostedThreshold;
        alerts.push({
          applicationId: app.id,
          company: app.company,
          role: app.role,
          status: app.status,
          type: 'stale_application',
          dueDate: app.dates.lastInteractionAt.slice(0, 10),
          details: isGhostCandidate
            ? `No response for ${inactiveDays} days (suggest marking as ghosted)`
            : `No update for ${inactiveDays} days: recommended follow-up with recruiter`,
          daysDiff: inactiveDays,
          isOverdue: true
        });
      }
    }
  }

  // Sort: overdues first, then by date
  return alerts.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}
