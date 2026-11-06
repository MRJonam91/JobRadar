// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type {
  VALID_STATUSES,
  VALID_WORKPLACE_TYPES,
  VALID_SALARY_PERIODS
} from './constants.ts';

export type ApplicationStatus = (typeof VALID_STATUSES)[number];
export type WorkplaceType = (typeof VALID_WORKPLACE_TYPES)[number];
export type SalaryPeriod = (typeof VALID_SALARY_PERIODS)[number];

export interface SalarySpec {
  currency: string;
  min?: number;
  max?: number;
  period: SalaryPeriod;
  source: string; // Verifiable source is mandatory if salary is supplied
}

export interface InterviewStage {
  id: string;
  name: string;
  date: string; // ISO 8601 YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  type?:
    | 'screening'
    | 'technical'
    | 'system_design'
    | 'take_home'
    | 'hiring_manager'
    | 'cultural_fit'
    | 'offer_negotiation'
    | 'other';
  interviewer?: string;
  notes?: string;
  result?: 'passed' | 'pending' | 'failed';
}

export interface FollowUpReminder {
  id: string;
  dueDate: string; // YYYY-MM-DD
  reason: string;
  completed?: boolean;
  completedAt?: string;
}

export interface CvReference {
  versionId: string;
  notes?: string;
  fileOrUrl?: string;
}

export interface JobApplicationDates {
  discoveredAt: string; // YYYY-MM-DD
  appliedAt?: string; // YYYY-MM-DD
  lastInteractionAt: string; // YYYY-MM-DD
  offerDeadline?: string; // YYYY-MM-DD
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  url?: string;
  workplace: WorkplaceType;
  location?: string;
  status: ApplicationStatus;
  dates: JobApplicationDates;
  salary?: SalarySpec;
  cv?: CvReference;
  stages: InterviewStage[];
  reminders: FollowUpReminder[];
  tags: string[];
  notes?: string;
}

export interface JobRadarLedger {
  version: string;
  updatedAt: string;
  owner?: {
    name?: string;
    email?: string;
  };
  applications: JobApplication[];
}

export interface LedgerValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LedgerValidationResult {
  valid: boolean;
  issues: LedgerValidationIssue[];
}

export interface ReminderAlert {
  applicationId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  type: 'manual_reminder' | 'stale_application' | 'upcoming_interview' | 'offer_deadline';
  dueDate: string;
  details: string;
  daysDiff: number; // positive = overdue or due in N days
  isOverdue: boolean;
}

export interface PipelineStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  activeCount: number;
  closedCount: number;
  staleCount: number;
  responseRatePercent: number; // percentage of applied that reached >= screening
  interviewRatePercent: number; // percentage of applied that reached >= interviewing
  offerRatePercent: number; // percentage of applied that reached offer_received
}
