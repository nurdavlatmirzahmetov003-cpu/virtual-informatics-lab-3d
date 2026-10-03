# CHANGELOG

## 0.1.0 — 2026-10-03 — Фаза 0 (аудит) + Фаза 1 (негіз)

### Аудит
- `D:\VirtualLab` прототипі тексерілді: Three.js r160 (importmap, офлайн), `studio.js` (конфигуратор, каталог, жинау анимациясы, чат-бот, RGB тема, үйлесімділік), `scene.js` (scroll саяхат, 14 аялдама), `labs.js` (5 модуль, 100 ұпай), `thumbs.js`. Консоль қатесіз жұмыс істейді. Барлық 3D — процедуралық примитивтер (RoundedBox/Torus/Sphere).
- Прототип `legacy/`-ге көшірілді (түпнұсқа өзгертілмеді).

### Қосылды
- Vite 8 + React 19 + TypeScript 6 жобасы; ESLint flat config; `npm run dev|build|typecheck|lint|preview`.
- Тәуелділіктер: three 0.186, @react-three/fiber 9, drei 10, postprocessing, gsap, zustand 5, react-router 7, lucide-react, Manrope/Unbounded шрифттері.
- `scripts/copy-decoders.mjs` (postinstall): Draco + Basis декодерлері → `public/decoders/`.
- Дизайн токендері (`tokens.css`), global стиль, focus-visible, skip-link, reduced-motion.
- i18n: `kk.json` (эталон), `ru.json`, `en.json`; типтелген `TranslationKey`; `useT()`.
- Zustand `settingsStore` (тіл, сапа режимі, дыбыс) — versioned persist + migrate + localStorage fallback.
- Сапа жүйесі: 4 preset, GPU/құрылғы бойынша авто-анықтау, `PerformanceMonitor` арқылы автоматты төмендету.
- 3D компоненттер: `SceneCanvas`, `QualityController`, `PostEffects`, `EnvironmentLighting`, `CameraRig`, `ModelLoader`, `WebGLFallback`, `ErrorBoundary`.
- Аталған камера күйлері (`HOME_WIDE` … `FINAL_SETUP`).
- `HardwareItem` каталог схемасы (тек тип).
- Беттер: Басты (толық экран 3D + hero), Зертханалар (9 модуль, фаза статусы), Setup Studio, Нәтижелерім, 404.
- `LoaderOverlay` («3D зертхана жүктелуде», %, ресурс категориясы).
- `start.bat` (npm install + npm run dev).
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, ASSET_MANIFEST, CHANGELOG, KNOWN_ISSUES, ARCHITECTURE, README.
