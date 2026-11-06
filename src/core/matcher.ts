// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobApplication } from './types.ts';

export interface CareerSkill {
  name: string;
  category?: string;
  level?: string;
  lastUsed?: string;
}

export interface MinimalCareerProfile {
  basics?: {
    name?: string;
    label?: string | Record<string, string>;
  };
  skills?: CareerSkill[];
}

export interface SkillMatchReport {
  applicationId: string;
  company: string;
  role: string;
  totalRequiredTags: number;
  matchedCount: number;
  gapCount: number;
  matchPercentage: number;
  matched: Array<{ tag: string; skillName: string; category?: string; lastUsed?: string }>;
  gaps: string[];
}

export function computeSkillGap(
  application: JobApplication,
  careerProfile: MinimalCareerProfile
): SkillMatchReport {
  const profileSkills = Array.isArray(careerProfile.skills) ? careerProfile.skills : [];
  const applicationTags = application.tags || [];

  const matched: SkillMatchReport['matched'] = [];
  const gaps: string[] = [];

  for (const tag of applicationTags) {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) continue;

    const foundSkill = profileSkills.find(s => {
      const sName = s.name.trim().toLowerCase();
      return sName === cleanTag || sName.includes(cleanTag) || cleanTag.includes(sName);
    });

    if (foundSkill) {
      matched.push({
        tag,
        skillName: foundSkill.name,
        category: foundSkill.category,
        lastUsed: foundSkill.lastUsed
      });
    } else {
      gaps.push(tag);
    }
  }

  const total = matched.length + gaps.length;
  const matchPercentage = total > 0 ? Math.round((matched.length / total) * 100) : 100;

  return {
    applicationId: application.id,
    company: application.company,
    role: application.role,
    totalRequiredTags: total,
    matchedCount: matched.length,
    gapCount: gaps.length,
    matchPercentage,
    matched,
    gaps
  };
}
