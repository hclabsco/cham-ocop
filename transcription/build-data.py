#!/usr/bin/env python3
"""Build the canonical src/data/sheets.json of the cham-ocop repo.

Base = pass b normalized (keeps sub-criterion headings and a./b. cases as fields), then every
adjudicated reading in resolutions.json is applied. Fails loudly if a resolution cannot be placed.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent / "src" / "data" / "sheets.json"


# Readable URLs for the two longest sheet names; the rest come from slugify(name).
SLUG_OVERRIDES = {
    8: "che-bien-tu-thit-thuy-san-trung-sua-mat-ong",
    26: "du-lich-cong-dong-du-lich-sinh-thai-diem-du-lich",
}


def slugify(name):
    s = unicodedata.normalize("NFD", name.replace("đ", "d").replace("Đ", "D"))
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def crit_map(sheet):
    return {c["code"]: c for p in sheet["parts"] for s in p["sections"] for c in s["criteria"]}


def apply(sheets, resolutions):
    by_no = {s["no"]: s for s in sheets}
    for r in resolutions:
        sheet = by_no[r["set"]]
        where = r["where"].split()
        printed = r["printed"]
        if where[0] == "disqualifiedWhen":
            sheet["disqualifiedWhen"] = printed
            continue
        if where[0] in ("name", "product", "group"):
            sheet[where[0]] = printed
            continue
        crit = crit_map(sheet).get(where[0])
        if crit is None:
            sys.exit(f"resolution for unknown criterion: {r}")
        if where[1] == "title":
            crit["title"] = printed
        elif where[1].startswith("opt"):
            opt = crit["options"][int(where[1][3:]) - 1]
            if where[2] == "text":
                opt["text"] = printed
            elif where[2] == "points":
                opt["points"] = int(printed)
            elif where[2] == "star":
                opt["star"] = None if printed in (None, "null") else int(printed)
        elif where[1] == "notes":
            crit["notes"] = printed if isinstance(printed, list) else [printed]
        elif where[1] == "notes+":
            crit["notes"] = crit["notes"] + [printed]
        else:
            sys.exit(f"unhandled resolution: {r}")


def main():
    sheets = json.loads((HERE / "normalized-b.json").read_text())
    res_file = HERE / "resolutions-applied.json"
    if res_file.exists():
        apply(sheets, json.loads(res_file.read_text()))
    out = []
    for s in sheets:
        parts = []
        for p in s["parts"]:
            sections = []
            for sec in p["sections"]:
                crits = []
                for c in sec["criteria"]:
                    crit = {"code": c["code"], "title": c["title"], "max": c["max"], "notes": c["notes"],
                            "options": [{k: v for k, v in o.items() if v is not None or k == "star"} for o in c["options"]]}
                    if c.get("heading"):
                        crit["heading"] = c["heading"]
                    for o in crit["options"]:
                        if o.get("points") is None:
                            sys.exit(f"set {s['no']} {c['code']}: option without points: {o['text']}")
                    crits.append(crit)
                section = {"code": sec["code"], "title": sec["title"], "max": sec["max"], "criteria": crits}
                if sec.get("notes"):
                    section["notes"] = sec["notes"]
                sections.append(section)
            parts.append({"code": p["code"], "title": p["title"], "max": p["max"], "sections": sections})
        out.append({
            "no": s["no"], "slug": SLUG_OVERRIDES.get(s["no"]) or slugify(s["name"]), "name": s["name"], "product": s["product"],
            "group": s["group"] or "", "pdfPages": s["pdfPages"], "disqualifiedWhen": s["disqualifiedWhen"] or "",
            "parts": parts, "footerNotes": s["footerNotes"],
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {len(out)} sheets to {OUT}")
    print("\n".join(f"{s['no']:>2} {s['slug']}" for s in out))


if __name__ == "__main__":
    main()
