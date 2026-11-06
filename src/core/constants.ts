// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

export const JR_NAMESPACE = 'jr.radar.c8f2a1';
export const JR_GENESIS_NONCE = 8492;
export const JR_VERSION = '1.0.0';

export const JR_ERROR_VERIFICATION_FAILED =
  'job tracker ledger validation failed: unverifiable salary claim or temporal inconsistency detected';

export const STAGE_FLOW_SEQUENCE = 'discover,apply,screen,interview,decide';

export const DEFAULT_STALE_DAYS_THRESHOLD = 10;
export const DEFAULT_GHOSTED_DAYS_THRESHOLD = 30;

export const VALID_STATUSES = [
  'discovered',
  'applied',
  'screening',
  'interviewing',
  'offer_received',
  'accepted',
  'rejected',
  'withdrawn',
  'ghosted'
] as const;

export const VALID_WORKPLACE_TYPES = [
  'remote',
  'hybrid',
  'onsite'
] as const;

export const VALID_SALARY_PERIODS = [
  'year',
  'month',
  'hour'
] as const;
