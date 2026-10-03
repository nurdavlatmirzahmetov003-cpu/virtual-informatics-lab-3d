# PC Assembly Lab + progress

- `/labs/assembly`: empty chassis, eight separately selectable licensed GLB components, illuminated target slot, real 3D pointer drag with capture/plane projection, snap tolerance; button/keyboard alternative.
- Dependency rules: CPU/RAM/NVMe require motherboard; cooler requires CPU/RAM; GPU requires motherboard/PSU; cables require all eight components. Wrong slot/order is explained and counted.
- CPU, motherboard, RAM, GPU, PSU and cooling selectors use the same catalog and compatibility rules as Studio. Changes lock after a component is installed. Reset starts a new attempt.
- Power-on validates completeness and compatibility, enables fans/RGB, grades errors/hints without penalizing slow work, saves a result.
- `/progress`: best score per exercise, total points, average, completed (70+), three earned badges, recent attempts. Persistence key `vil3d:progress`, version 1, validates saved records and bounds history to 200. Anatomy quizzes now share persistence.
- Automated checks: build, lint, `test:pc-lab` two substantive tests (dependency/duplicates/coverage, bounded grading/invalid persistence).
- Chromium QA: wrong GPU order explained; full nine actions → 100/100; score survives refresh; CPU actually dragged from desk to socket → 22% completion; production console errors = 0. Mobile 375×812 has no document overflow; internal panel width corrected.
- Limitations: representative source motherboard/CPU geometry, no ESD/thermal-paste physics, no cable-by-cable port exercise; source labels can overlap on narrow screens. Touch hardware and non-Chromium browsers not tested.

Next: networking, algorithms, digital logic and virtual experiments, connected to this shared grading/progress.
