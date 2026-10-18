// Contact details are copied from hclabs.co src/data/site.ts, where each value is checked
// against a document (Zalo OA id, the owner's number on the registration certificate).
export const contact = {
  zaloOaUrl: "https://zalo.me/486963102711723289",
  phoneDisplay: "0911 051 587",
  phoneHref: "tel:+84911051587",
  email: "chinh@hclabs.co",
  site: "https://hclabs.co",
  repo: "https://github.com/hclabsco/cham-ocop",
} as const;

/** The only legal source of the scoring sheets. sha256 is checked by test/sources.test.ts. */
export const source = {
  doc: "Quyết định 26/2026/QĐ-TTg",
  title: "Ban hành Bộ tiêu chí và quy trình đánh giá, phân hạng sản phẩm mỗi xã một sản phẩm",
  issuedOn: "2026-05-22",
  effectiveOn: "2026-05-22",
  signer: "Phó Thủ tướng Hồ Quốc Dũng",
  file: "qd-26-2026-ttg.pdf",
  sha256: "1916672a65212ad2591e2cc91718c626717c4f81b81457743da4374a72dfdd7a",
  officialPage: "https://vanban.chinhphu.vn/?classid=1&docid=218267&pageid=27160",
  officialFile: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/5/26-ttg-2026.signed.pdf",
  replaces: "Quyết định 148/QĐ-TTg (24/02/2023) và Quyết định 1489/QĐ-TTg (06/07/2025)",
} as const;

/** Last day the rules were checked against the official gazette for amendments. */
export const verifiedThrough = "2026-10-19";
