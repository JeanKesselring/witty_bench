# Kanji atlas data

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
