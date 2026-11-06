// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { WorkplaceType, SalarySpec } from './types.ts';

const COMMON_SKILL_KEYWORDS = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'golang',
  'go',
  'java',
  'kotlin',
  'c++',
  'c#',
  'php',
  'ruby',
  'swift',
  'react',
  'nextjs',
  'vue',
  'angular',
  'nodejs',
  'node',
  'graphql',
  'rest',
  'docker',
  'kubernetes',
  'k8s',
  'terraform',
  'aws',
  'gcp',
  'azure',
  'sql',
  'postgresql',
  'postgres',
  'mongodb',
  'redis',
  'kafka',
  'rabbitmq',
  'ci/cd',
  'linux'
];

export interface ParsedPostingMetadata {
  company?: string;
  role?: string;
  workplace: WorkplaceType;
  location?: string;
  salary?: SalarySpec;
  extractedTags: string[];
}

export function parseJobPostingText(
  rawContent: string,
  sourceUrl?: string
): ParsedPostingMetadata {
  let role: string | undefined;
  let company: string | undefined;
  let location: string | undefined;
  let workplace: WorkplaceType = 'remote';
  let salary: SalarySpec | undefined;

  // 1. Check for HTML meta tags if rawContent looks like HTML
  const ogTitleMatch = rawContent.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const titleTagMatch = rawContent.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogSiteMatch = rawContent.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);

  const rawTitle = ogTitleMatch?.[1] || titleTagMatch?.[1];
  if (rawTitle) {
    const parts = rawTitle.split(/\s*[-|–—]\s*/);
    if (parts.length >= 2) {
      role = parts[0]?.trim();
      company = parts[1]?.trim();
    } else {
      role = rawTitle.trim();
    }
  }

  if (ogSiteMatch?.[1] && !company) {
    company = ogSiteMatch[1].trim();
  }

  // Fallback heuristics from lines if not found
  if (!role || !company) {
    const lines = rawContent
      .split(/\r?\n/)
      .map(l => l.replace(/<[^>]*>/g, '').trim())
      .filter(l => l.length > 0 && l.length < 120);

    for (const l of lines.slice(0, 10)) {
      const atMatch = l.match(/^(.+?)\s+(?:at|presso|@)\s+([A-Za-z0-9\s&.-]+)$/i);
      if (atMatch) {
        if (!role) role = atMatch[1]?.trim();
        if (!company) company = atMatch[2]?.trim();
        break;
      }
    }

    if (!role && lines.length > 0) {
      role = lines[0];
    }
  }

  if (!company && sourceUrl) {
    try {
      const parsedUrl = new URL(sourceUrl);
      const hostParts = parsedUrl.hostname.replace(/^www\./, '').split('.');
      if (hostParts.length > 0 && hostParts[0]) {
        company = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
      }
    } catch {
      // ignore invalid URL
    }
  }

  // 2. Workplace detection
  const lower = rawContent.toLowerCase();
  if (lower.includes('full remote') || lower.includes('100% remote') || lower.includes('da remoto') || lower.includes('remote-first')) {
    workplace = 'remote';
  } else if (lower.includes('hybrid') || lower.includes('ibrido') || lower.includes('2 days office') || lower.includes('3 days office')) {
    workplace = 'hybrid';
  } else if (lower.includes('on-site') || lower.includes('in sede') || lower.includes('onsite')) {
    workplace = 'onsite';
  }

  // 3. Verifiable Salary extraction
  // Matches e.g. € 80.000 - 100.000, €80k - €100k, $120,000 - $140,000, 80.000€ - 95.000€
  const euroRange = rawContent.match(/(?:€|EUR)\s*([0-9]{2,3}k|[0-9]{2,3}(?:[.,][0-9]{3})?)\s*(?:-|–|to|a)\s*(?:€|EUR)?\s*([0-9]{2,3}k|[0-9]{2,3}(?:[.,][0-9]{3})?)/i);
  const dollarRange = rawContent.match(/\$\s*([0-9]{2,3}k|[0-9]{2,3}(?:[.,][0-9]{3})?)\s*(?:-|–|to)\s*\$?\s*([0-9]{2,3}k|[0-9]{2,3}(?:[.,][0-9]{3})?)/i);

  function normalizeSalaryNumber(val: string): number {
    const clean = val.toLowerCase().trim();
    if (clean.endsWith('k')) {
      return Number(clean.slice(0, -1)) * 1000;
    }
    return Number(clean.replace(/[.,]/g, ''));
  }

  if (euroRange && euroRange[1] && euroRange[2]) {
    const min = normalizeSalaryNumber(euroRange[1]);
    const max = normalizeSalaryNumber(euroRange[2]);
    if (!isNaN(min) && !isNaN(max) && min > 1000) {
      salary = {
        currency: 'EUR',
        min,
        max,
        period: 'year',
        source: 'extracted_from_posting_text'
      };
    }
  } else if (dollarRange && dollarRange[1] && dollarRange[2]) {
    const min = normalizeSalaryNumber(dollarRange[1]);
    const max = normalizeSalaryNumber(dollarRange[2]);
    if (!isNaN(min) && !isNaN(max) && min > 1000) {
      salary = {
        currency: 'USD',
        min,
        max,
        period: 'year',
        source: 'extracted_from_posting_text'
      };
    }
  }

  // 4. Extract common technology tags
  const extractedTags: string[] = [];
  for (const kw of COMMON_SKILL_KEYWORDS) {
    // Word boundary match
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const rx = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');
    if (rx.test(rawContent)) {
      extractedTags.push(kw === 'k8s' ? 'kubernetes' : kw === 'node' ? 'nodejs' : kw);
    }
  }

  return {
    company,
    role,
    workplace,
    location,
    salary,
    extractedTags: Array.from(new Set(extractedTags))
  };
}
