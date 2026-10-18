#!/usr/bin/env python3
"""Normalize the two independent transcriptions (pass a / pass b) and list every disagreement.

Usage: python3 compare.py            -> prints diffs, writes normalized-a.json / normalized-b.json
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).parent


def norm_text(s):
    if s is None:
        return None
    s = unicodedata.normalize("NFC", s)
    s = s.replace("…", "...").replace("–", "-").replace("—", "-")
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s*\*+\s*$", "", s)  # stray trailing markers
    s = re.sub(r"^□\s*", "", s)
    return s


def norm_option(o):
    return {
        "text": norm_text(o["text"]),
        "points": o.get("points"),
        "star": o.get("star"),
        "case": norm_text(o.get("case") or o.get("group")),
    }


def flatten_section(section):
    """Every section ends as a flat list of scored criteria."""
    out = []
    crits = section.get("criteria") or []
    if not crits and section.get("options"):
        crits = [{
            "code": section["code"], "title": section["title"], "max": section["max"],
            "notes": section.get("notes", []), "options": section["options"],
        }]
    for c in crits:
        children = c.get("criteria") or []
        if children:  # nested sub-criteria (6.1 -> 6.1.1 ...)
            heading = f'{c["code"]}. {norm_text(c["title"])}'
            for ch in children:
                out.append(dict(ch, heading=heading, parentMax=c.get("max")))
        else:
            out.append(c)
    return out


def normalize(sheet):
    parts = []
    for p in sheet["parts"]:
        sections = []
        for s in p["sections"]:
            crits = []
            for c in flatten_section(s):
                crits.append({
                    "code": c["code"].rstrip("."),
                    "title": norm_text(c["title"]),
                    "max": c["max"],
                    "heading": c.get("heading"),
                    "notes": [norm_text(n) for n in c.get("notes", []) if n],
                    "options": [norm_option(o) for o in c.get("options", [])],
                })
            sections.append({
                "code": s["code"].rstrip("."), "title": norm_text(s["title"]), "max": s["max"],
                "notes": [norm_text(n) for n in s.get("notes", []) if n] if s.get("criteria") else [],
                "criteria": crits,
            })
        parts.append({"code": p["code"], "title": norm_text(p["title"]), "max": p["max"], "sections": sections})
    return {
        "no": sheet["no"], "name": norm_text(sheet["name"]), "product": norm_text(sheet.get("product")),
        "group": norm_text(sheet.get("group")), "pdfPages": sheet["pdfPages"],
        "disqualifiedWhen": norm_text(sheet.get("disqualifiedWhen")),
        "footerNotes": [norm_text(n) for n in sheet.get("footerNotes", [])],
        "parts": parts,
    }


def load(prefix):
    sets = {}
    for f in sorted(HERE.glob(f"{prefix}-*.json")):
        try:
            data = json.loads(f.read_text())
        except json.JSONDecodeError as e:
            print(f"SKIP {f.name}: {e}", file=sys.stderr)
            continue
        for s in data["sets"]:
            if s["no"] in sets:
                print(f"WARN duplicate set {s['no']} in {f.name}", file=sys.stderr)
            sets[s["no"]] = normalize(s)
    return sets


def crit_index(sheet):
    return {c["code"]: (p["code"], s["code"], c) for p in sheet["parts"] for s in p["sections"] for c in s["criteria"]}


def compare(a, b):
    diffs = []
    for no in sorted(set(a) | set(b)):
        if no not in a or no not in b:
            diffs.append((no, "-", "missing in " + ("a" if no not in a else "b")))
            continue
        sa, sb = a[no], b[no]
        for k in ("name", "product", "group", "pdfPages", "disqualifiedWhen"):
            if sa[k] != sb[k]:
                diffs.append((no, k, f"a={sa[k]!r}\n      b={sb[k]!r}"))
        ia, ib = crit_index(sa), crit_index(sb)
        if list(ia) != list(ib):
            diffs.append((no, "codes", f"a={list(ia)}\n      b={list(ib)}"))
        for code in ia:
            if code not in ib:
                continue
            ca, cb = ia[code][2], ib[code][2]
            if ca["title"] != cb["title"]:
                diffs.append((no, code + " title", f"a={ca['title']!r}\n      b={cb['title']!r}"))
            if ca["max"] != cb["max"]:
                diffs.append((no, code + " max", f"a={ca['max']} b={cb['max']}"))
            if len(ca["options"]) != len(cb["options"]):
                diffs.append((no, code + " options", f"a={len(ca['options'])} b={len(cb['options'])}"))
            for i, (oa, ob) in enumerate(zip(ca["options"], cb["options"])):
                for k in ("points", "star"):
                    if oa[k] != ob[k]:
                        diffs.append((no, f"{code} opt{i+1} {k}", f"a={oa[k]} b={ob[k]}  ({oa['text'][:60]})"))
                if oa["text"] != ob["text"]:
                    diffs.append((no, f"{code} opt{i+1} text", f"a={oa['text']!r}\n      b={ob['text']!r}"))
            if ca["notes"] != cb["notes"]:
                diffs.append((no, code + " notes", f"a={ca['notes']}\n      b={cb['notes']}"))
    return diffs


if __name__ == "__main__":
    a, b = load("a"), load("b")
    (HERE / "normalized-a.json").write_text(json.dumps([a[k] for k in sorted(a)], ensure_ascii=False, indent=1))
    (HERE / "normalized-b.json").write_text(json.dumps([b[k] for k in sorted(b)], ensure_ascii=False, indent=1))
    diffs = compare(a, b)
    kinds = {}
    for no, where, what in diffs:
        kind = where.split()[-1]
        kinds[kind] = kinds.get(kind, 0) + 1
        print(f"[{no:>2}] {where}: {what}")
    print("\nsets a:", sorted(a), "\nsets b:", sorted(b))
    print("diff counts by kind:", kinds)
