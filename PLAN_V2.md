# VIRTUAL INFORMATICS LAB 3D — V2 PLAN (large lab + learning platform)

Created: 2026-10-10. Baseline: Phases 0–9 are complete (see `PROJECT_STATE.md`).
This file is the structured version of the owner's V2 requests plus a ready-to-paste prompt for every stage.
**One stage = one session** (sized to fit a usage limit); large stages are split into `a / b`.
The site UI stays trilingual (Kazakh first, then Russian, English). The owner reads Kazakh: always give the end-of-session summary in Kazakh.

---

## 1. Vision (owner requirements, structured)

1. **A large 3D laboratory**
   - Replace the single small desk with a spacious lab room divided into zones.
   - Brighter look with tasteful gradients, while keeping the premium, non-childish quality.
2. **50+ devices, all in 3D, each viewable in 360°**
   - **PC internals:** CPU, air and liquid coolers, motherboard, RAM, GPU, PSU, case, case fans, thermal paste, internal cables.
   - **Storage:** 3.5″ HDD, 2.5″ HDD, SATA SSD, NVMe SSD, USB flash drive, SD/microSD card, external drive, CD/DVD disc and drive.
   - **Input:** keyboard, mouse, graphics tablet, gamepad, microphone, webcam, scanner.
   - **Output:** monitor, laser printer, inkjet printer, projector, speakers, headphones.
   - **Networking:** router, switch, modem, Wi-Fi adapter, network card, Ethernet cable.
   - **Other computing devices:** laptop, all-in-one PC, smartphone, tablet, smartwatch, 3D printer, UPS, docking station, USB hub, card reader.
3. **Teardown animations**
   - System unit, laptop, all-in-one, smartphone, tablet and 3D printer open up with polished animations (exploded views).
   - Each internal part is labelled and its function explained.
4. **A distinct 3D model per product**
   - In Setup Studio, choosing an ASUS monitor shows an ASUS-like model and choosing a Samsung monitor shows a different one.
   - Products must not look identical.
   - Sources: licensed GLBs (Sketchfab, Poly Haven, etc.) plus variants built or edited in Blender.
5. **High model quality without hurting weak machines**
   - The owner's laptop is powerful, but students will use weaker computers.
   - Heavy, high-detail models load only on High/Ultra; Low/Medium get LOD versions.
   - Fix aliasing (jagged edges) and blurry or pixelated textures.
6. **Cables and ports**
   - Students physically connect devices: monitor via HDMI/DisplayPort, keyboard, mouse and speakers via USB or 3.5 mm.
   - Wrong ports produce an explanation.
7. **Networking**
   - Teach connecting via Ethernet (router → PC / laptop / all-in-one port).
   - Teach joining Wi-Fi correctly and securely.
8. **Cause-and-effect simulation**
   - **No cooler:** CPU temperature rises, alarm, throttling, shutdown.
   - **No RAM:** POST beep, no boot.
   - **Storage type:** HDD boots slowly, SSD/NVMe boots fast.
   - **No GPU:** heavy apps fail; with no integrated GPU (e.g. Intel F-series) there is no picture at all.
   - **Weak PSU:** shutdowns under load.
   - All shown with warnings and animations.
9. **Audience:** school students **and** adults learning computer hardware.
10. **Platform with a database and three roles**
    - **Admin:** security, users, content, settings.
    - **Teacher:**
      - registers students (class codes);
      - publishes assignments and announcements;
      - sees student work and grades it.
    - **Student:**
      - completes lab tasks and gets grades;
      - competes with classmates.
11. **Gamification (top priority for the platform)**
    - XP, levels, badges, leaderboards.
    - Live online quizzes with many students at once.
    - Simultaneous PC-assembly races.
    - Daily challenges and class-vs-class contests.
12. **Hosting and data**
    - Build everything **offline and local first**, architected for a real database, a domain and hosting.
    - Buying hosting and a domain is a later stage and the owner's decision.

---

## 2. Constraints and decisions (read before every stage)

- **Website logins, downloads and accounts**
  - Some work needs a logged-in website: Sketchfab downloads, CGTrader, GitHub, hosting dashboards, etc. When that happens, **stop and tell the owner exactly which site and why**.
  - **The owner logs in themselves** in the browser.
  - Never type passwords, never create accounts, and ask before every file download (state file name, source and size).
  - Paid assets or services are the owner's decision: report the options with prices.
- **Asset licensing**
  - Only CC0 or CC BY assets.
  - Every asset gets an entry in `ASSET_MANIFEST.md` and attribution on `/credits`.
  - Trademarks (logos) are removed from textures; brand names appear only as UI text.
- **Per-product models**
  - Not every one of the 67+ catalog products will have a free model.
  - Where none exists, derive a variant in Blender: shape, size, bezel, stand, ports, colour. Similar products should look similar but never identical.
- **Blender 5.1 is installed**
  - Path: `C:\Program Files\Blender Foundation\Blender 5.1`.
  - Drive it headless with Python scripts (in `scripts/blender/`) for:
    - cleanup;
    - splitting into parts (teardown);
    - port markers (empty nodes);
    - LODs;
    - export.
- **Database**
  - Use Node 24's built-in SQLite (`node:sqlite`) locally, with a PostgreSQL-compatible schema and migrations, so production can move to PostgreSQL/Supabase.
  - Passwords are stored only as scrypt hashes.
  - Secrets and API keys live only on the server in `.env`, never in browser code.
- **Children's data**
  - Collect the minimum: display name, class, login. Email is optional; teachers register students.
  - Note Kazakhstan's personal-data law before going online.
- **Performance**
  - Heavy assets only on High/Ultra; zones are lazy-loaded and disposed on exit (`src/lib/three/assetCache.ts`).
  - Never load all 50+ models at once.
  - Measure before/after every stage with `npm run build && npm run preview` + `node scripts/perf-measure.mjs` (see README).
- **KTX2**
  - V2 introduces UASTC KTX2 for hero models on High/Ultra (lower GPU memory, high quality, larger downloads).
  - If an encoder (toktx/basisu) must be installed, ask the owner first.

---

## 3. Global rules (append to every stage prompt)

```
Global rules:
- First read PROJECT_STATE.md, PLAN_V2.md, ROADMAP.md, TODO.md, ARCHITECTURE.md, ASSET_MANIFEST.md and KNOWN_ISSUES.md, and check NEXT_ACTION. Never restart the project from scratch and never break existing sections.
- All user-facing text goes into the locale files (src/locales/kk.json, ru.json, en.json); Kazakh is the reference language.
- Assets: only CC0 / CC BY, recorded in ASSET_MANIFEST.md and shown on /credits; remove logos from textures.
- Logins and downloads: if any website requires signing in (Sketchfab, CGTrader, GitHub, hosting, etc.), STOP and tell me which site and why — I will log in myself. Never enter passwords or create accounts. Ask before each download (file name, source, size). Paid options: list them with prices and let me decide.
- Security: secrets only on the server in .env, never in browser code; passwords only as hashes.
- Performance: at the end, run `npm run build && npm run preview` and `node scripts/perf-measure.mjs` and compare before/after; Low/Medium must not get slower. If something must get heavier, explain why.
- Never degrade the visual quality; if a trade-off is needed, ask me.
- npm run build, npm run lint, typecheck and npm test must pass; fix console errors; write tests for new logic.
- Make a git commit, update PROJECT_STATE.md and finish it with NEXT_ACTION.
- Finally, give me a short summary in Kazakh: what was done (with numbers) and what I should test.
```

---

## 4. Stages

| # | Stage | Main result |
|---|---|---|
| V2-0 ✅ | Audit, device catalog, asset plan | 50+ device list, source and licence per model, Blender pipeline proven — done 2026-10-10 (AUDIT_V2.md, DEVICE_CATALOG.md, ASSET_SOURCING.md, scripts/blender) |
| V2-1 ✅ | Visual quality and brighter style | Anti-aliasing, texture sharpness, 2K/KTX2 hero assets, bright gradient theme |
| V2-2a ✅ / V2-2b ✅ | High-quality, per-product models | Every catalog product has its own model; heavy models with LODs |
| V2-3 ✅ | The large lab space | Zones, navigation, minimap, lazy zones |
| V2-4a ✅ / V2-4b ✅ | 50+ devices with 360° viewer | Every device in 3D with info and a quiz |
| V2-5a ✅ / V2-5b ✅ | Teardown animations | PC, laptop, smartphone, tablet, all-in-one, 3D printer |
| V2-6 ✅ | Cables, ports, networking | HDMI/DP/USB/3.5 mm/Ethernet connecting, Wi-Fi setup |
| V2-7 ✅ | Cause-and-effect simulation | What happens without cooler/RAM/GPU/storage/enough PSU |
| V2-8 ✅ | Backend and database | Local server, SQLite (PostgreSQL-compatible), auth, 3 roles |
| V2-9 ✅ | Teacher and student dashboards | Classes, assignments, announcements, grading |
| V2-10 | Admin panel | Users, content, audit log, security, backups |
| V2-11a/b | Gamification v2 and real-time | XP, levels, leaderboards, live quizzes, assembly races |
| V2-12 | QA, security, hosting readiness | Tests, audit, Docker, deployment guide |

Order: V2-0 → V2-1 → … → V2-12. **Owner decision (2026-10-10): build everything fully local first (no GitHub/cloud for now); buying a domain and hosting comes only after the local version is 100% complete.** The backend (V2-8) does not depend on the 3D stages and may start any time after V2-3 if preferred.

---

## 5. Stage prompts

### V2-0 — Audit, device catalog, asset plan

```
Project: D:\informatics-lab (Virtual Informatics Lab 3D). Follow the "Global rules" in PLAN_V2.md and read PLAN_V2.md sections 1–3 in full.

This session is stage V2-0 — Audit and planning (mostly documents, little code):

1. Audit the current 3D quality. Capture screenshots with `node scripts/perf-measure.mjs --shots=...`, and record polygon counts, texture sizes, aliasing (jagged edges) and blurry/pixelated textures, with causes. Write the findings to AUDIT_V2.md.

2. Create DEVICE_CATALOG.md with 50+ devices grouped by category (PC internals, storage, input, output, networking, mobile/other; see PLAN_V2.md §1.2). For each device:
   - name in kk / ru / en;
   - what it does, explained at two levels (school student / adult);
   - whether it gets a teardown (exploded view) and which parts;
   - its ports and connectors;
   - which lab zone it belongs to;
   - quiz topics.

3. Create ASSET_SOURCING.md for every device and for every product in src/data/hardware/catalog.ts (67 products):
   - the candidate model source (Sketchfab / Poly Haven / other) with URL;
   - licence (CC0 or CC BY only) and author;
   - quality (polygon count, texture resolution);
   - if no free model exists, how it will be derived in Blender (base model + specific edits).
   Include a plan that makes same-category products from different brands (e.g. ASUS vs Samsung monitors) clearly different.

4. Prove the Blender 5.1 headless pipeline (C:\Program Files\Blender Foundation\Blender 5.1\blender.exe, run with --background --python). The pipeline is: GLB import → cleanup → split into named parts for teardown → port markers as empty nodes → LOD generation → GLB export. Put a small working example script in scripts/blender/ and run it on one existing model. Document the steps in ASSET_SOURCING.md.

5. Give me, at the end:
   (a) the list of models I must download or log in for, with exact URLs (I will sign in; ask before downloading);
   (b) what you can produce yourself in Blender;
   (c) any paid models worth buying, with prices.

Do not change site code in this stage except scripts/blender and documentation.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-1 — Visual quality and a brighter style

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md. Read AUDIT_V2.md.

This session is stage V2-1 — Visual quality:

1. Anti-aliasing:
   - verify MSAA/SMAA on High/Ultra;
   - add a light SMAA/FXAA pass on Medium;
   - raise the devicePixelRatio cap to 1.5–2 on capable devices;
   - compare jagged edges in before/after screenshots.

2. Texture sharpness:
   - anisotropic filtering (8–16) and mipmaps on all textures;
   - 2K textures for hero and close-up views on High/Ultra only, as separate files loaded on demand;
   - UASTC KTX2 for hero models. If an encoder must be installed, ask me first.

3. A brighter style:
   - update the theme tokens (dark and light themes), add tasteful background gradients, make the lighting/HDRI slightly brighter;
   - keep the premium look and readability (text contrast ≥ 4.5:1).

4. Re-measure all quality presets (Low–Ultra) with perf-measure and add the table to PROJECT_STATE.md.

Low/Medium FPS must not drop.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-2a — Asset pipeline v2 and batch 1 (peripherals and furniture)

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md. Read ASSET_SOURCING.md.

This session is stage V2-2a — High-quality models, batch 1:

1. Extend scripts/optimize-assets.mjs:
   - three quality levels per product: `<name>.glb` (High/Ultra, up to 2K textures), `<name>_lod1.glb` (Medium) and `<name>_lod2.glb` (Low);
   - one file per product;
   - integration with the Blender scripts in scripts/blender.

2. Process the new source models in assets-src/ for monitors, keyboards, mice, headsets, speakers, chair and desk (replace the procedural placeholders). If any source still needs downloading, tell me which site and URL — I will log in.

3. In src/data/hardware/catalog.ts, give every product its own modelPath, so that in Setup Studio an ASUS monitor and a Samsung monitor look different. Where sources are identical, derive variants in Blender (shape, stand, bezel, colour).

4. Remove logos from textures; brands appear only in the UI.

5. Check visually with screenshots and measure performance; Low/Medium must not get slower.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-2b — Batch 2 (PC components)

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-2b — High-quality models, batch 2:

1. A model per product for every PC component: CPUs, air and liquid coolers, motherboards, RAM, GPUs, SATA and NVMe SSDs, HDDs, PSUs, cases and fans.

2. In Blender, mark ports and slots on cases and motherboards as named empty nodes (e.g. port_hdmi_1, slot_pcie_x16, header_24pin). Stages V2-6 (cables) and V2-7 (simulation) will use them.

3. Make the PC Assembly Lab, the home-page exploded view (PCCase, HardwareParts) and Setup Studio work with the new models.

4. Compare before/after with screenshots and performance measurements.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-3 — The large lab space

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md. Read the zones in DEVICE_CATALOG.md.

This session is stage V2-3 — The large 3D lab:

1. Build a spacious lab room with zones:
   - Workstation (current desk setup);
   - PC Assembly Station;
   - Storage;
   - Mobile Devices;
   - Printing & Scanning;
   - Networking Corner;
   - Input/Output Devices;
   - Showcase.
   Use a bright, gradient-accented premium interior.

2. Navigation:
   - a minimap;
   - animated camera flights between zones;
   - orbit and zoom with mouse and touch;
   - Esc returns to the overview;
   - full keyboard control for accessibility.

3. Lazy zones: load only the models of the visible or nearby zone; dispose zones you leave, using src/lib/three/assetCache.ts. Never load all 50+ models at once.

4. Keep the cinematic home page. Its "Enter the lab" button leads into the new space.

5. Performance: the initial load must not exceed the current home page.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-4a — Devices part 1: PC internals, storage, input/output, with 360° viewer

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-4a — Devices, part 1:

1. Place the devices from DEVICE_CATALOG.md into their zones:
   - storage: 3.5″ and 2.5″ HDD, SATA SSD, NVMe, USB flash drive, SD card, external drive, CD/DVD;
   - printing and input/output: laser and inkjet printers, scanner, projector, graphics tablet, gamepad, etc.

2. For each device:
   - a 360° viewer (rotate, zoom);
   - an info panel with name, function, specs, ports and real-world use, written at two levels (school student / adult);
   - a 3-question quiz graded with services/grading and saved to progress.

3. Extend the Hardware Explorer, or turn it into the in-lab viewer, with category filters and search.

4. All text in kk/ru/en.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-4b — Devices part 2: networking, mobile and other

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-4b — Devices, part 2:

1. Add the remaining devices:
   - networking: router, switch, modem, Wi-Fi adapter, network card, cables;
   - mobile and other: laptop, all-in-one, smartphone, tablet, smartwatch, 3D printer, UPS, docking station, USB hub, card reader.

2. Give each the same 360° viewer, info panel and quiz as in V2-4a.

3. Register the new tasks in src/services/progress/catalog.ts and update its tests.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-5a — Teardown: system unit and laptop

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-5a — Teardown animations, part 1:

1. Build a reusable Teardown system:
   - the device separates into labelled parts (exploded view);
   - each part has a label and an explanation of its function;
   - an assemble/disassemble slider;
   - a step-by-step mode that removes parts one at a time;
   - support for prefers-reduced-motion.

2. System unit: the side panel opens, then the parts come out in a realistic order.

3. Laptop:
   - the lid opens;
   - the bottom cover comes off;
   - then the battery, motherboard, RAM, SSD, Wi-Fi module, cooling, speakers and display cable come out.

4. Split the models into named parts with the Blender scripts (scripts/blender).

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-5b — Teardown: smartphone, tablet, all-in-one, 3D printer

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-5b — Teardown animations, part 2:

1. Smartphone: display, battery, mainboard/SoC, cameras, speaker, vibration motor, SIM tray.
2. Tablet.
3. All-in-one PC: the components behind the screen.
4. 3D printer: extruder, heated bed, stepper motors, control board, plus an animation of the printing process.

Give each device a short task ("What does this part do?") graded with services/grading.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-6 — Cables, ports and networking

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-6 — Connection lab:

1. Ports: HDMI, DisplayPort, USB-A/C, 3.5 mm audio, Ethernet (RJ-45) and power.
   - Each port sits at its real location, using the port markers from V2-2b.
   - Hovering or approaching a port shows its name.

2. Connecting cables:
   - drag a cable and plug it into the right port; cables bend realistically (tube/spline);
   - monitor → system unit via HDMI/DP, plugged into the graphics card (explain why not into the motherboard when a GPU is present);
   - keyboard and mouse → USB;
   - speakers → 3.5 mm or USB;
   - wrong ports give a clear explanation in Kazakh.

3. Networking:
   - Ethernet from a router to the PC, laptop or all-in-one port;
   - joining Wi-Fi: choose the network, enter the key, prefer WPA2/WPA3 and explain why open networks are risky;
   - getting an IP via DHCP, linked to the existing Network Lab.

4. Graded tasks (services/grading):
   - "Fully connect the computer";
   - "Connect the laptop to the network via Ethernet";
   - "Join Wi-Fi securely".

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-7 — Cause-and-effect simulation

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-7 — "What happens if a part is missing?". Put the logic in src/labs/SystemSim/, separate from the UI, with tests.

1. Simulate powering on a build with realistic behaviour:
   - no or weak cooler: the CPU temperature rises on a live graph, then warning, throttling and emergency shutdown (reuse src/labs/Experiments/cpuTemp);
   - no RAM: POST beep code, black screen, explanation;
   - no storage: "Boot device not found";
   - HDD vs SSD vs NVMe: compare boot times;
   - no graphics card: a CPU with integrated graphics still shows a picture but heavy apps/games fail; a CPU without integrated graphics (e.g. Intel F-series) shows no picture at all;
   - insufficient PSU: shutdown under load;
   - monitor cable in the wrong port: no signal.

2. Feedback:
   - red alert flashes and a thermometer;
   - optional sound with a toggle;
   - BIOS/POST screen and an OS boot progress bar.

3. A graded task "Fix the broken computer": diagnose the cause and fix it (services/grading).

State on the page that this is an educational simulation.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-8 — Backend and database (local, hosting-ready)

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md. Read MASTER_PROMPT.md section 44.

This session is stage V2-8 — Server and database foundation:

1. A Node 24 server in server/ (alongside or merged with the existing ai-server): a REST API now, with room for WebSockets later.

2. Database: node:sqlite with a local file data/lab.db and a PostgreSQL-compatible schema. Put migrations in server/migrations/. Tables:
   - users (role: admin / teacher / student), schools, classes, class_members;
   - assignments, submissions, attempts, grades;
   - announcements, messages;
   - achievements, xp_events;
   - sessions, audit_log.

3. Authentication:
   - login + password stored as scrypt hashes;
   - httpOnly session cookies and CSRF protection;
   - rate-limited login attempts;
   - role checks on every endpoint.
   The first admin is created by a CLI command where I type the password myself; never hard-code or invent credentials.

4. Add a server implementation of ProgressRepository (src/services/progress/repository.ts). localStorage stays as the offline mode and syncs after login.

5. Frontend:
   - a sign-in page;
   - routing by role (student / teacher / admin);
   - guest mode (exploring the labs without an account) stays.

6. Tests for auth, roles, migrations and the API. Add .env.example. Secrets stay on the server only.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-9 — Teacher and student dashboards

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-9 — Dashboards:

1. Teacher:
   - create classes with a join code and QR;
   - register students from a list, with generated logins/passwords and a printable sheet;
   - create assignments (lab tasks, deadline, points);
   - publish announcements;
   - view each student's work (attempts, time, mistakes, hints);
   - grade and comment, with the option to override the automatic score;
   - class statistics and CSV/JSON export.

2. Student:
   - join a class with a code;
   - see their assignments with deadlines;
   - read announcements;
   - see grades and teacher comments;
   - "My results" now loads from the server.

3. Messaging UI: refresh-based for now; real-time comes later.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-10 — Admin panel

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-10 — Admin panel:

1. Users: search, change role, block, issue password-reset links.
2. Schools and classes.
3. Content management: device catalog, tasks and quiz questions, editable through the UI in kk/ru/en.
4. Security: audit log, login attempts, blocked IPs.
5. Site settings.
6. Database backup and restore (local file).
7. System health page.

Every admin action is written to audit_log.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-11a — Gamification v2

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md. Read MASTER_PROMPT.md section 27.

This session is stage V2-11a — Gamification:

1. XP and levels for tasks, quizzes and daily challenges.
2. Badges: the existing 14 achievements plus new ones.
3. Leaderboards per class, school and week, with an anonymous mode for adults.
4. Daily and weekly challenges.
5. Class-vs-class contests.

Animations must stay premium, not a children's mobile game. All data lives on the server (V2-8).

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-11b — Real-time competitions

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-11b — Live competitions over WebSockets:

1. Live quiz (Kahoot-style):
   - the teacher opens a room and students join with a code;
   - timed questions with a live leaderboard;
   - results are saved on the server.

2. PC-assembly race: several students build at the same time and see each other's progress. Score speed and accuracy.

3. Port-connection race and "Find the fault" race.

4. Reconnection after network drops, and fair play: the server validates every result.

Global rules:
<paste section 3 of PLAN_V2.md here>
```

### V2-12 — QA, security, hosting readiness

```
Project: D:\informatics-lab. Follow the Global rules in PLAN_V2.md.

This session is stage V2-12 — Final QA and deployment readiness:

1. Testing:
   - Chrome, Edge, Firefox and Safari;
   - a real phone, a tablet and a weak laptop;
   - perf-measure on every page;
   - accessibility: keyboard, contrast, screen readers.

2. Security audit:
   - OWASP Top 10: auth, sessions, CSRF, XSS, SQL injection, rate limits, permissions;
   - npm audit;
   - .env handling.

3. Hosting readiness:
   - a Dockerfile;
   - a migration path from SQLite to PostgreSQL;
   - HTTPS, domain, a CDN for 3D assets, backups;
   - DEPLOY.md comparing VPS / Render / Railway / Supabase with prices.
   Buying hosting or a domain is my decision; if any dashboard needs a login, tell me and I will sign in.

4. Complete the README.

Global rules:
<paste section 3 of PLAN_V2.md here>
```
