// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSkillGap, type MinimalCareerProfile } from '../src/core/matcher.ts';
import type { JobApplication } from '../src/core/types.ts';

test('Matcher: accurately computes verified skill matches and missing gaps', () => {
  const application: JobApplication = {
    id: 'app-match',
    company: 'Kubernetes Inc',
    role: 'Cloud Native Architect',
    workplace: 'remote',
    status: 'discovered',
    dates: { discoveredAt: '2026-11-01', lastInteractionAt: '2026-11-01' },
    stages: [],
    reminders: [],
    tags: ['kubernetes', 'typescript', 'rust', 'elixir']
  };

  const careerProfile: MinimalCareerProfile = {
    skills: [
      { name: 'TypeScript', category: 'languages', lastUsed: '2026' },
      { name: 'Kubernetes', category: 'cloud', lastUsed: '2026' },
      { name: 'Docker', category: 'containers' }
    ]
  };

  const res = computeSkillGap(application, careerProfile);

  assert.equal(res.totalRequiredTags, 4);
  assert.equal(res.matchedCount, 2);
  assert.equal(res.gapCount, 2);
  assert.equal(res.matchPercentage, 50);

  const matchedNames = res.matched.map(m => m.tag.toLowerCase());
  assert.ok(matchedNames.includes('kubernetes'));
  assert.ok(matchedNames.includes('typescript'));

  assert.ok(res.gaps.includes('rust'));
  assert.ok(res.gaps.includes('elixir'));
});
