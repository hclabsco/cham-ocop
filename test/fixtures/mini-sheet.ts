import type { Sheet } from "../../src/lib/types.js";

/**
 * A reduced sheet shaped like Phụ lục II (one criterion per section), with point values
 * and star markers copied from Bộ 1 (Rau, củ, quả, hạt tươi): 1.5 Liên kết sản xuất,
 * 2.2 Đóng gói, 4.1 Khu vực phân phối chính, 9 Công bố chất lượng (16 points), plus one
 * unmarked filler criterion "0.1" worth up to 84 so totals reach the real star bands.
 */
export const miniSheet: Sheet = {
  no: 1,
  slug: "mini",
  name: "Mini",
  product: "Thực phẩm",
  group: "Thực phẩm tươi sống",
  pdfPages: [18, 22],
  disqualifiedWhen: "",
  footerNotes: [],
  parts: [
    {
      code: "A",
      title: "SẢN PHẨM VÀ SỨC MẠNH CỦA CỘNG ĐỒNG",
      max: 90,
      sections: [
        {
          code: "0",
          title: "PHẦN GỘP",
          max: 84,
          criteria: [
            {
              code: "0.1",
              title: "Các tiêu chí còn lại",
              max: 84,
              notes: [],
              options: [
                { text: "0", points: 0, star: null },
                { text: "40", points: 40, star: null },
                { text: "60", points: 60, star: null },
                { text: "74", points: 74, star: null },
                { text: "84", points: 84, star: null },
              ],
            },
          ],
        },
        {
          code: "1",
          title: "TỔ CHỨC SẢN XUẤT",
          max: 3,
          criteria: [
            {
              code: "1.5",
              title: "Liên kết sản xuất",
              max: 3,
              notes: [],
              options: [
                { text: "Không có liên kết hoặc có liên kết nhưng không rõ ràng", points: 0, star: null },
                { text: "Có hợp đồng liên kết từ 50% đến dưới 75% sản lượng tiêu thụ", points: 1, star: null },
                { text: "Có hợp đồng liên kết trên 75% sản lượng tiêu thụ", points: 2, star: 4 },
                { text: "Có hợp đồng liên kết trên 75% sản lượng tiêu thụ và ổn định từ 12 tháng", points: 3, star: 5 },
              ],
            },
          ],
        },
        {
          code: "2",
          title: "PHÁT TRIỂN SẢN PHẨM",
          max: 3,
          criteria: [
            {
              code: "2.2",
              title: "Đóng gói, bao bì sản phẩm",
              max: 3,
              notes: [],
              options: [
                { text: "Đóng gói theo hình thức thông thường, không có bao bì", points: 0, star: null },
                { text: "Đóng gói theo hình thức thông thường, bao bì đơn giản", points: 1, star: null },
                { text: "Đóng gói sáng tạo, bao bì đẹp", points: 2, star: 3 },
                { text: "Đóng gói sáng tạo, tiện lợi, bao bì đẹp, sang trọng", points: 3, star: null },
              ],
            },
          ],
        },
      ],
    },
    {
      code: "B",
      title: "KHẢ NĂNG TIẾP THỊ",
      max: 5,
      sections: [
        {
          code: "4",
          title: "TIẾP THỊ",
          max: 5,
          criteria: [
            {
              code: "4.1",
              title: "Khu vực phân phối chính",
              max: 5,
              notes: [],
              options: [
                { text: "Thị trường trong địa bàn cấp xã", points: 1, star: null },
                { text: "Thị trường ngoài địa bàn cấp xã, có dưới 5 đại diện/đại lý phân phối", points: 2, star: 3 },
                { text: "Thị trường ngoài địa bàn cấp xã, có ≥ 5 đại diện/đại lý phân phối", points: 3, star: 4 },
                { text: "Thị trường quốc tế hoặc kênh thương mại hiện đại", points: 5, star: 5 },
              ],
            },
          ],
        },
      ],
    },
    {
      code: "C",
      title: "CHẤT LƯỢNG SẢN PHẨM",
      max: 5,
      sections: [
        {
          code: "9",
          title: "CÔNG BỐ CHẤT LƯỢNG SẢN PHẨM",
          max: 5,
          criteria: [
            {
              code: "9",
              title: "CÔNG BỐ CHẤT LƯỢNG SẢN PHẨM",
              max: 5,
              notes: [],
              options: [
                { text: "Có công bố chất lượng sản phẩm", points: 2, star: 3 },
                { text: "Có công bố chất lượng sản phẩm theo quy định và áp dụng các tiêu chuẩn quốc gia", points: 4, star: null },
                { text: "Có công bố chất lượng sản phẩm theo quy định và áp dụng các tiêu chuẩn quốc tế", points: 5, star: null },
              ],
            },
          ],
        },
      ],
    },
  ],
};
