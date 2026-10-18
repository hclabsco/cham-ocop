import { renewalStatus, type RenewalState } from "../lib/calendar";
import { formatDate, todayInVietnam } from "../lib/format";

const form = document.getElementById("renewal-form") as HTMLFormElement;
const input = document.getElementById("issued") as HTMLInputElement;
const out = document.querySelector<HTMLElement>("[data-renewal-result]")!;

function row(label: string, value: string, strong = false) {
  const p = document.createElement("p");
  p.className = "m-0 flex flex-wrap justify-between gap-2 border-t border-line pt-3";
  const l = document.createElement("span");
  l.textContent = label;
  const v = document.createElement(strong ? "strong" : "span");
  v.textContent = value;
  p.append(l, v);
  return p;
}

const MESSAGES: Record<RenewalState, { text: (days: number) => string; tone: string }> = {
  truoc_khoang_nop: { text: (d) => `Chưa tới lúc nộp. Còn ${d} ngày nữa mới mở khoảng nộp hồ sơ.`, tone: "bg-bg-warm" },
  dang_trong_khoang: { text: (d) => `Đang trong khoảng nộp hồ sơ đánh giá lại. Còn ${d} ngày đến hạn chót.`, tone: "bg-ok-soft" },
  qua_han_nop: { text: () => "Đã quá hạn chót nộp hồ sơ đánh giá lại. Xem đoạn “Lỡ khoảng nộp?” bên dưới.", tone: "bg-accent-soft" },
  het_han: { text: () => "Giấy chứng nhận đã hết hạn.", tone: "bg-accent-soft" },
};

function show() {
  out.replaceChildren();
  if (!input.value) {
    out.append(Object.assign(document.createElement("p"), { className: "m-0 text-accent", textContent: "Anh chị chọn ngày ban hành trước." }));
    return;
  }
  const w = renewalStatus(input.value, todayInVietnam());
  const m = MESSAGES[w.state];
  const banner = Object.assign(document.createElement("p"), { className: `m-0 rounded-[8px] p-3 font-bold ${m.tone}`, textContent: m.text(w.daysLeft) });
  out.append(
    banner,
    row("Hết hạn", formatDate(w.expiresOn), true),
    row("Nộp hồ sơ đánh giá lại sớm nhất", formatDate(w.submitFrom)),
    row("Nộp hồ sơ đánh giá lại muộn nhất", formatDate(w.submitBy), true),
  );
  history.replaceState(null, "", `#ngay=${input.value}`);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  show();
});

const fromHash = new URLSearchParams(location.hash.slice(1)).get("ngay");
if (fromHash && /^\d{4}-\d{2}-\d{2}$/.test(fromHash)) {
  input.value = fromHash;
  show();
}
