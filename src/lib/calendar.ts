/**
 * Date-only arithmetic on "YYYY-MM-DD" strings. Every date here is a Vietnamese calendar
 * day; UTC is used only as a timezone-free calendar, never to read the clock.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

function parse(date: string): Date {
  const m = ISO.exec(date);
  if (!m) throw new Error(`Ngày phải có dạng YYYY-MM-DD, nhận được "${date}"`);
  const [year, month, day] = [+m[1], +m[2], +m[3]];
  if (year < 1900) throw new Error(`Năm không hợp lệ: ${date}`);
  const d = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls 2026-13-01 into 2027 and 2026-04-31 into May; refuse instead.
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new Error(`Ngày không tồn tại: ${date}`);
  }
  return d;
}

const format = (d: Date) => d.toISOString().slice(0, 10);

function addDays(date: string, days: number): string {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
}

/** Same day of month N months later; the month's last day when that day does not exist. */
function addMonths(date: string, months: number): string {
  const d = parse(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return format(new Date(Date.UTC(year, month, Math.min(d.getUTCDate(), lastDay))));
}

export interface RenewalWindow {
  expiresOn: string;
  submitFrom: string;
  submitBy: string;
}

/**
 * Certificate validity 36 months (QĐ 26/2026/QĐ-TTg Điều 4 k3); re-rating dossier
 * no earlier than 180 and no later than 120 days before expiry (Điều 7 k6 điểm a).
 */
export function renewalWindow(issuedOn: string): RenewalWindow {
  const expiresOn = addMonths(issuedOn, 36);
  return { expiresOn, submitFrom: addDays(expiresOn, -180), submitBy: addDays(expiresOn, -120) };
}

export interface Round {
  round: 1 | 2;
  year: number;
  /** UBND cấp xã must propose the dossier before this day. */
  communeProposalBefore: string;
  /** The last day a proposal still makes this round ("trước 30/10" → 29/10). */
  lastProposalDay: string;
  /** UBND cấp tỉnh completes the rating before this day. */
  provinceResultBefore: string;
}

/** Provincial rounds, Điều 5 khoản 1: before 30/4 → 30/6, before 30/10 → 30/12. */
export function nextRound(today: string): Round {
  const year = parse(today).getUTCFullYear();
  const rounds: Round[] = [year, year + 1].flatMap((y) => [
    { round: 1, year: y, communeProposalBefore: `${y}-04-30`, lastProposalDay: `${y}-04-29`, provinceResultBefore: `${y}-06-30` },
    { round: 2, year: y, communeProposalBefore: `${y}-10-30`, lastProposalDay: `${y}-10-29`, provinceResultBefore: `${y}-12-30` },
  ]);
  return rounds.find((r) => today < r.communeProposalBefore)!;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

export type RenewalState = "truoc_khoang_nop" | "dang_trong_khoang" | "qua_han_nop" | "het_han";

export interface RenewalStatus extends RenewalWindow {
  state: RenewalState;
  /** Days to the next milestone: window opening, last submission day, or expiry. */
  daysLeft: number;
}

/** Both window ends are inclusive; the certificate is valid through its expiry day. */
export function renewalStatus(issuedOn: string, today: string): RenewalStatus {
  const w = renewalWindow(issuedOn);
  if (today < w.submitFrom) return { ...w, state: "truoc_khoang_nop", daysLeft: daysBetween(today, w.submitFrom) };
  if (today <= w.submitBy) return { ...w, state: "dang_trong_khoang", daysLeft: daysBetween(today, w.submitBy) };
  if (today <= w.expiresOn) return { ...w, state: "qua_han_nop", daysLeft: daysBetween(today, w.expiresOn) };
  return { ...w, state: "het_han", daysLeft: 0 };
}
