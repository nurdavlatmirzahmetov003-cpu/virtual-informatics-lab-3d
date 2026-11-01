# V4 — Real hardware, living lab (task text)

Saved 2026-10-26 from the owner's brief so later sections need no resend. Order of work: 1 → 2 → 3 → 5 → 6 → 7 → 4 → 8 → 9 → 10 → 11 → 12 → 13. After each section: report and wait for the owner's go-ahead.

## Working rules
1. Never push, merge to main or deploy without the owner's explicit word in chat.
2. All UI text in kk / ru / en; Kazakh clean and literary.
3. Assets only CC0 or CC-BY, recorded in ASSET_MANIFEST.md and the Credits page.
4. Quality gate: npm run lint, typecheck, test, build all green; check in a real browser at 375, 768, 1280, 1366, 1920 px, light and dark; Low and Medium FPS must not drop more than 5% versus main.
5. Secrets only in .env.
6. prefers-reduced-motion, keyboard access, contrast 4.5:1.
7. Self-check with Playwright screenshots of every changed view before saying done; fix anything floating, clipping, tilted, backwards, overlapping or low-res.

Decisions: models are our own work (CC0); no real brand logos ("BitLab AERO" lettering); "ММАН" (team initials Маралым, Меруерт, Аружан, Нұрдәулет) only on the certificate (Section 8).

## Section 1 — Real hardware (done)
1.1 White panoramic RGB showcase PC on the home page. 1.2 Data-driven mounting system for every PC scene. 1.3 Real assembly sequence (13 steps). 1.4 Eight BitLab case designs in the Setup Studio. 1.5 Tests that make the bugs impossible to come back:
- test:pc-fit for every case × motherboard × cooler × GPU × PSU: every attach anchor within 1 mm and 0.5° of its target; every part inside the case interior (glass excluded); no two parts intersect; cooler above the CPU and GPU gold fingers in the slot; PSU inside psu.bay; desk mat inside the desk top with at least 1 cm margin.
- A Playwright visual check: the hero PC and the Setup Studio PC from 4 fixed angles against saved baselines, failing above a pixel-diff threshold; an npm script and documented baseline update.
Done when: the hero PC is a convincing copy of the white panoramic RGB reference; exploded view and assembly smooth and exact; CPU-not-in-socket, cooler-not-on-CPU, tilted parts, floating GPU and PSU-outside-case cannot be reproduced with any catalog combination; the desk mat stays on the desk; all tests green.

## Section 2 — Home hero setup: orientation, quality and life around the desk (done)
Problems: in the rotating hero setups the desk lamp and both speakers face backwards; overall quality and saturation need to improve.
2.1 Fix orientation for every model and style variant: one convention (front +Z towards the chair/camera), normalised once at import with a per-model front rotation; a test that every speaker, lamp, monitor, keyboard and headset stand faces the seat within ±25° in every hero style; speakers symmetric left and right of the monitor, slightly toed in; the lamp arm reaches over the desk and lights it.
2.2 Quality and saturation: better PBR materials, soft shadows, subtle bloom on emissive parts, colour grading (ACES, slight saturation boost), higher-resolution textures for hero objects; no blurry or low-poly items in the foreground.
2.3 Dress the desk and background: redesigned desk (thin edge, cable tray, monitor arm); background wall with acoustic slats and soft LED strips, framed BitLab posters, a shelf with books and figures; a small waving Bit robot on the desk; a monstera or succulent in a ceramic pot; a gaming desk with RGB edge lighting and a gaming chair right of the main desk; a presenter robot in a BitLab T-shirt left of the desk with gestures timed to the setup changes and a speech bubble (kk/ru/en); Low preset reduces decorations but keeps the robots and the plant.
Done when: every style shows all devices facing the viewer, the scene looks rich and saturated, Bit, the plant, the gaming desk and the presenter are in place, nothing floating, clipping or overlapping the white showcase PC.

## Section 3 — 3D lab layout and robot looks
### Problems
- Zone 5 ("Баспа және медиа", printers and projector) and zone 10 ("BitLab сахнасы", the stage with robots) are merged or overlapping; their signs collide. In src/data/lab/zones.ts print_media is center [8.2, 4.2] size 3.2×2.4 and stage is center [7.6, 7.0] size 2.8×1.6: they share X 6.6–9.0 and are only 0.8 apart on Z.
- The robots and their T-shirts look awkward: the shirts are badly fitted and the proportions are not cute.
### Tasks
3.1 Separate zone 5 and zone 10.
- Each zone gets its own floor area with a clear gap or walkway of at least 2–3 m in world scale, its own sign and its own floor colour or border. Move or resize in the layout data; keep other zones and robot routes valid.
- Re-run and extend test:lab-visibility (and scripts/lab-space.test.mjs) so no zone footprints overlap and no zone signs overlap from the default camera views.
3.2 Redesign the robots.
- Consistent, cute and friendly style: rounded body, large expressive screen-face eyes, a smile, soft materials.
- T-shirts fit the body mesh as fitted clothing, with no clipping. The BitLab logo printed crisply on the front.
- Every robot has a unique silhouette and colour scheme (see the Section 4 roster).
- Files: src/scenes/LabSpace/robots/{robotKit.ts, Robot.tsx, LabRobots.tsx, brandMark.ts, route.ts}; src/data/lab/robots.ts; zones/StageZone.tsx (2 presenters); LabSpace/classroom/RobotTeacher.tsx. Keep the Section 2 hero presenter robot and Bit figure consistent with the new style.
Done when: the zones are clearly separated, no signs overlap, and every robot looks polished and distinct.

## Section 4 — New feature "Біздің роботтар" (Our Robots)
A new section in the 3D lab plus its own page, where students meet every robot, learn what each does, dress it up, level it up and watch the robots live their own life. Gamification, so students also have fun.
4.1 Roster: every existing robot (consultants, cleaner, courier, assembler, teacher, stage presenters) plus new ones, at least 10, each with a unique look and clear job:
- Тазалағыш (Cleaner): vacuums the floor and empties bins; round, low, brush skirt.
- Жүк тасушы (Cargo): carries boxes of parts between zones; wheeled, cargo bed, forklift arms.
- Баяндаушы (Presenter): slide presentations on the stage; tall, hand clicker, bow tie.
- Жинаушы (Assembler): builds PCs at the assembly table; multi-arm, screwdriver tool.
- Мұғалім (Teacher): teaches at the board; glasses, pointer.
- Кеңесші (Guide): greets visitors, gives zone tours; friendly, map tablet.
- Қауіпсіздік (Cyber-guard): computer and internet safety; shield emblem, cap.
- Инспектор (Room-safety): cables, sockets, fire safety, posture; hard hat, checklist.
- Кітапханашы (Librarian): books and facts; book-shaped chest.
- Бапкер (Coach): breaks and games, football; whistle, sporty shirt.
4.2 360° viewer: rotate, zoom, auto-spin, play idle and work animations; info card with name, job, level, energy and a fun fact.
4.3 Daily life: state machine work → battery low → walk to its garage → sleep with charging animation and battery bar → wake → resume. New robots' area with a named, coloured garage/charging dock per robot, a rest lounge, a mini football pitch and a play corner. At times robots gather to play football or other mini-games (passing, dance, races). Robots follow navigation paths (navmesh or grid) and never walk through walls, desks or each other. Performance: instancing and shared skeletons; fewer robots on Low; far robots run simplified logic.
4.4 Dressing and levelling: wardrobe of hats (caps, headphones, crowns, graduation cap, kalpak), T-shirts (BitLab colours, seasonal), accessories (glasses, scarf, backpack, badge). Students earn coins and XP from tasks, lessons and games, spend them on items and on training a robot to the next level; higher levels unlock animations, items and a skill. Progress saved per student on the server, or local storage for guests.
4.5 Robots teach: short tips in each robot's topic, spoken by Bit-style TTS with subtitles: computer and internet safety (passwords, phishing, personal data); room and electrical safety; posture and eye breaks; etiquette and manners; fun facts. At least 60 tips in kk/ru/en, child-appropriate. Triggered on click or proximity, rate-limited.
Done when: "Біздің роботтар" exists in the lab menu and as a page; 10+ distinct robots, 360° viewable, dressable, levellable; robots work, charge and play football; 60 tips in 3 languages; FPS within budget.

## Section 5 — Lab tasks: never-overlapping interface and guided first task
Problem: in /labs/network?task=routerLan the device palette on the left (Ноутбук, Router, Switch, Сервер, Access point, Принтер, Смартфон) overlaps the task text and the "Күтілетін нәтиже" and "Не тексеріледі" blocks. Similar overlaps in other labs.
5.1 Layout system for all labs: a grid with tool palette, workspace and task panel. Palette and task panel are collapsible, reopen from an edge tab, remember state. Nothing overlaps at any width; narrow screens use drawers or bottom sheets; long lists scroll inside their panel. Files: src/pages/Labs/NetworkLab/{NetworkLabPage,Palette,TaskPanel,ConfigPanel,Workspace}.tsx and src/pages/Labs/*/.
5.2 Automated overlap test: Playwright opens every lab and every task at 375, 768, 1280, 1366, 1920 px, collects bounding boxes of main regions and text blocks, fails on any overlap or clipped text.
5.3 Guided start: an animated welcome when a task opens (Bit appears and says what the task is about). For the first task of each lab, a "Show me how" demo: ghost cursor and Bit narration perform the solution step by step with highlights, then hand control back. Every task has "Show me again" and a friendly, concrete hint ladder. All labs: network, logic, algorithms, experiments and the rest.
Done when: no overlapping or clipped UI at any width (test green), and every lab has a welcome and a guided first-task demo.

## Section 6 — Collapsible Bit and info panels everywhere
Problem: in the 3D lab the left "Бит түсіндіреді" panel (e.g. zone 09 "Витрина") cannot be collapsed and covers the 3D view; same on other pages.
- Every info or Bit panel gets a collapse button; collapsed it becomes a small edge tab or avatar with an unread badge; click or Alt+I restores it.
- Auto-collapse in full-screen and on small screens. State remembered per page (bitStore already has a dock state).
- Panels never cover the main 3D controls (devices list, zoom, reset, keyboard help).
Done when: on every page the 3D view can be seen fully with panels collapsed and easily recalled.

## Section 7 — Side menu for secondary pages
Problem: footer links are hard to find and read: Пікір қалдыру, Байланыс, Сертификат, Ойындар, Камерамен тану, Менің жолым, Авторлар мен лицензиялар, Құпиялылық (src/components/layout/PageLayout.tsx:13-27).
- Hamburger button at the top right of the header opens a right-side drawer, grouped with icons: Learning (Менің жолым, Сертификат, Ойындар, Камерамен тану); Help (Байланыс, Пікір қалдыру); About (Авторлар мен лицензиялар, Құпиялылық).
- The drawer also holds the language switcher, theme toggle, accessibility menu and sign-in.
- Smooth animation; closes on Esc or outside click; focus trap; touch swipe.
- Keep the footer but make it more readable.
Done when: every secondary page is reachable from the drawer on all screen sizes.

## Section 8 — Certificate, seals, celebration, demo mode
8.1 Certificate preview page with a sample name. High-quality printable A4 landscape: student name, course, date, unique ID and QR that verify on the site, signer, two seals and a sticker.
8.2 Seals, in-house SVG: an official round seal placed after the label "ММАН:" (ММАН = initials of the project team Маралым, Меруерт, Аружан, Нұрдәулет; the line reads like a team signature line, the round seal overlapping a signature; ring text "BitLab · Маралым · Меруерт · Аружан · Нұрдәулет" with the BitLab logo in the centre; do not expand ММАН elsewhere); BitLab's own brand seal (round emblem, "BitLab · Virtual Informatics Lab"); a holographic-style "Course completed" sticker. No "patented" or legal claim. Keep the placeholders in public/certificate/ replaceable.
8.3 Celebration: full-screen confetti and fireworks, Bit pops up smiling and congratulates by voice in the current language, then the certificate appears with a shine, with Download PDF and Share. Reduced motion: simple fade.
8.4 Demo mode for the defence: a Demo button on the sign-in page and a ?demo=1 link into a demo profile with everything unlocked (all labs and tasks, achievements partly/fully earned, robots levelled with items, instant certificate with the full celebration, parent report and learning path filled with sample data). Demo data never mixes with real data; demo certificates carry a "DEMO" watermark and a non-verifying ID. One-click "Reset demo".

## Section 9 — Achievements page redesign
Problem: plain dark cards with line icons and grey bars (Алғашқы қадам, Алғашқы компьютер, Perfect Build, Жабдық сарапшысы, Желі шебері, Алгоритм зерттеуші, Логика инженері, Тәжірибе зерттеушісі, 100% зертхана, Өз күшімен, Табанды, Жан-жақты).
- Illustrated badge per achievement (3D-style medal or high-quality illustration). Rarity tiers bronze, silver, gold, legendary with frames and glow. Progress rings; big unlock animation (flip, shine, Bit cheers). Locked badges as silhouettes with a hint. Summary header: level, XP bar, recent unlocks, top-3 showcase. Shared economy with robot XP. Looks like a modern game achievements screen in both themes and on phones.

## Section 10 — Bit voice personalisation
Settings panel: voice (female, male, neutral, from Gemini TTS voices that sound good in Kazakh; test and list only good ones), speaking style (calm teacher, cheerful friend, energetic), speed, emotion on/off (PR #2 emotion system), auto-read on/off; Preview button per choice; saved per student or locally for guests; audio cached per voice and style; on TTS quota exhaustion a friendly notice and fallback to text plus the browser voice. Files: src/services/bit/{voice.ts,speech.ts}, bitStore, server/bitVoice.ts.

## Section 11 — Fully responsive
Audit every page at 360, 390, 768 (portrait and landscape), 1024, 1280, 1920 px. Fix layout, font sizes, tap targets (44 px min), safe areas. 3D touch controls (one finger rotates, pinch zoom and pan). Phones get Low automatically. Header collapses into the Section 7 drawer. Extend Playwright to phone and tablet screenshots and run the 5.2 overlap check on them. Include the known leftovers: at 375 px the "Өзгерту" button slips under the menu, the Bit button covers the Studio "360° қарау" chip and tip edge, and the hero speech bubble is hidden on phones; also the white desk top looking grey on Low.

## Section 12 — AI provider slot and Google Cloud hosting preparation
12.1 Provider interface in server/ with BIT_PROVIDER=gemini|openai; Gemini stays default and fallback; add OPENAI_API_KEY= and BIT_PROVIDER= with comments to .env.example (reuse existing OPENAI_* names); OpenAI adapter for chat, STT and TTS behind the same interface, not active until the owner adds a key.
12.2 Google Cloud prep (owner has $300 trial credit for 90 days): production Dockerfile plus DEPLOY_GCP.md for one Compute Engine e2-small VM with a persistent disk for SQLite, Caddy or nginx with automatic HTTPS, secrets in an env file on the VM, restart policy, daily backup of data/lab.db, a $20 budget alert. Document moving to a Kazakhstan VPS (e.g. Hoster.kz) later. Do not deploy.

## Section 13 — Final QA and delivery
Full test suite, typecheck, build, visual baselines, overlap tests, occlusion test; FPS and draw calls on Low/Medium/High for home, 3D lab and Setup Studio vs v0.37; proofread Kazakh; update PROJECT_STATE.md, ARCHITECTURE.md, CHANGELOG.md, KNOWN_ISSUES.md, TODO.md, ASSET_MANIFEST.md; write a 5–7 minute demo script for the defence using demo mode; report and wait. Push, PR and merge only on the owner's explicit word.
