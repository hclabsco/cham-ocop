import { describe, expect, test } from "vitest";
import { gapsTo, scoreSheet, starForScore } from "../src/lib/scoring.js";
import { miniSheet } from "./fixtures/mini-sheet.js";

// Bands from QĐ 26/2026/QĐ-TTg Điều 3 khoản 3: 5 sao 90–100, 4 sao 70–<90,
// 3 sao 50–<70, 2 sao 30–<50, 1 sao <30.
describe("starForScore", () => {
  test.each([
    [0, 1],
    [29, 1],
    [30, 2],
    [49, 2],
    [50, 3],
    [69, 3],
    [70, 4],
    [89, 4],
    [90, 5],
    [100, 5],
  ])("%i điểm → %i sao", (score, star) => {
    expect(starForScore(score)).toBe(star);
  });
});

describe("scoreSheet", () => {
  test("chưa trả lời gì: 0 điểm, 1 sao", () => {
    const r = scoreSheet(miniSheet, {});
    expect(r.total).toBe(0);
    expect(r.parts).toEqual({ A: 0, B: 0, C: 0 });
    expect(r.star).toBe(1);
  });

  test("cộng điểm theo phương án đã chọn, tách theo phần A/B/C", () => {
    // 0.1 → 60, 1.5 → 1, 2.2 → 2, 4.1 → 2, 9 → 2: A = 63, B = 2, C = 2, total 67.
    const r = scoreSheet(miniSheet, { "0.1": 2, "1.5": 1, "2.2": 2, "4.1": 1, "9": 0 });
    expect(r.parts).toEqual({ A: 63, B: 2, C: 2 });
    expect(r.total).toBe(67);
    expect(r.starByScore).toBe(3);
    expect(r.star).toBe(3);
    expect(r.blockers).toEqual([]);
  });

  test("đủ điểm 3 sao nhưng thiếu tiêu chí bắt buộc *** thì chỉ được 2 sao", () => {
    // 60 + 1 + 1 (bao bì đơn giản, dưới mức ***) + 2 + 2 = 66 → theo điểm 3 sao.
    const r = scoreSheet(miniSheet, { "0.1": 2, "1.5": 1, "2.2": 1, "4.1": 1, "9": 0 });
    expect(r.total).toBe(66);
    expect(r.starByScore).toBe(3);
    expect(r.star).toBe(2);
    expect(r.blockers.map((b) => b.criterion.code)).toEqual(["2.2"]);
    expect(r.blockers[0].required.text).toBe("Đóng gói sáng tạo, bao bì đẹp");
  });

  test("đủ điểm 4 sao, đạt *** nhưng thiếu **** ở 1.5 thì dừng ở 3 sao", () => {
    // 74 + 1 + 3 + 3 + 2 = 83 → theo điểm 4 sao; 1.5 cần ≥ 2 điểm cho 4 sao.
    const r = scoreSheet(miniSheet, { "0.1": 3, "1.5": 1, "2.2": 3, "4.1": 2, "9": 0 });
    expect(r.total).toBe(83);
    expect(r.starByScore).toBe(4);
    expect(r.star).toBe(3);
    expect(r.blockers.map((b) => b.criterion.code)).toEqual(["1.5"]);
  });

  test("5 sao cần cả yêu cầu **** lẫn *****", () => {
    // 84 + 3 + 3 + 3 + 5 = 98 → theo điểm 5 sao, nhưng 4.1 chỉ ở mức ****.
    const r = scoreSheet(miniSheet, { "0.1": 4, "1.5": 3, "2.2": 3, "4.1": 2, "9": 2 });
    expect(r.total).toBe(98);
    expect(r.starByScore).toBe(5);
    expect(r.star).toBe(4);
    expect(r.blockers.map((b) => b.criterion.code)).toEqual(["4.1"]);
  });

  test("chọn cao hơn mức bắt buộc vẫn tính là đạt", () => {
    // 2.2 phương án 4 (3 điểm, không có dấu sao) cao hơn mức *** (2 điểm).
    const r = scoreSheet(miniSheet, { "0.1": 3, "1.5": 3, "2.2": 3, "4.1": 3, "9": 2 });
    expect(r.total).toBe(90);
    expect(r.star).toBe(5);
  });

  test("chỉ số phương án không tồn tại thì báo lỗi, không âm thầm tính 0", () => {
    expect(() => scoreSheet(miniSheet, { "2.2": 9 })).toThrow(/2\.2/);
  });
});

describe("gapsTo", () => {
  test("liệt kê điểm còn thiếu, tiêu chí bắt buộc chưa đạt và cách nâng điểm", () => {
    // Hiện 66 điểm, 2 sao. Muốn 4 sao: cần 70 → thiếu 4 điểm.
    const g = gapsTo(miniSheet, { "0.1": 2, "1.5": 1, "2.2": 1, "4.1": 1, "9": 0 }, 4);
    expect(g.pointsMissing).toBe(4);
    // Bắt buộc cho 4 sao: 2.2 (*** = 2 điểm), 1.5 (**** = 2 điểm), 4.1 (**** = 3 điểm).
    expect(g.requirements.map((r) => [r.criterion.code, r.required.points])).toEqual([
      ["1.5", 2],
      ["2.2", 2],
      ["4.1", 3],
    ]);
    // Nâng điểm, xếp theo số điểm còn có thể thêm: 0.1 (+24), 4.1 (+3), 9 (+3), 1.5 (+2), 2.2 (+2).
    expect(g.upgrades.map((u) => [u.criterion.code, u.maxGain])).toEqual([
      ["0.1", 24],
      ["4.1", 3],
      ["9", 3],
      ["1.5", 2],
      ["2.2", 2],
    ]);
    expect(g.upgrades[1].next.text).toBe("Thị trường ngoài địa bàn cấp xã, có ≥ 5 đại diện/đại lý phân phối");
  });

  test("đã đạt mục tiêu thì không thiếu gì", () => {
    const g = gapsTo(miniSheet, { "0.1": 3, "1.5": 3, "2.2": 3, "4.1": 3, "9": 2 }, 5);
    expect(g.pointsMissing).toBe(0);
    expect(g.requirements).toEqual([]);
  });
});
