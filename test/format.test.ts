import { expect, test } from "vitest";
import { formatDate, todayInVietnam } from "../src/lib/format.js";

test("00:30 ngày 19/10 giờ Việt Nam vẫn là 18/10 theo UTC, phải ra ngày 19/10", () => {
  expect(todayInVietnam(new Date("2026-10-18T17:30:00Z"))).toBe("2026-10-19");
});

test("23:59 giờ Việt Nam vẫn là cùng ngày", () => {
  expect(todayInVietnam(new Date("2026-10-19T16:59:00Z"))).toBe("2026-10-19");
});

test("định dạng ngày kiểu Việt Nam", () => {
  expect(formatDate("2026-10-30")).toBe("30/10/2026");
});
