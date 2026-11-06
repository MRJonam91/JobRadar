// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { PostingDiffResult } from './types.ts';

export function diffJobPostings(
  applicationId: string,
  originalText: string,
  updatedText: string
): PostingDiffResult {
  const origLines = originalText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const updatedLines = updatedText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const origSet = new Set(origLines);
  const updatedSet = new Set(updatedLines);

  const addedLines: string[] = [];
  const removedLines: string[] = [];
  const extractedDifferences: string[] = [];

  for (const line of updatedLines) {
    if (!origSet.has(line)) {
      addedLines.push(line);
      if (line.match(/(?:salary|stipendio|ral|€|\$|bonus|equity)/i)) {
        extractedDifferences.push(`[COMPENSATION CHANGE] + ${line}`);
      } else if (line.match(/(?:requirement|skill|requisito|seniority|years|anni)/i)) {
        extractedDifferences.push(`[REQUIREMENT CHANGE] + ${line}`);
      }
    }
  }

  for (const line of origLines) {
    if (!updatedSet.has(line)) {
      removedLines.push(line);
      if (line.match(/(?:salary|stipendio|ral|€|\$|bonus|equity)/i)) {
        extractedDifferences.push(`[COMPENSATION REMOVED] - ${line}`);
      }
    }
  }

  const hasChanges = addedLines.length > 0 || removedLines.length > 0;

  return {
    applicationId,
    hasChanges,
    addedLines,
    removedLines,
    extractedDifferences
  };
}
