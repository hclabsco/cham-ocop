# Chấm OCOP

Tự chấm điểm sản phẩm OCOP theo bộ tiêu chí mới, [Quyết định 26/2026/QĐ-TTg](https://vanban.chinhphu.vn/?classid=1&docid=218267&pageid=27160)
(22/5/2026). Chạy tại **https://ocop.hclabs.co**.

Chọn loại sản phẩm (26 bộ phiếu chấm của Phụ lục II), đánh dấu mức cơ sở đang đạt ở từng tiêu chí. Công cụ cho biết:

- tổng điểm, điểm từng phần A/B/C;
- hạng sao theo điểm, và hạng sao sau khi xét các mức bắt buộc (*** / **** / *****);
- muốn lên hạng thì còn thiếu bao nhiêu điểm, tiêu chí bắt buộc nào chưa đạt, chỗ nào còn nhiều điểm nhất.

Thêm: tính ngày hết hạn giấy chứng nhận và khoảng nộp hồ sơ đánh giá lại; hạn của đợt đánh giá cấp tỉnh sắp tới.

> **Không phải công cụ của cơ quan nhà nước.** Kết quả chính thức do Hội đồng đánh giá, phân hạng sản phẩm OCOP quyết định.

## Nguồn và độ tin cậy

- `public/nguon/qd-26-2026-ttg.pdf`: bản ký số tải từ datafiles.chinhphu.vn. `test/sheets.test.ts` kiểm sha256 mỗi lần chạy.
- `src/data/sheets.json`: 26 bộ phiếu chấm, chép từ bản scan. Hai lượt chép độc lập trùng nhau hoàn toàn về điểm, dấu sao,
  điểm tối đa và số mức; chỗ lệch câu chữ được đọc lại trên ảnh phóng to. Test kiểm mọi phép cộng điểm tối đa và đối chiếu tay
  một số tiêu chí với trang gốc.
- Câu chữ giữ nguyên bản in, kể cả lỗi in của văn bản gốc.
- `transcription/`: hai bản chép thô (`a-*.json`, `b-*.json`), kết quả đọc lại các chỗ lệch (`resolutions.json`) và
  script tái tạo dữ liệu: `python3 compare.py && python3 build-data.py`.

## Phát triển

```sh
corepack enable
pnpm install
pnpm test        # vitest: engine, lịch, dữ liệu
pnpm dev
pnpm build       # dist/ + kiểm tra không có tài nguyên ngoài
```

Logic nằm trong `src/lib/` (thuần TypeScript, có test). Trang Astro chỉ hiển thị; script trang trong `src/scripts/`.

## Khi văn bản thay đổi

1. Tải văn bản mới từ cổng chính thức, lưu vào `public/nguon/`, cập nhật `src/data/site.ts` (`source`, `sha256`).
2. Chép lại phiếu chấm thay đổi vào `src/data/sheets.json`; thêm test đối chiếu tay với trang mới.
3. Cập nhật `verifiedThrough`. Mở pull request.

Deploy: push `main` chạy `.github/workflows/deploy.yml` (test, build, `wrangler deploy`). Tên miền gắn trong repo `infra`.

## Giấy phép

MIT. Văn bản quy phạm pháp luật không thuộc đối tượng bảo hộ quyền tác giả.
