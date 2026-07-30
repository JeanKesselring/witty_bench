#!/usr/bin/env python3
"""Project the local Japanese Knowledge Graph providers into browser data.

The graph remains the source of truth. This script only creates compact,
read-only TypeScript snapshots so the atlas can pan without querying Neo4j.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from xml.etree import ElementTree


FRONTEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JKG_ROOT = FRONTEND_ROOT.parent / "japanese_knowledge_graph"
JKG_ROOT = Path(os.environ.get("JKG_ROOT", DEFAULT_JKG_ROOT)).resolve()
SOURCES = JKG_ROOT / "graph" / "data" / "sources"
OUTPUT = FRONTEND_ROOT / "app" / "data"

# KRADFILE uses ordinary JIS characters as visual stand-ins for component
# variants that were not available in JIS X 0208. These mappings follow the
# Unicode radical mappings documented in the KRADFILE header.
KRAD_PLACEHOLDER_RADICALS = {
    "化": 9,  # person
    "刈": 18,  # knife
    "込": 162,  # walk
    "尚": 42,  # small
    "忙": 61,  # heart
    "扎": 64,  # hand
    "汁": 85,  # water
    "杰": 86,  # fire
    "犯": 94,  # dog
    "礼": 113,  # spirit
    "買": 122,  # net
    "老": 125,  # old
    "艾": 140,  # grass
    "初": 145,  # clothes
    "邦": 163,  # city
    "阡": 170,  # mound
}

# Modern forms and common component variants that map back to the classical
# 214-radical index used by KANJIDIC2.
RADICAL_VARIANTS = {
    "亻": 9,
    "𠆢": 9,
    "刂": 18,
    "忄": 61,
    "扌": 64,
    "攵": 66,
    "旡": 71,
    "歺": 78,
    "母": 80,
    "毋": 80,
    "氵": 85,
    "灬": 86,
    "爫": 87,
    "犭": 94,
    "王": 96,
    "礻": 113,
    "罒": 122,
    "⺲": 122,
    "耂": 125,
    "月": 130,
    "艹": 140,
    "⻀": 145,
    "覀": 146,
    "讠": 149,
    "豕": 152,
    "貓": 153,
    "赱": 156,
    "⻊": 157,
    "辶": 162,
    "阝": 163,
    "釒": 167,
    "镸": 168,
    "門": 169,
    "隺": 172,
    "青": 174,
    "韦": 178,
    "页": 181,
    "飠": 184,
    "饣": 184,
    "麦": 199,
    "黄": 201,
    "黙": 203,
    "斉": 210,
    "歯": 211,
    "竜": 212,
    "亀": 213,
}


def compact(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def parse_kradfile() -> dict[str, list[str]]:
    text = (SOURCES / "kradfile").read_bytes().decode("euc_jp")
    decomposition: dict[str, list[str]] = {}
    for line in text.splitlines():
        if line.startswith("#") or " : " not in line:
            continue
        kanji, components = line.split(" : ", 1)
        decomposition[kanji.strip()] = components.split()
    return decomposition


def parse_kanjidic(selected: set[str]) -> dict[str, dict[str, object]]:
    records: dict[str, dict[str, object]] = {}
    for _, element in ElementTree.iterparse(SOURCES / "kanjidic2.xml", events=("end",)):
        if element.tag != "character":
            continue
        glyph = element.findtext("literal") or ""
        if glyph in selected:
            misc = element.find("misc")
            radical = element.find("radical/rad_value[@rad_type='classical']")
            meanings = [
                meaning.text or ""
                for meaning in element.iter("meaning")
                if not meaning.get("m_lang") and meaning.text
            ]
            on = [
                reading.text or ""
                for reading in element.iter("reading")
                if reading.get("r_type") == "ja_on" and reading.text
            ]
            kun = [
                reading.text or ""
                for reading in element.iter("reading")
                if reading.get("r_type") == "ja_kun" and reading.text
            ]
            records[glyph] = {
                "radical": int(radical.text) if radical is not None and radical.text else 0,
                "strokes": int(misc.findtext("stroke_count") or 0) if misc is not None else 0,
                "meanings": meanings,
                "on": on,
                "kun": kun,
            }
        element.clear()
    return records


def parse_strokes(selected: set[str]) -> dict[str, list[str]]:
    strokes: dict[str, list[str]] = {}
    for _, element in ElementTree.iterparse(SOURCES / "kanjivg.xml", events=("end",)):
        if element.tag != "kanji":
            continue
        code = (element.get("id") or "").replace("kvg:kanji_", "")
        try:
            glyph = chr(int(code, 16))
        except ValueError:
            element.clear()
            continue
        if glyph in selected:
            paths = [
                path.get("d") or ""
                for path in element.iter("path")
                if path.get("d")
            ]
            if paths:
                strokes[glyph] = paths
        element.clear()
    return strokes


def radical_glyphs() -> set[str]:
    glyphs: set[str] = set()
    for line in (OUTPUT / "radicals.ts").read_text().splitlines():
        match = re.match(r"\s*\[\d+, '([^']+)'", line)
        if match:
            glyphs.add(match.group(1))
    return glyphs


def radical_memberships(
    primary: int, components: list[str], glyph_by_radical: dict[str, int]
) -> list[int]:
    memberships = {primary}
    for component in components:
        mapped = (
            KRAD_PLACEHOLDER_RADICALS.get(component)
            or RADICAL_VARIANTS.get(component)
            or glyph_by_radical.get(component)
        )
        if mapped:
            memberships.add(mapped)
    return sorted(memberships)


def write_atlas(
    jlpt: dict[str, dict[str, object]],
    kanjidic: dict[str, dict[str, object]],
    decomposition: dict[str, list[str]],
) -> None:
    radical_file = OUTPUT / "radicals.ts"
    radical_source = radical_file.read_text()
    glyph_by_radical: dict[str, int] = {}
    for line in radical_source.splitlines():
        match = re.match(r"\s*\[(\d+), '([^']+)'", line)
        if match:
            glyph_by_radical[match.group(2)] = int(match.group(1))

    rows: list[list[object]] = []
    for glyph, level_info in jlpt.items():
        level = level_info.get("jlpt_new")
        if level not in {1, 2, 3, 4, 5}:
            continue
        source = kanjidic[glyph]
        components = decomposition[glyph]
        primary = int(source["radical"])
        rows.append(
            [
                glyph,
                primary,
                int(source["strokes"]),
                int(level),
                " / ".join(source["meanings"]),
                "・".join(source["on"]),
                "・".join(source["kun"]),
                components,
                radical_memberships(primary, components, glyph_by_radical),
            ]
        )

    if len(rows) != 2211 or len({row[0] for row in rows}) != 2211:
        raise RuntimeError(f"Expected 2,211 unique graph kanji, got {len(rows)}")

    lines = [
        "// Generated by scripts/generate-kanji-map-data.py.",
        "// Source: the local japanese_knowledge_graph deterministic provider cache.",
        "",
        "export type GraphKanjiRecord = readonly [",
        "  glyph: string,",
        "  primaryRadical: number,",
        "  strokes: number,",
        "  jlpt: 1 | 2 | 3 | 4 | 5,",
        "  meaning: string,",
        "  on: string,",
        "  kun: string,",
        "  components: readonly string[],",
        "  radicalMemberships: readonly number[],",
        "]",
        "",
        "export const GRAPH_KANJI: GraphKanjiRecord[] = [",
        *[f"  {compact(row)}," for row in rows],
        "]",
        "",
    ]
    (OUTPUT / "japanese-knowledge-graph.ts").write_text(
        "\n".join(lines), encoding="utf-8"
    )


def write_strokes(strokes: dict[str, list[str]], selected: set[str]) -> None:
    if selected - strokes.keys():
        raise RuntimeError(
            f"Expected stroke paths for 2,211 graph kanji, got "
            f"{len(selected & strokes.keys())}"
        )
    lines = [
        "// Generated by scripts/generate-kanji-map-data.py from the graph's KanjiVG provider input.",
        "// KanjiVG is CC BY-SA 3.0: https://kanjivg.tagaini.net/",
        "",
        "export const KANJI_STROKES: Record<string, readonly string[]> = {",
        *[f"  {compact(glyph)}: {compact(paths)}," for glyph, paths in strokes.items()],
        "}",
        "",
    ]
    (OUTPUT / "kanji-strokes.ts").write_text("\n".join(lines), encoding="utf-8")


def write_readme() -> None:
    text = """# Kanji atlas data

The atlas is a browser-optimized projection of the sibling
`japanese_knowledge_graph` repository. Run
`python3 scripts/generate-kanji-map-data.py` after refreshing that graph's
deterministic provider inputs.

- `japanese-knowledge-graph.ts`: all 2,211 N1–N5 kanji selected by the graph's
  KANJIDIC provider, including KANJIDIC2 meanings/readings/stroke counts,
  KANJIDIC classical radical assignments, and KRADFILE `MADE_OF` memberships.
- `kanji-strokes.ts`: the graph's ordered KanjiVG `visual_stroke_order` paths
  for all atlas kanji and every canonical radical available in KanjiVG, loaded
  lazily only when a detail panel is opened.
- `radicals.ts`: the 214-radical display index used to present KANJIDIC
  classical radical numbers.

Source licenses and release obligations are documented in
`../japanese_knowledge_graph/resources.md`. KANJIDIC2 and KRADFILE require
EDRDG attribution. KanjiVG is CC BY-SA 3.0 and requires attribution and
share-alike handling for derived stroke data.
"""
    (OUTPUT / "README.md").write_text(text, encoding="utf-8")


def main() -> None:
    required = ("kanji_jlpt.json", "kanjidic2.xml", "kradfile", "kanjivg.xml")
    missing = [name for name in required if not (SOURCES / name).exists()]
    if missing:
        raise SystemExit(
            f"Japanese Knowledge Graph source cache is missing: {', '.join(missing)}"
        )

    jlpt = json.loads((SOURCES / "kanji_jlpt.json").read_text())
    selected = {
        glyph
        for glyph, values in jlpt.items()
        if values.get("jlpt_new") in {1, 2, 3, 4, 5}
    }
    decomposition = parse_kradfile()
    kanjidic = parse_kanjidic(selected)
    strokes = parse_strokes(selected | radical_glyphs())

    if selected - kanjidic.keys():
        raise RuntimeError("KANJIDIC2 is missing selected graph kanji")
    if selected - decomposition.keys():
        raise RuntimeError("KRADFILE is missing selected graph kanji")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    write_atlas(jlpt, kanjidic, decomposition)
    write_strokes(strokes, selected)
    write_readme()
    print(
        f"Generated {len(selected):,} graph kanji, "
        f"{sum(len(decomposition[glyph]) for glyph in selected):,} component edges, "
        f"and {sum(len(paths) for paths in strokes.values()):,} stroke paths."
    )


if __name__ == "__main__":
    main()
