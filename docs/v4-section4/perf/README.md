# 3D lab (/lab), quality Medium — main vs feature/v4-real-hardware

Headless Chrome (GPU, d3d11), 1440×900, dark theme, `scripts/perf-measure.mjs --quality=medium --pages=/lab`,
runs alternated main → feature three times (2026-10-27).

| run | main rAF fps | feature rAF fps | main ms/frame | feature ms/frame |
|-----|-------------:|----------------:|--------------:|-----------------:|
| 1   | 73 | 77 | 9.63 | 9.38 |
| 2   | 85 | 78 | 8.07 | 10.77 |
| 3   | 79 | 73 | 8.39 | 10.33 |
| avg | **79.0** | **76.0** (−3.8 %) | 8.70 | 10.16 |

Scene: main 207 draw calls / 153k triangles; feature 231 calls / 164k triangles (the robots' yard, zone 11).
JS heap 38–48 MB → 66–69 MB. Download before ready ≈ 5.0 MB in both.
