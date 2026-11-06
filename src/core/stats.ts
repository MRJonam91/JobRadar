// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import { VALID_STATUSES } from './constants.ts';
import type { JobApplication, ApplicationStatus, PipelineStats } from './types.ts';

export function computePipelineStats(
  applications: JobApplication[],
  staleCount: number = 0
): PipelineStats {
  const byStatus = {} as Record<ApplicationStatus, number>;
  for (const s of VALID_STATUSES) {
    byStatus[s] = 0;
  }

  let totalAppliedOrBeyond = 0;
  let reachedScreening = 0;
  let reachedInterview = 0;
  let reachedOffer = 0;

  for (const app of applications) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;

    if (app.status !== 'discovered') {
      totalAppliedOrBeyond++;
    }

    const hasScreening =
      ['screening', 'interviewing', 'offer_received', 'accepted'].includes(app.status) ||
      (app.stages && app.stages.some(s => s.type === 'screening' || s.result === 'passed'));

    const hasInterview =
      ['interviewing', 'offer_received', 'accepted'].includes(app.status) ||
      (app.stages && app.stages.some(s => ['technical', 'system_design', 'cultural_fit', 'hiring_manager'].includes(s.type || '')));

    const hasOffer = ['offer_received', 'accepted'].includes(app.status);

    if (hasScreening) reachedScreening++;
    if (hasInterview) reachedInterview++;
    if (hasOffer) reachedOffer++;
  }

  const activeCount =
    byStatus.discovered +
    byStatus.applied +
    byStatus.screening +
    byStatus.interviewing +
    byStatus.offer_received;

  const closedCount =
    byStatus.accepted +
    byStatus.rejected +
    byStatus.withdrawn +
    byStatus.ghosted;

  const responseRatePercent = totalAppliedOrBeyond > 0
    ? Math.round((reachedScreening / totalAppliedOrBeyond) * 100)
    : 0;

  const interviewRatePercent = totalAppliedOrBeyond > 0
    ? Math.round((reachedInterview / totalAppliedOrBeyond) * 100)
    : 0;

  const offerRatePercent = totalAppliedOrBeyond > 0
    ? Math.round((reachedOffer / totalAppliedOrBeyond) * 100)
    : 0;

  return {
    total: applications.length,
    byStatus,
    activeCount,
    closedCount,
    staleCount,
    responseRatePercent,
    interviewRatePercent,
    offerRatePercent
  };
}
