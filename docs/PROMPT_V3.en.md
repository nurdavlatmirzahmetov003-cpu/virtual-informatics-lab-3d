# BitLab 0.37 — "Living Lab" upgrade

You are working on **BitLab**, a 3D virtual informatics lab for school students (grades 5–11) in Kazakhstan. The owner is not a developer: they judge the work by what they see and hear in the browser, so visible polish and reliability matter as much as code quality.

## Context
- Repo: `D:\informatics-lab` — Vite 8 + React 19 + TypeScript + three.js (React Three Fiber, drei), Zustand, CSS Modules; Node server in `server/` (SQLite, WebSocket live games, Gemini proxy for the "Bit" assistant in `server/bit.ts`).
- Before writing any code, read `PROJECT_STATE.md`, `ARCHITECTURE.md`, `KNOWN_ISSUES.md`, `TODO.md` and `CHANGELOG.md`. Build on the existing architecture, naming and patterns; do not restart or rewrite working systems.
- Existing pieces you will extend: the Bit assistant (`src/services/bit/`, `src/components/bit/`, `server/bit.ts`), the home hero scene (`src/scenes/DeskScene/`), the 3D lab (`src/scenes/LabSpace/`, `src/data/lab/`), product models (`public/assets/models/products/`, ~95 models), the games arena (`src/labs/Arcade/`, `src/pages/Games/`), live rooms (`server/live/`), brand config (`src/config/brand.ts`).
- The owner's Gemini key is in `.env` (`GEMINI_API_KEY`). Available models include `gemini-3.5-flash` (current default for Bit), `gemini-3.8-flash`, and TTS models `gemini-3.8-flash-tts` and `gemini-3.1-flash-tts-preview`.

## Working rules
1. Work only in the local checkout on a new branch `feature/v3-living-lab`. Commit after each section with a clear message. **Never push, merge to `main` or deploy** until the owner explicitly approves at the end.
2. All UI text in three languages (kk / ru / en). Kazakh must be clean, literary and grammatical, using the Kazakh letters ә ғ қ ң ө ұ ү һ і, with no Russian words or calques where a Kazakh term exists. Bit always answers in the site's current language and never switches language on its own.
3. Quality gate after every section: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all green; new logic gets tests; check the result in a real browser at 1280, 1366 and 1920 px and on a 375 px phone, in both light and dark themes. Report Low/Medium/High FPS and draw calls against the previous build; Low and Medium must not get slower.
4. Secrets stay server-side in `.env` (never committed, never in the browser bundle).
5. Third-party 3D assets: only licences that allow it (CC0 or CC-BY with attribution recorded in `ASSET_MANIFEST.md` and the Credits page). **Show the owner the list with links and licences, and wait for approval before downloading anything.**
6. Respect `prefers-reduced-motion`, keep keyboard access and contrast (≥ 4.5:1).
7. After each section, report in plain language: what changed, how it was verified, what was not verified, and anything the owner must do or decide. Then wait for the owner's go-ahead before starting the next section.

---

## Section 1 — Bit: an unobtrusive panel, reliable Kazakh voice, a talking character
**Problems reported:** the chat button and panel cannot be minimised and get in the way on every page; spoken questions in Kazakh often get no answer; the Kazakh voice sounds broken; Bit itself is not visible while explaining.

Tasks:
1. **Panel UX:** minimise to a small avatar, fully close, drag to any screen edge (position remembered). On 3D pages use a compact mode that never covers controls; on desktop the open panel docks as a side panel and the page content makes room for it; on phones it is a half-height bottom sheet. `Esc` closes, `Alt+B` toggles.
2. **Kazakh speech recognition:** find the root cause before fixing (Chrome `kk-KZ` recognition quality, transcripts not matching `intent.ts`, error codes). Then:
   - request several alternatives (`maxAlternatives`) and pick the best match;
   - make intent matching tolerant of typical recognition errors in Kazakh;
   - if the browser cannot recognise Kazakh well, add server-side recognition through Gemini (`/api/ai/bit/stt`, audio uploaded, language = site language);
   - add a test set of at least 40 realistic Kazakh utterances (including recognition errors) that must map to the right intent.
3. **Clean Kazakh voice (TTS):** evaluate the Gemini TTS models for Kazakh. If they sound good, synthesise on the server (`/api/ai/bit/tts`), streamed sentence by sentence and cached, with the browser's voice as a fallback. Time to first audio ≤ 1.5 s.
4. **Talking Bit:** an animated Bit character in the panel and in the 3D lab. Mouth and eyes move with the speech amplitude; separate idle, listening and thinking states.
5. **Information panels as Bit's speech:** the right-hand panels (zone, device, poster, lesson) are presented as a speech bubble coming from Bit, with Bit beside them. A "Listen" button reads the whole panel in Bit's voice and highlights the current sentence (karaoke style).

Done when: the panel minimises and never hides any page control; the 40-utterance Kazakh test passes; Kazakh answers are spoken in a clean voice (Gemini TTS or Edge); the information panels read as Bit speaking.

---

## Section 2 — Home and sign-in pages: a living background, typography, motion
1. **Living hero background:** in real time a setup assembles itself behind the hero (parts fly in and click into place), styles cycle (white / black / RGB), and devices swap to other models (monitor, keyboard, mouse, headset). Lighter on Low quality; static for reduced motion.
2. **White hero setup:** white case, white peripherals, white desk, eye-catching lighting.
3. **Dress the scene around the desk:** plants, shelves, figurines, BitLab banners and posters, a floor lamp, a rug. No empty dark areas.
4. **Typography and motion:** a characterful display face for headings with full Kazakh coverage (`npm run test:fonts` must pass), animated headline reveal with a gradient sweep, entrance animations for buttons, scroll-linked effects.
5. **Sign-in, join and reset pages:** currently plain. Rebuild them with a harmonious brand gradient background, subtle animation (slowly moving 3D shapes or SVG), a glass card and the logo.

Done when: the hero background feels alive without dropping FPS below budget; the auth pages look on-brand in both themes.

---

## Section 3 — System unit, power supply and internal parts
**Problems reported:** the owner dislikes the current home case; the power supply and hard drive poke out below the case; inside the assembled setup the motherboard, cooler and other parts are misplaced.

1. Give the hero a new, attractive, universal case (white, tempered glass side, RGB fans). Keep the old cases as choices in Setup Studio.
2. Fix part placement **for every case model**: motherboard on the tray, PSU in its shroud, drives in their cages, cooler on the CPU, GPU in its slot. No part may stick out of the case.
3. Add an automated test that checks, for every case × part combination, that each part's bounding box lies inside the case and that parts do not intersect.

Done when: the reported issues do not occur with any case and the test is green.

---

## Section 4 — 3D lab: visibility, logo, robots, zone 10
**Problems reported:** from the overview no devices are visible (the tables look empty); a zone sign is hidden behind the wooden slats; the logo on the lab monitor is blurry and mirrored.

1. **Visible from afar:** in the overview every zone shows its devices through light LODs or impostors, including on Low quality.
2. **Visibility audit:** no sign, banner, poster or logo may be hidden behind any object. Add an automated test (raycasts from the camera stops or bounding-box checks).
3. **Crisp logo everywhere:** screen textures at 2K with mipmaps and anisotropy, correct UV orientation (never mirrored), sRGB, logo drawn from the SVG.
4. **Decoration:** BitLab banners and flags in every corner and every zone; the logo in every room.
5. **Robots**, each with its own job, friendly and smiling, with the BitLab logo on the chest or top-right of the body:
   - a cleaning robot that keeps sweeping the floor along a path, avoiding obstacles;
   - a builder robot assembling a PC at the assembly bench (animation);
   - a courier robot bringing boxes of new products to the showcase;
   - a teacher robot giving a lesson on the interactive board (slides plus Bit's voice);
   - advisor robots in front of each table that present that zone's devices and speak when clicked.
   Make them varied (colours, shapes, accessories) and keep draw calls within budget (instancing / merged geometry).
6. **Zone 10 — the BitLab presentation stage:** a stage with a large screen where robots wearing BitLab-branded clothing present the site in real time (slides, voice, all three languages).

Done when: the three reported problems are gone; the visibility test is green; the robots work; the FPS budget holds.

---

## Section 5 — 3D models: placeholders, showcase, device variants
**Problem reported:** some devices are drawn as primitive shapes (cables appear as rings).

Devices currently without a real model (procedural placeholders, 17): HDMI, DisplayPort, USB-C, USB-A, audio (3.5 mm) and Ethernet cables, the internal cable set, CMOS battery, 2.5" HDD, optical drive, scanner, projector, access point, docking station, card reader, liquid cooler, speakers.

1. Find licensed models for each (Poly Haven, Sketchfab with downloadable CC0/CC-BY, Kenney, Quaternius, Smithsonian 3D…). Send the owner a table: device · link · licence · author · triangle count · recommendation. **Do not download until approved.**
2. After approval, run them through the Blender pipeline (`scripts/blender`), optimise, create LODs and integrate. The procedural versions remain only as fallbacks.
3. **Showcase (zone 9):** the best-looking models on rotating pedestals with lighting and labels.
4. **Device variants:** use all ~95 product models. Clicking a device in the lab (for example, a headset) offers "Other models": every model of that category in 3D with a spec comparison table. This works for every category (mouse, keyboard, monitor, case, GPU…).

Done when: the table has been sent; approved models are integrated; "Other models" works for every category.

---

## Section 6 — Games 2.0: hands-on 3D games
**Feedback:** the games feel like text quizzes. The owner liked "What device is this?" (recognising devices from 3D models).

1. Keep the five existing games and add hands-on 3D games:
   - Build the phone: install smartphone parts (screen, battery, camera, board) in 3D in the right order (reuse the teardown data);
   - Build the laptop: the same for a laptop;
   - PC build race in 3D: a timed, multiplayer version of the Assembly Lab;
   - Plug it in: connect cables to the right ports in 3D against the clock (Connect Lab);
   - Build the network: wire up a router, switch and PCs until PING succeeds;
   - Find the fault: identify the broken part in 3D from its symptoms.
2. Real-time multiplayer for classmates in one room (existing WebSocket base), live ranking, podium animation, XP and badges.
3. Game feel: sound effects, combos, timer bar, stars, replay, "challenge a friend".

Done when: at least four new hands-on 3D games exist, scores are refereed by the server, and they play well on a phone.

---

## Section 7 — Bit's knowledge and lessons
1. Grow the built-in answers from 60 to **at least 150**, following the Kazakhstan grade 5–11 informatics curriculum (hardware, software, information and encoding, algorithms, Python basics, networks, cybersecurity, data, AI, digital literacy). Three languages, 2–4 spoken sentences each, every entry found by its own question (tested).
2. Step-by-step lessons for every section and lab (currently 9).
3. During a lesson Bit points at the object it is talking about in 3D (the camera flies to it and highlights it).
4. Child safety: filter Gemini answers (age-inappropriate topics, personal data) and keep request limits.

---

## Section 8 — Five additional features (my proposals)
1. **Class mode (projector):** the teacher puts the 3D lab on the board, Bit teaches the whole class, and the teacher's phone acts as a remote.
2. **Personal learning path and review:** a review list built from the student's mistakes, spaced-repetition quizzes and a suggested next step.
3. **Identify with the camera:** the student photographs a real device with a phone; Gemini Vision identifies it, Bit explains it and the lab shows its 3D model.
4. **Accessibility:** subtitles for Bit's speech, high contrast, a dyslexia-friendly font option, full keyboard navigation, reduced motion.
5. **Offline mode (PWA):** installable; the core pages and Bit's built-in answers work without internet for schools with weak connections.

Also missing: share previews (OpenGraph images), a short onboarding for new users, polished 404 and error pages, a weekly progress report for parents, Safari / iPhone testing, production hosting.

---

## Section 9 — QA and release
1. Visibility and overlap audit of every page (desktop, tablet, phone; both themes; kk/ru/en).
2. Performance table: Low/Medium/High FPS and draw calls versus the previous build.
3. A full proofreading pass of all Kazakh text.
4. Update `CHANGELOG`, `PROJECT_STATE`, `ARCHITECTURE`, `KNOWN_ISSUES` and `TODO`.
5. Final report, then — only with the owner's approval — merge to `main` and publish to GitHub.

---

**Order:** 1 → 2 → 3 → 4 → 5 (send the model table to the owner) → 6 → 7 → 8 → 9. Report after each section and wait for the owner's go-ahead.
