import { describe, expect, test } from "vitest";
import { decodeAnswers, encodeAnswers } from "../src/lib/answers.js";
import { miniSheet } from "./fixtures/mini-sheet.js";

// Criterion order in miniSheet: 0.1, 1.5, 2.2, 4.1, 9. One character per criterion:
// "-" = not answered, "0".."9" then "a".."z" = option index.
describe("encodeAnswers / decodeAnswers", () => {
  test("mã hoá theo thứ tự tiêu chí, '-' là chưa chọn", () => {
    expect(encodeAnswers(miniSheet, { "0.1": 2, "2.2": 3, "9": 0 })).toBe("2-3-0");
  });

  test("giải mã ngược lại đúng", () => {
    expect(decodeAnswers(miniSheet, "2-3-0")).toEqual({ "0.1": 2, "2.2": 3, "9": 0 });
  });

  test("link hỏng hoặc của phiếu khác thì bỏ qua phần không hợp lệ", () => {
    // "9" is out of range for 1.5 (4 options); a too-short string leaves the rest empty.
    expect(decodeAnswers(miniSheet, "29")).toEqual({ "0.1": 2 });
    expect(decodeAnswers(miniSheet, "")).toEqual({});
    expect(decodeAnswers(miniSheet, "%%%%%")).toEqual({});
  });
});
