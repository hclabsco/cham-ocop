import { criteriaOf } from "./scoring.js";
import type { Answers, Sheet } from "./types.js";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Short fingerprint of the sheet's shape (criterion codes and option points, in order).
 * A link made before the sheet was corrected no longer matches and is refused instead of
 * being read against different options.
 */
export function sheetVersion(sheet: Sheet): string {
  const shape = criteriaOf(sheet)
    .map((c) => `${c.code}:${c.options.map((o) => o.points).join(",")}`)
    .join("|");
  let hash = 0x811c9dc5; // FNV-1a, 32 bit
  for (let i = 0; i < shape.length; i++) {
    hash ^= shape.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** "<version>.<one character per criterion>"; "-" = not answered. */
export function encodeAnswers(sheet: Sheet, answers: Answers): string {
  const chars = criteriaOf(sheet).map((c) => (c.code in answers ? DIGITS[answers[c.code]] : "-"));
  const body = chars.join("").replace(/-+$/, "");
  return body ? `${sheetVersion(sheet)}.${body}` : "";
}

/**
 * Empty input is an empty sheet. A different or missing version returns null.
 * Within a matching version, characters that name no existing option are treated as not answered.
 */
export function decodeAnswers(sheet: Sheet, encoded: string): Answers | null {
  if (encoded === "") return {};
  const dot = encoded.indexOf(".");
  if (dot < 0 || encoded.slice(0, dot) !== sheetVersion(sheet)) return null;
  const body = encoded.slice(dot + 1);
  const answers: Answers = {};
  criteriaOf(sheet).forEach((c, i) => {
    const index = DIGITS.indexOf(body[i] ?? "-");
    if (index >= 0 && index < c.options.length) answers[c.code] = index;
  });
  return answers;
}
