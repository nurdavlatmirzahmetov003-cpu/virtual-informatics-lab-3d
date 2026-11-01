# V4 §13 — FPS and draw calls vs main (headless Chrome, GPU, 1440×900, 2026-11-01)

Branch: production build of `feature/v4-real-hardware` (0.38.0). Main: `3e9ce18` (D:/il-main-baseline). Builds alternate in every round; the median is used because one run in a few drops by half on this laptop GPU.

## Low and Medium — 4 rounds (budget: no more than 5 % below main)

| page / quality | main fps (median) | branch fps (median) | change | draw calls main → branch |
|---|---|---|---|---|
| / low | 89 / 92 / 91 / 92 (91.5) | 88 / 87 / 88 / 87 (87.5) | -4.4 % | 163 → 170 |
| /lab low | 149 / 146 / 146 / 149 (147.5) | 140 / 138 / 139 / 139 (139.0) | -5.8 % | 207 → 221 |
| /studio low | 110 / 110 / 110 / 111 (110.0) | 112 / 111 / 111 / 111 (111.0) | 0.9 % | 23 → 22 |
| / medium | 79 / 80 / 80 / 79 (79.5) | 76 / 76 / 78 / 79 (77.0) | -3.1 % | 161 → 65 |
| /lab medium | 136 / 138 / 136 / 138 (137.0) | 130 / 130 / 129 / 133 (130.0) | -5.1 % | 207 → 229 |
| /studio medium | 102 / 103 / 104 / 104 (103.5) | 105 / 104 / 105 / 104 (104.5) | 1.0 % | 21 → 27 |

## High — 2 rounds (no budget; noisy)

| page / quality | main fps | branch fps | change | draw calls main → branch |
|---|---|---|---|---|
| / high | 13 / 33 (23.0) | 15 / 23 (19.0) | -17.4 % | 41 → 150 |
| /lab high | 40 / 42 (41.0) | 40 / 41 (40.5) | -1.2 % | 207 → 254 |
| /studio high | 35 / 39 (37.0) | 39 / 39 (39.0) | 5.4 % | 21 → 27 |

## Does Sections 10–13 cost anything? /lab, the commit before §10 (1049a69) vs now, 3 rounds alternating

| quality | before §10 | now | draw calls |
|---|---|---|---|
| Low | 120 / 122 / 123 | 122 / 123 / 123 | 221 = 221 |
| Medium | 115 / 116 / 114 | 118 / 117 / 117 | 231 = 231 |

Sections 10–13 add no 3D cost. The 3D lab's gap to main (−5.8 % Low, −5.1 % Medium) comes from Section 4's robots' yard (+14 draw calls on Low, +22 on Medium; measured −3.8 % to −4.8 % then). Home and Setup Studio are within budget (−4.4 % / −3.1 %; +0.9 % / +1.0 %). Bit's step-aside measures the page only after it changed (no cost on a still 3D page).
