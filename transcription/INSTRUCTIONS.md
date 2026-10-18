# Transcription brief: OCOP scoring sheets (QĐ 26/2026/QĐ-TTg, Phụ lục II)

Source: `/home/chinh/work/hclabs/plans/261019-0032-cham-ocop/research/sources/qd-26-2026-ttg.pdf`
(scanned, 154 pages, no text layer). Read it with the Read tool, `pages` param, max 10 pages per call.

Phụ lục II holds 26 "Bộ sản phẩm" scoring sheets. Bộ 1 starts on PDF page 18.
Each sheet: header "N. Bộ sản phẩm: <name>" + "(Sản phẩm: X. Nhóm: Y)", a "Hồ sơ bị loại khi: ..." line,
then a table: Phần A (40) / B (25) / C (35), numbered sections (1. TỔ CHỨC SẢN XUẤT 18 ...),
criteria (1.1 ... with max points), options (□ text → points), italic notes ("Yêu cầu: ...", "Ghi chú: ...",
"Chỉ áp dụng khi ..."), and a footer note on star markers (*** = min for 3 sao, **** = 4 sao, ***** = 5 sao).

## Output

Write ONE JSON file (path given in your task). Exact shape:

```json
{
  "pass": "<given>",
  "pageRange": [first, last],
  "sets": [
    {
      "no": 1,
      "name": "Rau, củ, quả, hạt tươi",
      "product": "Thực phẩm",
      "group": "Thực phẩm tươi sống",
      "pdfPages": [18, 22],
      "disqualifiedWhen": "verbatim text after 'Hồ sơ bị loại khi:'",
      "parts": [
        {
          "code": "A", "title": "SẢN PHẨM VÀ SỨC MẠNH CỦA CỘNG ĐỒNG", "max": 40,
          "sections": [
            {
              "code": "1", "title": "TỔ CHỨC SẢN XUẤT", "max": 18,
              "criteria": [
                {
                  "code": "1.1", "title": "Nguồn gốc sản phẩm", "max": 3,
                  "notes": ["Yêu cầu: 100% sản phẩm được trồng trên địa bàn cấp tỉnh"],
                  "options": [
                    { "text": "Sản phẩm được trồng trên địa bàn cấp xã, nhưng có tỷ lệ dưới 50%", "points": 1, "star": null }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "footerNotes": ["verbatim 'Ghi chú:' lines after the table, e.g. the star-marker legend"]
    }
  ],
  "uncertain": [ { "set": 1, "where": "criterion 6.2 option 3", "issue": "points digit blurred, read as 3" } ]
}
```

## Rules

1. Verbatim Vietnamese with full diacritics. Do not paraphrase, fix grammar, or normalize punctuation.
   Drop only the leading "□" box and the trailing asterisks from option text.
2. `star`: 3 if the option text ends with `***`, 4 for `****`, 5 for `*****`, else null. Count asterisks carefully.
   If a criterion title (not an option) carries asterisks, record them in `notes` as written.
3. `points` and every `max` are integers exactly as printed. Never compute or "correct" a number.
4. Italic lines inside the table go into the `notes` of the criterion (or section) they sit under, verbatim.
   A criterion with a single scored line and no □ options (e.g. "2.4. Ghi nhãn hàng hóa có sử dụng song ngữ ... 1")
   gets one option whose text is the criterion title and points = its max.
5. A sheet that spans past your last page: keep reading until the sheet ends. A sheet that started before your
   first page belongs to another agent: skip it.
6. Anything you cannot read with certainty goes in `uncertain`. Do not guess silently.
7. Before writing, self-check: within every criterion, max(option points) == criterion max; sum of criterion max
   == section max; sum of section max == part max; parts sum to 100. If a check fails, re-read those pages; if the
   printed numbers really disagree, keep the printed numbers and add an `uncertain` entry saying so.
8. Validate the file with `python3 -m json.tool <file> > /dev/null`.
9. Work only with the PDF and your output file. No web access. Do not edit any other file.

End your reply with: sets transcribed (numbers), pages covered, count of `uncertain` entries, and any check failures.
