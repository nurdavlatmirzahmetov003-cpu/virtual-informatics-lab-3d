# V4 §6 — FPS vs main

Built sites (`vite preview`), headless Chrome on this PC's Intel UHD (ANGLE D3D11), light theme,
`scripts/perf-measure.mjs` (rAF FPS over 5 s, draw calls, ms per frame). main = 3e9ce18.

| Page | Low: main | Low: V4 | Medium: main | Medium: V4 |
|---|---|---|---|---|
| / (home) | 86 fps · 163 calls | 83 fps · 171 calls | 76 fps · 148 calls | 71 fps · 158 calls |
| /lab | 138 · 207 | 134 · 210 | 129 · 207 | 122 · 216 |
| /explorer | 85 · 63 | 85 · 63 | 74 · 61 | 73 · 67 |
| /labs/assembly | 79 · 136 | 82 · 130 | 71 · 134 | 74 · 134 |
| /studio | 104 · 23 | 102 · 23 | 99 · 21 | 100 · 27 |

The folding panels are plain HTML over the canvas; the differences are within run-to-run noise
(the few extra draw calls at home come from the §1–3 scene, the presenter robot on the desk).
/labs/connect has its own canvas without the site's frame probe, so it is not measured here.
