import { describe, expect, test } from "vitest";
import { daysBetween, nextRound, renewalStatus, renewalWindow } from "../src/lib/calendar.js";

// QĐ 26/2026/QĐ-TTg Điều 4 khoản 3: giấy chứng nhận có giá trị 36 tháng kể từ ngày ban hành.
// Điều 7 khoản 6 điểm a: nộp hồ sơ đánh giá lại không sớm hơn 180 ngày và không muộn hơn
// 120 ngày tính đến ngày hết thời hạn. Hạn theo tháng kết thúc vào ngày tương ứng của tháng
// cuối (Bộ luật Dân sự 2015 Điều 148); không có ngày tương ứng thì là ngày cuối tháng.
describe("renewalWindow", () => {
  test("giấy cấp 15/11/2023 hết hạn 15/11/2026; nộp lại từ 19/05/2026 đến 18/07/2026", () => {
    // 15/11/2026 − 180 ngày = 19/05/2026; − 120 ngày = 18/07/2026 (đếm tay theo lịch).
    expect(renewalWindow("2023-11-15")).toEqual({
      expiresOn: "2026-11-15",
      submitFrom: "2026-05-19",
      submitBy: "2026-07-18",
    });
  });

  test("ngày 31 không có trong tháng hết hạn thì lấy ngày cuối tháng", () => {
    // 31/05/2026 + 36 tháng → tháng 05/2029 có ngày 31, giữ nguyên; 31/08/2025 → 31/08/2028.
    // 29/02/2024 + 36 tháng → tháng 02/2027 không có ngày 29 → 28/02/2027.
    expect(renewalWindow("2024-02-29").expiresOn).toBe("2027-02-28");
  });

  test("ngày sai định dạng thì báo lỗi", () => {
    expect(() => renewalWindow("15/11/2023")).toThrow(/YYYY-MM-DD/);
  });

  test("tháng 13, tháng 00, ngày 31/04 hay năm hai chữ số bị từ chối, không tự lăn sang ngày khác", () => {
    expect(() => renewalWindow("2026-13-01")).toThrow();
    expect(() => renewalWindow("2026-00-10")).toThrow();
    expect(() => renewalWindow("2026-04-31")).toThrow();
    expect(() => renewalWindow("0026-01-15")).toThrow();
  });
});

// Điều 5 khoản 1: đợt 1 xã đề nghị trước 30/4, tỉnh đánh giá trước 30/6;
// đợt 2 xã đề nghị trước 30/10, tỉnh đánh giá trước 30/12.
describe("nextRound", () => {
  test("19/10/2026 còn kịp đợt 2 năm 2026", () => {
    expect(nextRound("2026-10-19")).toEqual({
      round: 2,
      year: 2026,
      communeProposalBefore: "2026-10-30",
      lastProposalDay: "2026-10-29",
      provinceResultBefore: "2026-12-30",
    });
  });

  test("đúng ngày 30/10 là đã lỡ đợt 2, sang đợt 1 năm sau", () => {
    expect(nextRound("2026-10-30")).toEqual({
      round: 1,
      year: 2027,
      communeProposalBefore: "2027-04-30",
      lastProposalDay: "2027-04-29",
      provinceResultBefore: "2027-06-30",
    });
  });

  test("đầu năm thì là đợt 1 cùng năm", () => {
    expect(nextRound("2027-01-05").round).toBe(1);
    expect(nextRound("2027-04-29").year).toBe(2027);
    expect(nextRound("2027-05-01").round).toBe(2);
  });
});

describe("daysBetween", () => {
  test("19/10 đến 30/10 là 11 ngày; qua tháng 2 năm nhuận vẫn đúng", () => {
    expect(daysBetween("2026-10-19", "2026-10-30")).toBe(11);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });
});

// Giấy cấp 15/11/2023: mở nộp 19/05/2026, hạn chót 18/07/2026, hết hạn 15/11/2026.
describe("renewalStatus", () => {
  test.each([
    ["2026-05-18", "truoc_khoang_nop"],
    ["2026-05-19", "dang_trong_khoang"],
    ["2026-07-18", "dang_trong_khoang"],
    ["2026-07-19", "qua_han_nop"],
    ["2026-11-15", "qua_han_nop"],
    ["2026-11-16", "het_han"],
  ])("ngày %s → %s", (today, state) => {
    expect(renewalStatus("2023-11-15", today).state).toBe(state);
  });

  test("đếm số ngày còn lại tới mốc kế tiếp", () => {
    expect(renewalStatus("2023-11-15", "2026-05-09").daysLeft).toBe(10);
    expect(renewalStatus("2023-11-15", "2026-07-08").daysLeft).toBe(10);
  });
});
