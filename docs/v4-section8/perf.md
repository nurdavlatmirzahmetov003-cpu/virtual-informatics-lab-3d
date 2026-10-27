# Section 8 — FPS (headless Chrome, GPU, 1440×900, dark theme, 2026-10-27)

Section 8 adds no 3D: the certificate, celebration and demo mode are 2D pages and overlays.

## Section 8 vs the end of Section 4 (commit 7054a41), 3 runs alternating

| page / quality | Section 4 fps | Section 8 fps | change | draw calls |
|---|---|---|---|---|
| /lab Low | 119 / 118 / 119 (118.7) | 107 / 118 / 118 (114.3) | −3.7 % (noise; first run warm-up) | 221 = 221 |
| /lab Medium | 112 / 107 / 112 (110.3) | 104 / 111 / 106 (107.0) | −3.0 % | 230–231 both |
| / Medium | 70 / 58 / 60 (62.7) | 56 / 69 / 68 (64.3) | +2.7 % | same |

## Branch vs main

| page / quality | main fps | branch fps | change |
|---|---|---|---|
| /lab Low (3 runs) | 111 / 112 / 112 (111.7) | 109 / 103 / 107 (106.3) | −4.8 % |
| /lab Medium (2 runs) | 81 / 102 (91.5) | 91 / 88 (89.5) | −2.2 % |

An earlier 2-run Low /lab pair (main 112/115, branch 96/98, −14.5 %) did not repeat in the 3-run alternation above; the home page on Medium varies ±10 fps between identical runs (53–70) on this laptop GPU.
