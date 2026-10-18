import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { byProduct, sheets } from "../src/data/sheets.js";
import { source } from "../src/data/site.js";
import { criteriaOf, scoreSheet } from "../src/lib/scoring.js";
import type { Answers, Sheet } from "../src/lib/types.js";

const find = (sheet: Sheet, code: string) => criteriaOf(sheet).find((c) => c.code === code)!;

test("bản PDF lưu trong repo đúng là bản ký số tải từ cổng Chính phủ", () => {
  const bytes = readFileSync(new URL(`../public/nguon/${source.file}`, import.meta.url));
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
});

test("đủ 26 bộ phiếu chấm của Phụ lục II, đánh số 1–26, slug không trùng", () => {
  expect(sheets.map((s) => s.no)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
  expect(new Set(sheets.map((s) => s.slug)).size).toBe(26);
  for (const s of sheets) expect(s.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

describe.each(sheets.map((s) => [s.no, s.name, s] as const))("bộ %i %s", (_no, _name, sheet) => {
  test("Phần A 40, B 25, C 35, cộng 100 (Điều 3 khoản 1)", () => {
    expect(sheet.parts.map((p) => [p.code, p.max])).toEqual([
      ["A", 40],
      ["B", 25],
      ["C", 35],
    ]);
  });

  test("điểm tối đa cộng dồn khớp từ mức → tiêu chí → mục → phần", () => {
    for (const part of sheet.parts) {
      expect(part.sections.reduce((n, s) => n + s.max, 0), `phần ${part.code}`).toBe(part.max);
      for (const section of part.sections) {
        expect(section.criteria.reduce((n, c) => n + c.max, 0), `mục ${section.code}`).toBe(section.max);
        for (const c of section.criteria) {
          expect(c.options.length, `${c.code} có ít nhất 1 mức`).toBeGreaterThan(0);
          expect(Math.max(...c.options.map((o) => o.points)), `${c.code}`).toBe(c.max);
          for (const o of c.options) {
            expect(Number.isInteger(o.points) && o.points >= 0, `${c.code} ${o.text}`).toBe(true);
            expect([null, 3, 4, 5]).toContain(o.star);
            expect(o.text.trim().length, `${c.code} có chữ`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test("chọn mức cao nhất ở mọi tiêu chí thì được 100 điểm, 5 sao", () => {
    const answers: Answers = {};
    for (const c of criteriaOf(sheet)) {
      answers[c.code] = c.options.findIndex((o) => o.points === c.max);
    }
    const r = scoreSheet(sheet, answers);
    expect(r.total).toBe(100);
    expect(r.star).toBe(5);
  });

  test("mã tiêu chí không trùng", () => {
    const codes = criteriaOf(sheet).map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

// Read by hand from the scan, PDF pages 18–22 (Bộ 1. Rau, củ, quả, hạt tươi).
describe("bộ 1, đối chiếu tay với trang 18–22", () => {
  const s1 = sheets[0];
  test("1.1 Nguồn gốc sản phẩm: 1/2/3 điểm theo tỷ lệ trồng trên địa bàn xã", () => {
    expect(find(s1, "1.1").options.map((o) => o.points)).toEqual([1, 2, 3]);
  });
  test("1.3 Gia tăng giá trị: mức công nghệ tiên tiến 3 điểm, bắt buộc 5 sao", () => {
    expect(find(s1, "1.3").options.map((o) => [o.points, o.star])).toEqual([
      [1, null],
      [2, null],
      [3, 5],
    ]);
  });
  test("1.5 Liên kết sản xuất: **** ở mức 2 điểm, ***** ở mức 3 điểm", () => {
    expect(find(s1, "1.5").options.map((o) => [o.points, o.star])).toEqual([
      [0, null],
      [1, null],
      [2, 4],
      [3, 5],
    ]);
  });
  test("4.1 Khu vực phân phối chính: 1/2/3/5 điểm với *** **** *****", () => {
    expect(find(s1, "4.1").options.map((o) => [o.points, o.star])).toEqual([
      [1, null],
      [2, 3],
      [3, 4],
      [5, 5],
    ]);
  });
  test("9 Công bố chất lượng: có công bố 2 điểm là mức bắt buộc 3 sao", () => {
    expect(find(s1, "9").options.map((o) => [o.points, o.star])).toEqual([
      [2, 3],
      [4, null],
      [5, null],
    ]);
  });
  test("12 Cơ hội thị trường toàn cầu: 1/2/3 điểm", () => {
    expect(find(s1, "12").options.map((o) => o.points)).toEqual([1, 2, 3]);
  });
});

test("6 loại sản phẩm của Phụ lục I phủ đủ 26 bộ, không bộ nào nằm ở hai loại", () => {
  const counted = byProduct().flatMap((g) => g.sheets.map((s) => s.no));
  expect(counted).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
  expect(byProduct().map((g) => g.sheets.length)).toEqual([13, 4, 3, 2, 3, 1]);
});

// Read by hand from the scan, PDF pages 68–69 (Bộ 11. Chè tươi, chè chế biến).
describe("bộ 11 chè, đối chiếu tay với trang 68–69", () => {
  const s11 = sheets[10];
  test("đúng bộ chè", () => {
    expect(s11.name).toBe("Chè tươi, chè chế biến");
    expect(s11.pdfPages[0]).toBe(68);
  });
  test("1.1 Nguồn nguyên liệu: mức 50–75% là bắt buộc 3 sao", () => {
    expect(find(s11, "1.1").options.map((o) => [o.points, o.star])).toEqual([
      [1, null],
      [2, 3],
      [3, null],
    ]);
  });
  test("1.2: ô điểm của mức 'không được cấp' để trống trong bản in, tính 0 và có ghi chú", () => {
    const c = find(s11, "1.2");
    expect(c.options.map((o) => o.points)).toEqual([0, 1, 2]);
    expect(c.notes.join(" ")).toMatch(/để trống/);
  });
  test("1.3 Gia tăng giá trị: 0/1/2/3, chế biến sâu theo nhu cầu của thị trường", () => {
    const c = find(s11, "1.3");
    expect(c.options.map((o) => o.points)).toEqual([0, 1, 2, 3]);
    expect(c.options[3].text).toBe(
      "Chế biến sâu từ vùng nguyên liệu địa phương (tạo ra sản phẩm chất lượng cao theo nhu cầu của thị trường)",
    );
  });
  test("2.1 Nguồn gốc ý tưởng: 0/1/2/3, mức 3 điểm là bắt buộc 4 sao", () => {
    expect(find(s11, "2.1").options.map((o) => [o.points, o.star])).toEqual([
      [0, null],
      [1, null],
      [2, null],
      [3, 4],
    ]);
  });
  test("2.2 bao bì đẹp và 2.3 ghi nhãn đúng quy định là bắt buộc 3 sao; mã truy xuất điện tử là 4 sao", () => {
    expect(find(s11, "2.2").options.map((o) => o.star)).toEqual([null, null, 3, null]);
    expect(find(s11, "2.3").options.map((o) => [o.points, o.star])).toEqual([
      [1, 3],
      [2, null],
      [3, 4],
    ]);
  });
});

// Counted independently on the scan (pages 68–72) by a third reader, not taken from either transcription.
test("bộ 11 chè có đúng 23 mức gắn dấu sao, đúng vị trí và cấp sao", () => {
  const marked = criteriaOf(sheets[10]).flatMap((c) =>
    c.options.flatMap((o, i) => (o.star ? [`${c.code}#${i + 1}:${o.star}`] : [])),
  );
  expect(marked).toEqual([
    "1.1#2:3", "1.5#3:4", "1.5#4:5", "1.6#1:4", "2.1#4:4", "2.2#3:3", "2.3#1:3", "2.3#3:4",
    "3.4#2:4", "3.5#1:3", "3.5#2:4", "4.1#2:3", "4.1#3:4", "4.1#4:5", "5.1#5:4", "5.3#2:3",
    "6.1.1#3:4", "6.1.2#3:4", "7#3:4", "7#4:5", "8#1:3", "9#1:3", "9#2:4",
  ]);
});
