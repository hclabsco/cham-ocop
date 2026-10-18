import { decodeAnswers, encodeAnswers } from "../lib/answers";
import { criteriaOf, gapsTo, scoreSheet, STAR_FLOOR } from "../lib/scoring";
import type { Answers, Sheet, Star } from "../lib/types";

const sheet: Sheet = JSON.parse(document.getElementById("sheet-data")!.textContent!);
const form = document.getElementById("score-form") as HTMLFormElement;
const storageKey = `cham-ocop:${sheet.slug}`;
const criteria = criteriaOf(sheet);
let target: Star | null = null;

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const $$ = (sel: string) => document.querySelectorAll<HTMLElement>(sel);

function el(tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

function readAnswers(): Answers {
  const answers: Answers = {};
  for (const c of criteria) {
    const checked = form.querySelector<HTMLInputElement>(`input[name="${CSS.escape(c.code)}"]:checked`);
    if (checked) answers[c.code] = Number(checked.value);
  }
  return answers;
}

function writeAnswers(answers: Answers) {
  for (const input of form.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
    input.checked = answers[input.name] === Number(input.value);
  }
}

function starsText(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function criterionLink(code: string, title: string) {
  return el("a", { href: `#c-${code}` }, `${code}. ${title}`);
}

function render() {
  const answers = readAnswers();
  const score = scoreSheet(sheet, answers);
  const answered = Object.keys(answers).length;

  for (const node of $$("[data-total]")) node.textContent = String(score.total);
  for (const node of $$("[data-star-short]")) node.textContent = answered === 0 ? "chưa chọn" : `${score.star} sao`;
  $("[data-answered]").textContent = String(answered);
  for (const node of $$("[data-part-score]")) node.textContent = String(score.parts[node.dataset.partScore as "A"]);
  for (const c of criteria) {
    const idx = answers[c.code];
    $(`[data-crit-score="${CSS.escape(c.code)}"]`).textContent = String(idx === undefined ? 0 : c.options[idx].points);
  }

  const starEl = $("[data-star]");
  const note = $("[data-star-note]");
  if (answered === 0) {
    starEl.textContent = "Chưa chọn tiêu chí nào";
    note.textContent = "Bắt đầu từ Phần A bên trái.";
  } else {
    starEl.textContent = `${starsText(score.star)} ${score.star} sao`;
    if (score.star < score.starByScore) {
      note.textContent = `Theo điểm là ${score.starByScore} sao, nhưng còn ${score.blockers.length} tiêu chí chưa đạt mức bắt buộc của hạng ${score.starByScore} sao.`;
    } else if (score.star < 3) {
      note.textContent = "Hạng 1 sao và 2 sao không được cấp giấy chứng nhận.";
    } else {
      note.textContent = score.star === 5 ? "Đủ điều kiện đề nghị đánh giá cấp quốc gia." : "Đủ điều kiện để UBND tỉnh xem xét công nhận.";
    }
  }

  const goal: Star = target ?? (Math.min(5, Math.max(3, score.star + 1)) as Star);
  for (const b of $$("[data-target]")) b.setAttribute("aria-pressed", String(Number(b.dataset.target) === goal));
  renderGaps(answers, goal);
  renderPrintList(answers);

  const encoded = encodeAnswers(sheet, answers);
  history.replaceState(null, "", encoded ? `#a=${encoded}` : location.pathname);
  try {
    localStorage.setItem(storageKey, encoded);
  } catch {
    /* private mode: the link still carries the answers */
  }
}

function renderGaps(answers: Answers, goal: Star) {
  const box = $("[data-gaps]");
  const g = gapsTo(sheet, answers, goal);
  const items: Node[] = [];
  if (g.pointsMissing === 0 && g.requirements.length === 0) {
    items.push(el("p", { class: "m-0 font-bold text-ok" }, `Đã đủ điểm và đủ tiêu chí bắt buộc của hạng ${goal} sao.`));
  } else {
    items.push(
      el(
        "p",
        { class: "m-0" },
        g.pointsMissing > 0
          ? `Cần ít nhất ${STAR_FLOOR[goal]} điểm, còn thiếu `
          : `Đã đủ ${STAR_FLOOR[goal]} điểm. `,
        g.pointsMissing > 0 ? el("strong", {}, `${g.pointsMissing} điểm`) : "",
        g.pointsMissing > 0 ? "." : "",
      ),
    );
  }
  if (g.requirements.length > 0) {
    const list = el("ul", { class: "m-0 mt-1 pl-5 grid gap-1.5" });
    for (const r of g.requirements) {
      list.append(el("li", {}, criterionLink(r.criterion.code, r.criterion.title), el("br"), el("span", { class: "text-ink-soft" }, `Cần: ${r.required.text}`)));
    }
    items.push(el("div", {}, el("p", { class: "m-0 font-bold text-accent" }, `Bắt buộc cho ${goal} sao, chưa đạt (${g.requirements.length}):`), list));
  }
  const ups = g.upgrades.slice(0, 5);
  if (g.pointsMissing > 0 && ups.length > 0) {
    const list = el("ul", { class: "m-0 mt-1 pl-5 grid gap-1.5" });
    for (const u of ups) {
      const gain = u.next.points - (u.current?.points ?? 0);
      list.append(el("li", {}, criterionLink(u.criterion.code, u.criterion.title), el("br"), el("span", { class: "text-ink-soft" }, `Lên mức “${u.next.text}”: +${gain} điểm (tối đa +${u.maxGain})`)));
    }
    items.push(el("div", {}, el("p", { class: "m-0 font-bold" }, "Chỗ còn nhiều điểm nhất:"), list));
  }
  box.replaceChildren(...items);
}

function renderPrintList(answers: Answers) {
  const list = $("[data-print-list]");
  list.replaceChildren(
    ...criteria.map((c) => {
      const o = answers[c.code] === undefined ? null : c.options[answers[c.code]];
      return el("li", {}, `${c.code}. ${c.title}: ${o ? `${o.text} (${o.points}/${c.max})` : `chưa chọn (0/${c.max})`}`);
    }),
  );
}

form.addEventListener("change", render);
for (const b of $$("[data-target]")) {
  b.addEventListener("click", () => {
    target = Number(b.dataset.target) as Star;
    render();
  });
}
$("[data-print]").addEventListener("click", () => window.print());
$("[data-reset]").addEventListener("click", () => {
  if (!confirm("Xoá hết các lựa chọn của phiếu này?")) return;
  writeAnswers({});
  target = null;
  render();
});
$("[data-copy]").addEventListener("click", async () => {
  const status = $("[data-copy-status]");
  try {
    await navigator.clipboard.writeText(location.href);
    status.textContent = "Đã sao chép. Gửi link này, người nhận thấy đúng các lựa chọn của anh chị.";
  } catch {
    status.textContent = "Không sao chép được. Anh chị chép địa chỉ trên thanh trình duyệt.";
  }
});

// A shared link wins over what this browser saved earlier.
const fromHash = new URLSearchParams(location.hash.slice(1)).get("a");
let saved: string | null = null;
try {
  saved = localStorage.getItem(storageKey);
} catch {
  /* storage unavailable */
}
writeAnswers(decodeAnswers(sheet, fromHash ?? saved ?? ""));
render();
