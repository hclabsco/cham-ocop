import { describe, expect, test } from "vitest";
import { decodeAnswers, encodeAnswers, sheetVersion } from "../src/lib/answers.js";
import { miniSheet } from "./fixtures/mini-sheet.js";

// Criterion order in miniSheet: 0.1, 1.5, 2.2, 4.1, 9. One character per criterion:
// "-" = not answered, "0".."9" then "a".."z" = option index.
describe("encodeAnswers / decodeAnswers", () => {
  const v = sheetVersion(miniSheet);

  test("mã hoá theo thứ tự tiêu chí, '-' là chưa chọn, có tiền tố phiên bản phiếu", () => {
    expect(encodeAnswers(miniSheet, { "0.1": 2, "2.2": 3, "9": 0 })).toBe(`${v}.2-3-0`);
  });

  test("giải mã ngược lại đúng", () => {
    expect(decodeAnswers(miniSheet, `${v}.2-3-0`)).toEqual({ "0.1": 2, "2.2": 3, "9": 0 });
  });

  test("link hỏng thì bỏ qua phần không hợp lệ", () => {
    // "9" is out of range for 1.5 (4 options); a too-short string leaves the rest empty.
    expect(decodeAnswers(miniSheet, `${v}.29`)).toEqual({ "0.1": 2 });
    expect(decodeAnswers(miniSheet, "")).toEqual({});
    expect(decodeAnswers(miniSheet, `${v}.%%%%%`)).toEqual({});
  });

  test("phiếu đã đổi cấu trúc (thêm mức, đổi thứ tự) thì link cũ không được đọc nhầm", () => {
    const changed = structuredClone(miniSheet);
    changed.parts[0].sections[1].criteria[0].options.push({ text: "mới", points: 0, star: null });
    expect(sheetVersion(changed)).not.toBe(v);
    expect(decodeAnswers(changed, `${v}.2-3-0`)).toBeNull();
    expect(decodeAnswers(miniSheet, "2-3-0")).toBeNull();
  });
});
