export type Star = 1 | 2 | 3 | 4 | 5;
/** Minimum-requirement marker printed after an option: *** = 3 sao, **** = 4 sao, ***** = 5 sao. */
export type MarkerStar = 3 | 4 | 5;

export interface Option {
  text: string;
  points: number;
  star: MarkerStar | null;
  /** Sheet 26 splits some criteria into "a. Trường hợp 1 ..." / "b. Trường hợp 2 ..."; pick one option overall. */
  case?: string;
}

export interface Criterion {
  code: string;
  title: string;
  max: number;
  notes: string[];
  options: Option[];
  /** Printed sub-group heading, e.g. "6.1. Ngoại hình" for 6.1.1–6.1.3. */
  heading?: string;
}

export interface Section {
  code: string;
  title: string;
  max: number;
  notes?: string[];
  criteria: Criterion[];
}

export interface Part {
  code: "A" | "B" | "C";
  title: string;
  max: number;
  sections: Section[];
}

/** One "Bộ sản phẩm" scoring sheet of Phụ lục II, QĐ 26/2026/QĐ-TTg. */
export interface Sheet {
  no: number;
  slug: string;
  name: string;
  product: string;
  group: string;
  pdfPages: [number, number];
  disqualifiedWhen: string;
  parts: Part[];
  footerNotes: string[];
}

/** Criterion code → index of the chosen option. A missing code means not answered (0 points). */
export type Answers = Record<string, number>;
