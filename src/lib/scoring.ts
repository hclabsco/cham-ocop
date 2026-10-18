import type { Answers, Criterion, Option, Sheet, Star } from "./types.js";

/** Lower bound of each star band, QĐ 26/2026/QĐ-TTg Điều 3 khoản 3. */
export const STAR_FLOOR: Record<Star, number> = { 1: 0, 2: 30, 3: 50, 4: 70, 5: 90 };

export interface Requirement {
  criterion: Criterion;
  /** The lowest option that satisfies the marker for the star level asked about. */
  required: Option;
  current: Option | null;
}

export interface Score {
  total: number;
  parts: { A: number; B: number; C: number };
  starByScore: Star;
  /** Star after the minimum-requirement markers; never above starByScore. */
  star: Star;
  /** Unmet requirements that hold the result below starByScore. */
  blockers: Requirement[];
}

export interface Upgrade {
  criterion: Criterion;
  current: Option | null;
  /** The next option worth more points than the current one. */
  next: Option;
  /** Points still available on this criterion. */
  maxGain: number;
}

export interface Gaps {
  target: Star;
  pointsMissing: number;
  requirements: Requirement[];
  upgrades: Upgrade[];
}

export function starForScore(score: number): Star {
  for (const star of [5, 4, 3, 2] as const) {
    if (score >= STAR_FLOOR[star]) return star;
  }
  return 1;
}

export function criteriaOf(sheet: Sheet): Criterion[] {
  return sheet.parts.flatMap((p) => p.sections.flatMap((s) => s.criteria));
}

function chosen(criterion: Criterion, answers: Answers): Option | null {
  const index = answers[criterion.code];
  if (index === undefined) return null;
  const option = criterion.options[index];
  if (!option) throw new Error(`Tiêu chí ${criterion.code} không có phương án số ${index}`);
  return option;
}

/**
 * Markers are cumulative: a 4-sao product must also meet every *** marker. Within one
 * criterion the binding marker is the highest-scoring option marked at or below the level.
 */
export function requirementsFor(sheet: Sheet, answers: Answers, star: Star): Requirement[] {
  const unmet: Requirement[] = [];
  for (const criterion of criteriaOf(sheet)) {
    const marked = criterion.options.filter((o) => o.star !== null && o.star <= star);
    if (marked.length === 0) continue;
    const required = marked.reduce((a, b) => (b.points > a.points ? b : a));
    const current = chosen(criterion, answers);
    if ((current?.points ?? 0) < required.points) unmet.push({ criterion, required, current });
  }
  return unmet;
}

export function scoreSheet(sheet: Sheet, answers: Answers): Score {
  const parts = { A: 0, B: 0, C: 0 };
  for (const part of sheet.parts) {
    for (const section of part.sections) {
      for (const criterion of section.criteria) {
        parts[part.code] += chosen(criterion, answers)?.points ?? 0;
      }
    }
  }
  const total = parts.A + parts.B + parts.C;
  const starByScore = starForScore(total);

  let star: Star = starByScore;
  let blockers: Requirement[] = [];
  while (star >= 3) {
    const unmet = requirementsFor(sheet, answers, star);
    if (unmet.length === 0) break;
    if (star === starByScore) blockers = unmet;
    star = (star - 1) as Star;
  }
  return { total, parts, starByScore, star, blockers };
}

export function gapsTo(sheet: Sheet, answers: Answers, target: Star): Gaps {
  const { total } = scoreSheet(sheet, answers);
  const upgrades: Upgrade[] = [];
  for (const criterion of criteriaOf(sheet)) {
    const current = chosen(criterion, answers);
    const points = current?.points ?? 0;
    const better = criterion.options.filter((o) => o.points > points);
    if (better.length === 0) continue;
    const next = better.reduce((a, b) => (b.points < a.points ? b : a));
    upgrades.push({ criterion, current, next, maxGain: criterion.max - points });
  }
  // Stable sort keeps document order among equal gains.
  upgrades.sort((a, b) => b.maxGain - a.maxGain);
  return {
    target,
    pointsMissing: Math.max(0, STAR_FLOOR[target] - total),
    requirements: target >= 3 ? requirementsFor(sheet, answers, target) : [],
    upgrades,
  };
}
