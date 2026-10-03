# PROJECT STATE — Virtual Informatics Lab 3D

Жаңартылды: 2026-10-03
**Ағымдағы фаза: 1 аяқталды → келесі Фаза 2 (Кинематографиялық Hero)**

> Жаңа сессия басталғанда: алдымен осы файлды, `ROADMAP.md`, `TODO.md` оқы, содан кейін төмендегі `NEXT_ACTION`-нан жалғастыр. Жобаны нөлден бастама.

## Күйі
Фаза 0 (аудит) және Фаза 1 (негіз) аяқталды. Жоба `npm install && npm run dev` арқылы іске қосылады; `npm run typecheck`, `npm run lint`, `npm run build` қатесіз өтеді. Басты беттегі 3D сахна — уақытша пайплайн тест сахнасы (нақты аппаратура емес).

## Аяқталған модульдер
- **Аудит:** `D:\VirtualLab` прототипі тексеріліп, `legacy/`-ге көшірілді (түпнұсқа өзгертілмеді). Көшіру жоспары — `ARCHITECTURE.md`.
- **Build/tooling:** Vite 8, React 19, TS 6 (strict), ESLint 10, `@/` alias, vendor chunk-тар, Draco/Basis декодерлерін көшіру (postinstall).
- **Router:** `/`, `/labs`, `/studio`, `/progress`, `*` (404) — барлығы lazy.
- **State:** Zustand `settingsStore` (тіл, сапа режимі, дыбыс) — persist v1 + migrate + fallback.
- **i18n:** kk (негізгі) / ru / en, типтелген кілттер, `<html lang>` + `<title>` синхрон.
- **Дизайн жүйесі:** токендер, CSS Modules, Manrope + Unbounded (офлайн), focus-visible, skip-link, reduced-motion.
- **3D негізі:** `SceneCanvas` (WebGL тексеру, ErrorBoundary, tab жасырын кезде рендер тоқтайды), `QualityController` (4 preset + авто + FPS бойынша төмендету), `PostEffects` (bloom/vignette/Neutral tone mapping, High/Ultra), `EnvironmentLighting` (офлайн softbox env + key/fill/rim), `CameraRig` (аталған күйлер, damping, портрет framing), `ModelLoader` (Draco/Meshopt/KTX2, жергілікті қате fallback), `LoaderOverlay` (%, категория), `WebGLFallback`.
- **Беттер:** Басты (толық экран 3D + hero + CTA), Зертханалар (9 модуль тізімі, фаза статусы), Setup Studio / Нәтижелерім (статус беттері), 404.

## Жартылай аяқталған
- `ModelLoader` — кодталған, бірақ нақты GLB жоқ болғандықтан әлі тексерілмеген.
- `CAMERA_STATES` — үстел/ПК кадр мәндері шамамен.
- `HardwareItem` — тек схема; каталог Фаза 4-те.
- Дыбыс — тек баптау store-да, UI жоқ.

## Тексерілгені (in-app Chromium)
- Desktop 1280×720: Low және High режимдері рендерленеді (High: antialias, DPR clamp, post-processing).
- Тіл ауыстыру kk→ru: мәтіндер, `<title>`, `lang` ауысады; persist сақталады.
- Навигация `/` → `/labs`: canvas толық unmount болады (0 canvas).
- 404 беті; мобильді эмуляция 375×812: горизонталь скролл жоқ, TopBar дұрыс, сахна кадрда.
- Консольде қате жоқ (тек three/ANGLE ескертулері — KNOWN_ISSUES #5–6).

## Осы сессияда жасалған/өзгертілген файлдар
- Конфиг: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `.gitignore`, `.env.example`, `start.bat`, `scripts/copy-decoders.mjs`, `public/favicon.svg`
- `src/main.tsx`, `src/app/router.tsx`
- `src/styles/{tokens,global}.css`, `src/locales/{kk,ru,en}.json`
- `src/lib/{storage,webgl}.ts`, `src/lib/i18n/index.ts`, `src/lib/quality/{presets,detect}.ts`, `src/lib/three/{loaders,framing}.ts`
- `src/store/settingsStore.ts`
- `src/hooks/{useT,useQualityPreset,useMediaQuery,usePageVisible,useDocumentTitle}.ts`
- `src/data/camera/cameraStates.ts`, `src/data/hardware/types.ts`
- `src/components/ErrorBoundary.tsx`, `src/components/3d/*`, `src/components/ui/*`, `src/components/layout/*`
- `src/scenes/FoundationScene/FoundationScene.tsx`
- `src/pages/{Home,Labs,SetupStudio,Progress,NotFound,shared}/*`
- `public/assets/textures/*` (Poly Haven CC0, legacy-ден)
- `legacy/**` (прототип көшірмесі)
- Құжаттар: `PROJECT_STATE.md`, `ROADMAP.md`, `TODO.md`, `ASSET_MANIFEST.md`, `CHANGELOG.md`, `KNOWN_ISSUES.md`, `ARCHITECTURE.md`, `README.md`

## Іске қосу командалары
```bash
cd D:\informatics-lab
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run lint
npm run build        # dist/
npm run preview
```
Legacy прототип: `python -m http.server 8077 --directory legacy` → http://127.0.0.1:8077

## Ағымдағы багтар
`KNOWN_ISSUES.md` қараңыз (негізгілері: hero уақытша; бастапқы JS-ке three кіреді; ModelLoader GLB-мен тексерілмеген; Firefox/Safari тексерілмеген).

## Жетіспейтін ассеттер
- Барлық GLB модельдер: үстел, монитор, пернетақта, тышқан, наушник, колонкалар, кілемше, ПК корпусы, аналық плата, CPU, кулер/СҚО, RAM, GPU, SSD (NVMe), PSU, желдеткіштер.
- Студиялық HDRI (Poly Haven, 1K/2K).
- Дыбыс эффектілері.
- Каталог деректері (ресми спецификациялар + күн).

## Маңызды архитектуралық шешімдер
1. Жаңа жоба `D:\informatics-lab`-та; прототип тек `legacy/`-де анықтама ретінде, build-ке кірмейді.
2. WebGL контекст тек `SceneCanvas` арқылы; бет ауысқанда dispose → зертханалар бір уақытта жадта тұрмайды.
3. Сапа: persist етілетін `qualityMode` + есептелетін `autoQuality`; Ultra тек қолмен.
4. Tone mapping: Neutral (renderer) немесе post ішіндегі Neutral — ешқашан екеуі бірге емес.
5. HDRI/CDN тәуелділігі жоқ: орта Lightformer-лермен жергілікті жасалады.
6. Барлық камера кадрлары `CAMERA_STATES`-те; кездейсоқ камера мәндері компоненттерде жазылмайды.
7. i18n тәуелділіксіз, кілттер `kk.json`-нан типтеледі.
8. localStorage кілттері `vil3d:*`, әр slice-тың схема нұсқасы бар.

NEXT_ACTION: Фаза 2-ні бастау — (1) лицензиясы таза GLB модельдерді іздеу/жасау (алдымен үстел, монитор, пернетақта, тышқан, ПК корпусы + ішкі бөліктер), әрқайсысын ASSET_MANIFEST.md-ге тіркеу; (2) `@gltf-transform/cli` негізіндегі `scripts/optimize-assets` пайплайнын қосу; (3) `src/scenes/DeskScene` жасап, басты беттегі `FoundationScene`-ді ауыстыру; (4) GSAP ScrollTrigger бір timeline-мен HOME_WIDE → MONITOR → KEYBOARD → MOUSE → PC_EXTERIOR → PC_INTERIOR → exploded view scroll story engine құру.
