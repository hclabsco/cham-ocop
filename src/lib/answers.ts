import { criteriaOf } from "./scoring.js";
import type { Answers, Sheet } from "./types.js";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

/** One character per criterion in document order, so a whole sheet fits in a short link. */
export function encodeAnswers(sheet: Sheet, answers: Answers): string {
  const chars = criteriaOf(sheet).map((c) => (c.code in answers ? DIGITS[answers[c.code]] : "-"));
  return chars.join("").replace(/-+$/, "");
}

/** Lenient: characters that do not name an existing option are treated as not answered. */
export function decodeAnswers(sheet: Sheet, encoded: string): Answers {
  const answers: Answers = {};
  criteriaOf(sheet).forEach((c, i) => {
    const index = DIGITS.indexOf(encoded[i] ?? "-");
    if (index >= 0 && index < c.options.length) answers[c.code] = index;
  });
  return answers;
}
