import type { Sheet } from "../lib/types.js";
import data from "./sheets.json" with { type: "json" };

export const sheets = data as Sheet[];

export function sheetBySlug(slug: string): Sheet {
  const sheet = sheets.find((s) => s.slug === slug);
  if (!sheet) throw new Error(`Không có bộ sản phẩm "${slug}"`);
  return sheet;
}

/**
 * The six product types of Phụ lục I (PDF pages 15–16) with the sheet numbers of Phụ lục II
 * that belong to each. The "Sản phẩm:" line printed on each sheet is not spelled consistently
 * ("Thủ công mỹ nghệ" / "Hàng thủ công mỹ nghệ"), so grouping uses Phụ lục I instead.
 */
export const CATEGORIES: { name: string; from: number; to: number }[] = [
  { name: "Thực phẩm", from: 1, to: 13 },
  { name: "Đồ uống", from: 14, to: 17 },
  { name: "Dược liệu và sản phẩm từ dược liệu", from: 18, to: 20 },
  { name: "Hàng thủ công mỹ nghệ", from: 21, to: 22 },
  { name: "Sinh vật cảnh", from: 23, to: 25 },
  { name: "Dịch vụ du lịch cộng đồng, du lịch sinh thái và điểm du lịch", from: 26, to: 26 },
];

export function byProduct(): { product: string; sheets: Sheet[] }[] {
  return CATEGORIES.map((c) => ({ product: c.name, sheets: sheets.filter((s) => s.no >= c.from && s.no <= c.to) }));
}

export function categoryOf(sheet: Sheet): string {
  return CATEGORIES.find((c) => sheet.no >= c.from && sheet.no <= c.to)!.name;
}

export function criteriaCount(sheet: Sheet): number {
  return sheet.parts.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.criteria.length, 0), 0);
}
