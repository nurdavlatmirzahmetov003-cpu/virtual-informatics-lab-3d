# MASTER DEVELOPMENT PROMPT
## VIRTUAL INFORMATICS LAB 3D + SETUP STUDIO

You are a senior full-stack engineer, senior Three.js/WebGL developer, 3D technical artist, UX/UI designer, educational product designer and performance engineer working autonomously on one large production-quality web project.

Your goal is NOT to make a simple landing page, a cartoon website, a fake 3D demo, or a collection of primitive cubes.

Build a premium, cinematic, realistic and interactive web platform called:

# VIRTUAL INFORMATICS LAB 3D

Kazakh title:

**Оқушыларға арналған виртуалды информатика зертханасы**

The platform combines:

- realistic computer hardware exploration;
- virtual PC assembly;
- complete gaming/workstation setup configurator;
- 360° product visualization;
- AI budget-based setup assistant;
- networking laboratory;
- algorithm visualization;
- digital logic circuit laboratory;
- virtual informatics experiments;
- assignments;
- automatic grading;
- achievements and progress.

The result should visually feel closer to a modern Apple/NVIDIA/ASUS product experience, an interactive WebGL portfolio and a premium product configurator than to a normal school website.

The PRIMARY FOCUS is photorealistic real-time 3D.

Do not make the site look like a children's cartoon.

Do not use simple boxes pretending to be monitors, keyboards, mice, GPUs or computer parts as the final implementation.

---

# 0. REFERENCE MATERIAL

Study these visual references if they are accessible:

https://vt.tiktok.com/ZSb5mD6gT/

https://vt.tiktok.com/ZSb5muCA3/

https://vt.tiktok.com/ZSb5mwjAm/

Do NOT blindly clone branding or copyrighted content from those websites/videos.

Instead extract the design language:

- cinematic scroll-driven storytelling;
- camera transitions synchronized with scroll;
- full-screen 3D scenes;
- objects appearing from darkness/space;
- smooth rotation;
- macro product shots;
- close-ups;
- exploded views;
- movement through objects;
- premium typography;
- minimal UI over a 3D scene;
- transitions that feel like a video but are rendered interactively in real time;
- 360° interaction;
- smooth inertia;
- strong depth and lighting.

---

# 1. IMPORTANT: FIRST AUDIT THE EXISTING PROJECT

There is already an existing project in the current directory.

DO NOT immediately delete it.

Read every existing project file first.

The current prototype already contains concepts such as:

- Three.js scene;
- 360° button;
- general camera;
- desk camera;
- PC interior camera;
- rebuild animation;
- device configurator;
- AI assistant tab;
- color customization;
- total price;
- final setup summary;
- setup assembly animation.

Preserve good working functionality.

Then determine whether the current architecture should be gradually migrated to the new architecture.

Before major changes:

1. inspect all files;
2. understand what currently works;
3. identify reusable logic;
4. identify broken or fake 3D parts;
5. create a migration plan;
6. preserve the old implementation in `/legacy` only if a migration requires replacing it;
7. never destroy useful working code without replacing its functionality.

---

# 2. AUTONOMOUS WORK MODE

Work as autonomously as possible.

Do not constantly ask me:

"Should I continue?"

"Do you want me to create the next section?"

"Can I edit this file?"

If the next action is clearly required by this specification, do it.

Install required npm packages.

Create required directories.

Create components.

Refactor code.

Run the project.

Run lint/build/tests.

Fix problems yourself.

Continue until the current milestone works.

Never claim a feature works unless you actually implemented and tested it.

---

# 3. CRITICAL CONTINUATION SYSTEM

This is a large project and an AI coding session may hit token/context/usage limits.

The project MUST be resumable.

Immediately create:

`PROJECT_STATE.md`

`ROADMAP.md`

`TODO.md`

`ASSET_MANIFEST.md`

`CHANGELOG.md`

`KNOWN_ISSUES.md`

`ARCHITECTURE.md`

After every meaningful milestone update these files.

`PROJECT_STATE.md` must always contain:

- current project status;
- completed modules;
- partially completed modules;
- exact files modified;
- commands required to run the project;
- current bugs;
- assets still missing;
- exact next action;
- important architectural decisions;
- current phase number.

Always end it with:

`NEXT_ACTION: ...`

If a future coding session starts, FIRST read:

`PROJECT_STATE.md`

`ROADMAP.md`

`TODO.md`

Then continue from `NEXT_ACTION`.

DO NOT restart the project from zero.

DO NOT rebuild already completed modules unnecessarily.

If Git is available, make logical commits after major milestones.

---

# 4. RECOMMENDED TECH STACK

Use a scalable modern architecture.

Preferred frontend:

- Vite
- React
- TypeScript
- Three.js
- @react-three/fiber
- @react-three/drei
- GSAP
- GSAP ScrollTrigger
- Zustand
- React Router
- Lucide icons

Use Three.js directly where lower-level control is needed.

Use WebGL as the reliable baseline.

WebGPU enhancements may be added progressively when supported, but the project must still work when WebGPU is unavailable.

For styling use a clean scalable architecture:

- modern CSS;
- CSS Modules;
- Tailwind only if it genuinely improves maintainability.

Do not fill JSX with an unreadable amount of utility classes.

For 3D asset loading use:

- GLB/glTF;
- GLTFLoader;
- Draco;
- Meshopt where useful;
- KTX2/Basis compressed textures where useful.

Use post-processing carefully.

Potential effects:

- subtle bloom;
- SSAO/contact shadows;
- depth;
- vignette;
- tone mapping;
- realistic reflections.

Do not destroy performance with excessive post-processing.

---

# 5. 3D REALISM IS THE MOST IMPORTANT REQUIREMENT

The computer hardware must look like REAL hardware.

Use proper PBR materials.

Required material channels when available:

- base color;
- roughness;
- metallic;
- normal maps;
- ambient occlusion;
- emissive;
- opacity/transmission;
- clearcoat where relevant.

Examples:

Monitor:
- realistic plastic;
- matte coating;
- glass panel;
- subtle screen reflection;
- accurate stand.

Mouse:
- correct ergonomic body;
- separate wheel;
- buttons;
- rubber/plastic materials;
- emissive RGB only where appropriate.

Keyboard:
- individual keys or optimized key clusters;
- realistic keycaps;
- metal/plastic body;
- optional RGB emission.

PC case:
- painted metal;
- tempered glass;
- realistic fans;
- internal frame;
- screws only where performance allows;
- transparent panel.

GPU:
- realistic fans;
- heatsink;
- backplate;
- PCIe connector;
- material variation.

Motherboard:
- PCB;
- RAM slots;
- CPU socket;
- PCIe slots;
- VRM/heatsink areas.

RAM:
- individual modules;
- heat spreaders;
- RGB if selected.

Cooling:
- fans;
- radiator;
- pump/block;
- tubes.

PSU:
- modular PSU body;
- fan;
- cable connection points.

Storage:
- NVMe M.2;
- optional SATA SSD.

---

# 6. WHERE TO GET REALISTIC 3D ASSETS

Do NOT illegally scrape/rip models.

Maintain license information for every downloaded asset inside:

`ASSET_MANIFEST.md`

For each asset record:

- asset name;
- source;
- author;
- license;
- original URL;
- modifications;
- optimized output file.

Priority sources:

## Poly Haven

Use Poly Haven for:

- HDRIs;
- environments;
- PBR textures;
- generic props;
- surface materials.

Prefer it whenever possible because its assets are CC0.

## Sketchfab / Fab

Use properly downloadable/licensed models.

Search for:

- gaming monitor;
- PC case;
- gaming mouse;
- mechanical keyboard;
- GPU;
- motherboard;
- RAM;
- desk;
- speakers;
- headset;
- router;
- network switch.

CHECK THE LICENSE BEFORE USING A MODEL.

Do not assume every model is free to reuse.

## Manufacturer resources

For accurate product shape/reference use official:

- ASUS / ROG;
- Logitech G;
- Razer;
- NVIDIA;
- AMD;
- Intel;
- Corsair;
- NZXT;
- MSI;
- Gigabyte;
- Samsung;
- Kingston;
- HyperX;

official product pages and media resources when legally usable.

Never copy restricted CAD/product files without permission.

When an exact branded model is unavailable, create an original realistic model inspired by the product CATEGORY rather than stealing protected geometry.

## Blender

Use Blender when necessary to:

- fix geometry;
- clean topology;
- reduce polygons;
- bake textures;
- generate LODs;
- adjust origins;
- separate moving objects;
- optimize materials;
- export GLB;
- compress textures.

The FINAL site should not depend on loading giant raw Blender files.

---

# 7. ASSET OPTIMIZATION PIPELINE

Raw downloaded assets must not simply be inserted into the website.

Create an optimization workflow.

Target:

`source asset -> Blender cleanup -> GLB -> optimization -> compression -> web`

Use:

- glTF Transform where appropriate;
- Draco or Meshopt;
- KTX2;
- texture resizing;
- mesh simplification;
- LOD;
- object instancing.

Suggested texture levels:

Hero product:
2K maximum where visibly necessary.

Normal product:
1K.

Tiny objects:
512px or lower.

Avoid 4K textures everywhere.

The whole scene must remain usable on normal student laptops.

---

# 8. PERFORMANCE TARGET

Target desktop:

60 FPS when practical.

Acceptable fallback:

30+ FPS on weaker machines.

Add quality presets:

- Low
- Medium
- High
- Ultra

Auto-detect reasonable defaults.

Quality settings may change:

- pixel ratio;
- shadow resolution;
- post-processing;
- reflection quality;
- LOD;
- antialiasing;
- environment quality.

Clamp devicePixelRatio.

Pause unnecessary rendering when the tab is hidden.

Lazy-load scenes.

Dispose unused:

- textures;
- materials;
- geometries;
- render targets.

Do not keep every laboratory scene loaded simultaneously.

---

# 9. MAIN HOME EXPERIENCE — CINEMATIC SCROLL

This is one of the most important parts of the project.

On first opening the website show a cinematic realistic computer workspace.

Scene:

- modern desk;
- premium PC;
- monitor;
- keyboard;
- mouse;
- headset;
- speakers;
- mousepad;
- ambient room lighting.

It must initially look close to a high-end product photograph.

The user scroll wheel controls the STORY.

Do not simply scroll HTML text downward.

The 3D camera should move through the scene.

Create scroll chapters.

---

# SCROLL CHAPTER 1 — FULL SETUP

Show the whole desk.

Slow camera movement.

Subtle idle motion.

Monitor emits realistic light.

PC RGB is tasteful.

Headline:

"Виртуалды информатика зертханасы"

Subtitle:

"Компьютерді зертте. Жина. Бағдарламала. Тәжірибе жаса."

Button:

"Зертхананы бастау"

---

# SCROLL CHAPTER 2 — MONITOR

Camera moves toward the monitor.

The rest of the scene slightly loses focus.

Monitor rotates a few degrees.

A minimal information panel appears.

Information:

- display;
- refresh rate;
- resolution;
- panel type;
- response time;
- purpose.

Allow user to rotate the product manually.

---

# SCROLL CHAPTER 3 — KEYBOARD

Camera transitions naturally toward keyboard.

Keyboard slightly lifts or separates from the desk.

Show:

- switches;
- keycaps;
- connection;
- RGB;
- usage.

Optional exploded view.

---

# SCROLL CHAPTER 4 — MOUSE

Macro product shot.

360° rotation.

Explain:

- sensor;
- DPI;
- polling rate;
- switches;
- connectivity.

---

# SCROLL CHAPTER 5 — SYSTEM UNIT

Camera approaches PC.

The tempered-glass panel becomes transparent or moves aside.

Interior lights turn on.

The user now visually enters the PC.

This transition must feel cinematic.

---

# SCROLL CHAPTER 6 — PC EXPLODED VIEW

Animate components separating from the PC:

- GPU;
- RAM;
- motherboard;
- CPU;
- cooler;
- SSD;
- PSU;
- fans.

Every component must move to a clean readable position.

Use GSAP timeline synchronized with scroll.

When an object becomes active:

- highlight it;
- dim irrelevant objects;
- show its name;
- show short educational information;
- allow click for detailed information.

---

# 10. HARDWARE EXPLORER

Create an interactive:

`Computer Anatomy`

mode.

Categories:

External devices:

- monitor;
- keyboard;
- mouse;
- headset;
- microphone;
- webcam;
- speaker;
- printer.

Internal components:

- motherboard;
- processor;
- RAM;
- GPU;
- SSD;
- HDD;
- PSU;
- CPU cooler;
- fans;
- network card.

For every component provide:

- Kazakh name;
- Russian name;
- English name;
- description;
- purpose;
- key characteristics;
- compatibility concept;
- mini quiz.

Clicking a component should smoothly move the camera to it.

---

# 11. VIRTUAL PC ASSEMBLY LAB

Create a full interactive PC assembly exercise.

Start with an empty PC case.

Components appear separately.

Student must install parts in a logical order.

Example:

1. motherboard;
2. CPU;
3. thermal/cooling;
4. RAM;
5. NVMe;
6. motherboard into case;
7. PSU;
8. GPU;
9. storage;
10. cooling/fans;
11. cables.

Use realistic drag/snap interaction.

When hovering over the correct installation area show a subtle transparent ghost placement guide.

Correct placement:

- component snaps into place;
- short success animation;
- optional sound;
- progress increases.

Incorrect placement:

- do not punish aggressively;
- provide an educational hint.

Example:

"GPU PCIe x16 слотына орнатылады."

At the end show:

- completion percentage;
- errors;
- time;
- hints used;
- final score.

---

# 12. SETUP STUDIO 3D

Keep and massively improve the existing Setup Studio concept.

The user can build a complete computer setup.

Categories:

### Monitor
Allow:
- high refresh gaming monitor;
- productivity monitor;
- ultrawide monitor.

### Mouse
Brands/categories such as:
- Logitech G;
- Razer;
- similar current gaming devices.

### Keyboard
- mechanical;
- wireless;
- compact;
- full-size.

### Headset
- wired;
- wireless.

### PC case

### CPU

### GPU

### Motherboard

### RAM

### SSD

### PSU

### Cooling

### Desk

### Chair

### Speakers

The product system MUST be data-driven.

Create something similar to:

`src/data/hardwareCatalog.ts`

or a JSON/database layer.

Each entry should support:

id

category

brand

model

priceKZT

priceUpdatedAt

priceSource

specifications

compatibility

modelPath

thumbnail

colors

performanceTier

recommendedUse

Do NOT hardcode all product logic inside UI components.

---

# 13. CURRENT DEVICE CATALOG

When internet access is available during development, research CURRENT models from official manufacturer pages.

Prioritize popular/current models.

Examples of categories:

- ASUS ROG gaming monitors;
- Logitech G mice;
- Razer peripherals;
- NVIDIA GeForce RTX GPUs;
- AMD Ryzen CPUs;
- Intel Core CPUs;
- Corsair/NZXT cases;
- Kingston/Corsair RAM;
- Samsung/Kingston SSDs.

Do not invent specifications.

Store data sources and update dates.

If exact Kazakhstan market pricing cannot be verified, clearly mark values as:

"Demo price"

instead of pretending it is a live store price.

---

# 14. SETUP CONFIGURATION EXPERIENCE

User workflow:

Step 1.

Choose purpose:

- Gaming
- Study
- Programming
- 3D/Design
- Streaming
- Universal

Step 2.

Choose budget.

Example:

300 000 ₸

500 000 ₸

800 000 ₸

1 200 000 ₸

2 000 000 ₸

Custom.

Step 3.

Select preferred visual style:

- Black;
- White;
- Black/white;
- Minimal;
- RGB;
- no RGB.

Step 4.

Choose products.

Every choice updates the 3D scene immediately.

Step 5.

Compatibility validation.

Detect:

- motherboard/CPU socket mismatch;
- PSU insufficient;
- GPU does not fit case;
- RAM type mismatch;
- cooling mismatch.

Step 6.

Show final price.

Step 7.

Button:

"Сетапты көру"

---

# 15. FINAL SETUP ASSEMBLY ANIMATION

This is CRITICAL.

Before final animation:

SHOW AN EMPTY DESK.

Do not instantly teleport the completed setup into the scene.

When the student presses:

"Сетапты көру"

run a cinematic assembly sequence in front of their eyes.

Example:

1. empty desk appears;
2. monitor stand enters and snaps onto desk;
3. monitor appears and connects;
4. mouse pad unrolls;
5. keyboard slides into place;
6. mouse appears;
7. speakers arrive;
8. headset stand appears;
9. system unit case appears;
10. side panel opens;
11. motherboard enters case;
12. CPU installs;
13. RAM modules install;
14. SSD installs;
15. cooler installs;
16. PSU installs;
17. GPU installs;
18. cables connect;
19. fans begin spinning;
20. RGB turns on;
21. glass side panel closes;
22. monitor powers on;
23. complete setup lighting activates.

Use smooth physics-like easing.

Not cartoon bouncing.

Use premium cinematic movement.

After completion automatically move into a slow 360° orbit.

Provide:

"360° қарау"

"Ішін көру"

"Бөлшектер"

"Конфигурация"

"Өзгерту"

buttons.

---

# 16. 360 DEGREE VIEWER

Every important object must allow orbit interaction.

Controls:

Left mouse:
orbit.

Wheel:
zoom.

Right mouse or configured input:
pan only where appropriate.

Double click:
focus.

Button:
reset camera.

Button:
auto rotate.

Button:
exploded view.

Prevent camera from moving through geometry.

Use damping/inertia.

---

# 17. COLOR CONFIGURATOR

Allow changing:

PC case:

- black;
- white;
- graphite;
- silver.

RGB:

- off;
- white;
- cyan;
- blue;
- purple;
- red;
- custom.

Desk surface:

- dark wood;
- light wood;
- black;
- white.

Peripheral theme:

- black;
- white;
- mixed.

Material color change must preserve:

- roughness;
- normal maps;
- metallic response;
- texture details.

Do not replace realistic materials with flat CSS-like colors.

---

# 18. AI SETUP ASSISTANT

Create:

"AI Көмекші"

The user can type natural Kazakh/Russian.

Example:

"Маған 800 000 теңгеге ойын және программалауға компьютер жина."

or:

"1 200 000 теңгеге ақ түсті толық сетап керек."

or:

"Маған 300 Гц монитор және Logitech мышка керек."

AI assistant workflow:

1. parse budget;
2. parse purpose;
3. parse preferences;
4. parse colors;
5. find compatible hardware;
6. stay as close to budget as possible;
7. explain major choices;
8. load recommendation directly into Setup Studio;
9. allow user to modify it;
10. display recommended setup in 3D.

IMPORTANT SECURITY:

Never expose AI API keys in browser source code.

Use a backend/server API endpoint.

Use environment variables.

Example:

`OPENAI_API_KEY`

If no API key exists, implement a local deterministic recommendation engine as fallback.

The fallback must still produce working budget recommendations.

---

# 19. AI RECOMMENDATION ENGINE

Do not rely only on LLM text.

Create structured hardware selection logic.

Example scoring factors:

- budget;
- gaming performance;
- study/programming workload;
- GPU importance;
- CPU importance;
- RAM;
- storage;
- compatibility;
- available budget for peripherals.

Example priority for gaming:

GPU > CPU > RAM > SSD.

Example priority for programming/student use:

CPU + RAM + SSD > premium RGB accessories.

The recommendation must always use catalog data.

AI should return product IDs, not hallucinated random models.

---

# 20. MAIN EDUCATIONAL LABORATORY HUB

Create dashboard:

"Зертханалар"

Modules:

1. Компьютер құрылғылары
2. Компьютерді виртуалды жинау
3. Компьютерлік желілер
4. Алгоритм визуализациясы
5. Логикалық схемалар
6. Виртуалды тәжірибелер
7. Setup Studio 3D
8. Тапсырмалар
9. Менің нәтижелерім

Each module gets a premium visual card with subtle 3D preview.

---

# 21. NETWORK LAB

Create a virtual network simulator.

Devices:

- PC;
- laptop;
- router;
- switch;
- server;
- access point;
- printer;
- smartphone.

Student can drag devices into workspace.

Create cables by dragging ports.

Examples:

PC -> switch

switch -> router

router -> internet

Allow:

- IP address;
- subnet mask;
- gateway;
- DNS.

Visualize packets.

When student presses:

`PING`

show packet movement through the network.

Correct topology:
green packet animation.

Incorrect:
show where communication stops.

Assignments:

"3 компьютерді бір желіге қос."

"Router және switch арқылы LAN құр."

"IP адресін дұрыс бапта."

"Қате желіні түзет."

Automatic grading checks actual topology/configuration.

---

# 22. ALGORITHM VISUALIZER

Create an interactive visualization section.

Algorithms:

- linear search;
- binary search;
- bubble sort;
- selection sort;
- insertion sort;
- simple recursion;
- shortest-path visualization if appropriate.

Allow:

Play.

Pause.

Step forward.

Step backward.

Speed.

Reset.

Display:

current line of pseudocode.

Highlight active variables.

Show array elements moving smoothly.

Student should understand WHY the algorithm works.

Add mini tasks.

---

# 23. LOGIC CIRCUIT LAB

Create a visual logic circuit simulator.

Gates:

- AND;
- OR;
- NOT;
- XOR;
- NAND;
- NOR.

Student drags gates onto canvas.

Connect wires interactively.

Inputs:

0 / 1 switches.

Outputs:

LED visualization.

Automatically generate truth table where appropriate.

Examples of assignments:

"Y = A AND B схемасын құр."

"Y = NOT(A) OR B схемасын құр."

"Берілген ақиқат кестесіне сәйкес схема жаса."

Automatic grading compares circuit behavior, not only exact visual placement.

---

# 24. VIRTUAL EXPERIMENTS

Create a virtual experiments section.

Examples:

- CPU load vs temperature;
- RAM usage;
- storage speed;
- network latency;
- binary data transfer;
- CPU instruction concept;
- RGB color model;
- screen resolution;
- refresh rate visual comparison.

Experiments must be interactive.

Students change values and immediately see a visualization.

---

# 25. AUTOMATIC GRADING

Create reusable assessment logic.

Every exercise can contain:

id

type

instructions

expectedResult

maxScore

hints

gradingRules

attempts.

After completion show:

Score:
8/10

Time:
03:42

Errors:
2

Hints:
1

Status:
"Орындалды"

Give clear feedback.

Do not only show:

"Wrong".

Explain why.

---

# 26. STUDENT PROGRESS

Dashboard:

"Менің нәтижелерім"

Show:

- completed laboratories;
- average score;
- total points;
- achievements;
- progress percentage;
- latest activities.

Use clean charts.

Do not make fake analytics overly complicated.

Store progress locally first if no backend is configured.

Architecture must allow migration to Supabase/PostgreSQL later.

---

# 27. GAMIFICATION

Add tasteful gamification.

Achievements:

"Алғашқы компьютер"

"Желі шебері"

"Алгоритм зерттеуші"

"Логика инженері"

"100% зертхана"

"Perfect Build"

Use small premium animations.

Do NOT turn the interface into a children's mobile game.

---

# 28. LANGUAGES

Primary UI:

Kazakh.

Also architect translation support for:

Russian.

English.

Create centralized translation files.

Do not scatter translations across components.

Example:

`locales/kk.json`

`locales/ru.json`

`locales/en.json`

---

# 29. VISUAL STYLE

Overall style:

futuristic;

minimal;

premium;

realistic;

educational;

cinematic.

Primary background:

deep graphite / near black.

Secondary surfaces:

dark glass.

Accent:

cold cyan / electric blue.

Text:

white / light gray.

Use subtle gradients.

Use glass blur only where readable.

Avoid excessive neon.

Avoid huge rainbow gradients.

Avoid cartoon icons.

Avoid cheap UI templates.

Use whitespace.

Use typography hierarchy.

3D OBJECTS ARE THE HERO.

UI must not cover the 3D scene unnecessarily.

---

# 30. DESKTOP EXPERIENCE

The main cinematic experience is desktop-first because 3D interactions are important.

But the site must still be responsive.

Large desktop:
full quality.

Laptop:
high/medium.

Tablet:
simplified effects.

Phone:
lighter 3D scene or optimized product view.

Never let mobile download several hundred MB of assets immediately.

---

# 31. LOADING EXPERIENCE

Do not show a blank screen while GLB files load.

Create premium loader.

Show:

"3D зертхана жүктелуде"

Progress percentage.

Example:

42%

Optionally show asset category currently loading.

Load essential hero assets first.

Lazy-load laboratories later.

---

# 32. ERROR HANDLING

If a GLB fails:

do not crash whole application.

Show a graceful fallback.

Log useful diagnostic information.

If WebGL is unsupported:

show an informative simplified experience.

If AI backend is unavailable:

automatically switch to local recommendation mode.

---

# 33. SOUND

Optional subtle sound effects:

- device placement;
- click;
- PC startup;
- snap;
- success.

Add global sound toggle.

Default volume must be low.

Do not autoplay loud audio.

---

# 34. ACCESSIBILITY

Support:

- keyboard navigation for core UI;
- visible focus states;
- readable contrast;
- reduced-motion preference.

If:

`prefers-reduced-motion`

is active, reduce:

- camera movement;
- parallax;
- long cinematic effects.

Educational information must still be available without complex 3D interaction.

---

# 35. PROJECT STRUCTURE

Create a clean modular structure similar to:

src/

components/

ui/

layout/

3d/

scenes/

DeskScene/

PCScene/

HardwareExplorer/

SetupBuilder/

labs/

NetworkLab/

AlgorithmLab/

LogicLab/

Experiments/

pages/

Home/

Labs/

SetupStudio/

Progress/

data/

hardware/

lessons/

assignments/

store/

hooks/

lib/

services/

ai/

grading/

utils/

locales/

assets/

models/

textures/

hdr/

audio/

Do not create a single 5000-line `app.js`.

Refactor aggressively when needed.

---

# 36. 3D COMPONENT ARCHITECTURE

Create reusable components.

Examples:

`ProductModel`

`ModelLoader`

`CameraRig`

`CameraTransition`

`ExplodedView`

`Hotspot`

`HardwareInfoPanel`

`EnvironmentLighting`

`PerformanceManager`

`SetupAssemblyTimeline`

`PCAssemblyTimeline`

`OrbitProductViewer`

`QualityController`

Avoid duplicated Three.js setup logic.

---

# 37. CAMERA SYSTEM

Create named camera states.

Examples:

HOME_WIDE

DESK

MONITOR

KEYBOARD

MOUSE

PC_EXTERIOR

PC_INTERIOR

MOTHERBOARD

CPU

GPU

RAM

SSD

PSU

FINAL_SETUP.

Create a camera controller that interpolates:

position;

target;

FOV;

depth parameters.

Do not manually duplicate random camera values everywhere.

---

# 38. SCROLL STORY ENGINE

Use GSAP + ScrollTrigger.

Build one controlled timeline instead of dozens of conflicting listeners.

Scroll drives:

camera position;

camera target;

object rotation;

exploded view;

material opacity;

light intensity;

UI information panels.

The experience should feel like a continuous movie controlled by the user's wheel.

Use pin/scrub strategically.

Avoid aggressive scroll hijacking.

The user must always feel in control.

---

# 39. HOTSPOTS

Important 3D objects need interactive hotspots.

Hover:

small highlight.

Click:

focus camera.

Information panel appears.

Panel contains:

title;

description;

specification;

educational fact;

"Толығырақ"

"Тапсырма орындау".

Hide irrelevant hotspots when camera moves elsewhere.

---

# 40. PHOTOREALISTIC LIGHTING

Use HDRI for reflections.

Combine with controlled lights:

key light;

fill light;

rim light;

screen emissive light;

PC RGB.

Use realistic intensity.

Enable physically correct rendering where appropriate.

Use modern tone mapping.

Prevent blown highlights.

The PC should look like it is photographed in a studio.

---

# 41. GLASS

PC tempered glass must be visually convincing.

Use:

transmission/opacity appropriately;

roughness;

IOR where useful;

reflection.

Do not make glass completely invisible.

---

# 42. REFLECTIONS

Use environment reflections.

For premium hero shots optionally investigate:

reflection probes;

cube cameras;

screen-space techniques;

or baked reflections.

Prioritize performance.

---

# 43. FINAL SETUP PRESENTATION

After setup assembly:

lights dim slightly.

Camera moves to hero angle.

RGB turns on.

Monitor displays branded virtual lab wallpaper.

Camera performs slow orbit.

Show configuration panel.

Example:

Monitor — ...

Mouse — ...

Keyboard — ...

CPU — ...

GPU — ...

RAM — ...

SSD — ...

Total — 1 184 000 ₸

Then:

"360° қарау"

"ПК ішін көру"

"Өзгерту"

"AI-мен жақсарту".

---

# 44. DATA PERSISTENCE

Save:

configuration;

language;

graphics quality;

student progress;

completed labs;

scores;

preferences.

Use localStorage or IndexedDB initially.

Use versioned storage schema.

Do not break existing saved data every time structure changes.

---

# 45. TESTING

Test:

Chrome;

Edge;

Firefox where possible.

Test:

1920x1080;

1366x768;

1440p;

mobile.

Test:

mouse;

trackpad;

touch.

Test:

slow internet.

Test:

missing asset.

Test:

no AI API.

Test:

low performance device.

Run:

TypeScript check;

lint;

production build.

No serious console errors at completion.

---

# 46. PHASED IMPLEMENTATION

Do not attempt every feature randomly.

## PHASE 0 — AUDIT

Inspect existing project.

Create state documents.

Run current version.

Document working/broken features.

## PHASE 1 — FOUNDATION

Create modern architecture.

Router.

State management.

Design system.

Asset loader.

3D canvas.

Quality controller.

## PHASE 2 — CINEMATIC HERO

Build realistic desk scene.

Camera.

Scroll storytelling.

PC transition.

Exploded view.

This is PRIORITY #1.

Do not move to massive extra features until the hero experience looks professional.

## PHASE 3 — HARDWARE EXPLORER

Hotspots.

Information.

External and internal hardware.

## PHASE 4 — SETUP STUDIO

Catalog.

Selection.

Price.

Colors.

Compatibility.

360 viewer.

## PHASE 5 — ASSEMBLY ANIMATION

Empty desk.

Device placement.

PC internal assembly.

Final 360 presentation.

## PHASE 6 — AI ASSISTANT

Local recommender.

Backend abstraction.

Optional LLM provider.

## PHASE 7 — EDUCATIONAL LABS

Network.

Algorithms.

Logic circuits.

Virtual experiments.

## PHASE 8 — GRADING AND PROGRESS

Tasks.

Automatic grading.

Achievements.

Progress dashboard.

## PHASE 9 — OPTIMIZATION

GLB optimization.

Texture compression.

LOD.

Lazy loading.

FPS optimization.

## PHASE 10 — FINAL QA

Responsive.

Accessibility.

Error handling.

Testing.

Documentation.

---

# 47. DEVELOPMENT PRIORITY

When forced to choose between:

100 mediocre features

and

20 excellent working features,

choose excellent working features.

Especially PRIORITIZE:

1. realistic 3D hardware;
2. smooth camera movement;
3. scroll storytelling;
4. PC interior;
5. exploded hardware;
6. setup configurator;
7. final assembly animation;
8. 360° viewer;
9. performance.

These define the project visually.

---

# 48. ABSOLUTELY DO NOT DO THIS

Do not make final hardware from:

`BoxGeometry`

with random colors and call it realistic.

Do not make fake monitor using only a rectangle.

Do not make toy-like PC components.

Do not use emojis as the primary visual design.

Do not cover the screen with huge HTML panels.

Do not make every section a generic card grid.

Do not add meaningless particle effects everywhere.

Do not use excessive RGB.

Do not use copyrighted 3D models without checking the license.

Do not expose API keys.

Do not invent live prices.

Do not leave major buttons non-functional.

Do not write fake TODO features and present them as complete.

Do not destroy the existing project before auditing it.

---

# 49. TEMPORARY PLACEHOLDERS

During development primitive placeholders are allowed ONLY temporarily.

For example a box may temporarily represent a GPU while the interaction is being programmed.

But before marking the relevant phase complete:

replace it with a realistic optimized model.

Record temporary assets in:

`TODO.md`

as:

`[PLACEHOLDER] GPU model must be replaced`

Never mark the phase complete until important visible placeholders are resolved.

---

# 50. ACCEPTANCE CRITERIA FOR HERO

The homepage cannot be considered complete unless:

- realistic desk exists;
- realistic monitor exists;
- realistic mouse exists;
- realistic keyboard exists;
- realistic PC case exists;
- at least major internal components are visible;
- user can orbit;
- user can zoom;
- scroll changes camera;
- scroll enters PC;
- exploded view works;
- component information appears;
- animation is smooth;
- loader exists;
- quality setting exists;
- no major console errors;
- scene is responsive;
- obvious toy/primitive models are gone.

---

# 51. ACCEPTANCE CRITERIA FOR SETUP BUILDER

Not complete unless:

- product selection works;
- selected model appears in 3D;
- price updates;
- configuration persists;
- compatibility works;
- colors work;
- final assembly starts from empty desk;
- parts assemble visually;
- internal PC components assemble;
- final setup is visible;
- 360° works.

---

# 52. ACCEPTANCE CRITERIA FOR LABS

Not complete unless:

Network:
student can build at least one functioning topology and receive automated validation.

Algorithms:
at least three algorithms can be stepped through visually.

Logic:
student can build a real functional circuit with inputs and output.

Assessment:
score is automatically calculated.

Progress:
completed tasks persist.

---

# 53. DOCUMENTATION

Create README with:

project description;

screenshots section;

installation;

development command;

production build;

3D asset pipeline;

AI configuration;

folder architecture;

how to add hardware;

how to add assignment;

how to add translation;

performance notes.

---

# 54. START COMMAND

Make project easy to start.

Prefer:

`npm install`

`npm run dev`

Also keep/update a Windows start script if useful.

Do not require a complicated manual environment just to open the demo.

---

# 55. FIRST ACTION RIGHT NOW

Do this sequence now:

1. Inspect the entire existing project.
2. Run it.
3. Identify architecture and missing files/assets.
4. Create `PROJECT_STATE.md`.
5. Create `ROADMAP.md`.
6. Create `TODO.md`.
7. Create `ASSET_MANIFEST.md`.
8. Document what currently works.
9. Begin PHASE 1.
10. Then immediately build PHASE 2 — the realistic cinematic desk and PC scroll experience.

Do not spend most of the first session creating documentation only.

Start implementing visible functionality after the audit.

The first major deliverable I want to see is:

A photorealistic computer setup on a desk where scrolling moves the camera from the entire setup -> monitor -> keyboard -> mouse -> PC case -> inside the PC -> individual internal components, with smooth cinematic 3D transitions and interactive 360° viewing.

This single experience must already look premium before moving deeper into the other laboratories.

---

# 56. FINAL PRODUCT VISION

Imagine that a student opens the site.

They do not see a normal school portal.

They see a realistic computer setup as if it were physically in front of them.

They rotate it.

They scroll.

The camera approaches the monitor.

Then the keyboard.

Then the mouse.

Then the PC.

The glass opens.

The camera enters the computer.

GPU, RAM, CPU, motherboard and SSD separate into an exploded view.

The student clicks each component and learns how it works.

Then they enter assembly mode and build the PC themselves.

Then they choose a budget.

The AI recommends hardware.

They customize the setup.

They press:

"Сетапты көру"

An empty desk appears.

In real time the monitor, keyboard, mouse and accessories assemble on the desk.

The PC case opens.

Internal components install one by one.

The PC powers on.

RGB activates.

The camera rotates 360° around the completed setup.

Then the same student enters networking, algorithm and logic laboratories and completes automatically graded exercises.

THAT is the product.

Build toward this vision.

Do not simplify the core 3D concept unless required for device performance.

Start now.
