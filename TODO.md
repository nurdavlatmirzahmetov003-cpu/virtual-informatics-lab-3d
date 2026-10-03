# TODO

## Placeholders (фаза жабылмас бұрын ауыстырылуы тиіс)
- [PLACEHOLDER] `src/scenes/FoundationScene` — Фаза 1 пайплайн тест сахнасы (ағаш тұғыр + 3 PBR калибровка сферасы). Фаза 2-де `DeskScene`-мен ауыстырылады, кейін файлды жою.
- [PLACEHOLDER] `CAMERA_STATES` (`src/data/camera/cameraStates.ts`) — үстел/ПК кадр мәндері шамамен; нақты модельдер орналасқан соң баптау.
- [PLACEHOLDER] `home.buildNote` мәтіні (kk/ru/en) — Фаза 1 туралы ескерту; Hero дайын болғанда алып тастау.
- [PLACEHOLDER] Labs беті — модульдер тізімі «Әзірленуде» статусымен; әр модуль іске асқанда сілтемеге айналады.

## Фаза 2 (келесі)
- [ ] Лицензиясы тексерілген GLB модельдерді табу/жасау (Poly Haven, Sketchfab CC0/CC-BY, Blender) → `ASSET_MANIFEST.md`-ге тіркеу.
- [ ] Asset пайплайн скрипті: `@gltf-transform/cli` (Draco/Meshopt, KTX2, resize 2K/1K/512).
- [ ] Poly Haven HDRI (studio, 1K/2K) → `public/assets/hdr/`, `EnvironmentLighting`-ке `files` опциясы.
- [ ] `DeskScene` + GSAP ScrollTrigger scroll story engine (бір timeline).
- [ ] Hotspot / HardwareInfoPanel компоненттері.
- [ ] ExplodedView компоненті.
- [ ] DOF (High/Ultra), монитор экраны эмиссиясы, PC RGB.
- [ ] `ModelLoader`-ді нақты GLB-мен тексеру (сәтті жүктеу + қате fallback жолы).

## Кейінгі фазалар
- [ ] Дыбыс: `settingsStore.soundEnabled/soundVolume` бар, бірақ UI тумблері жоқ — дыбыс эффектілері қосылғанда TopBar-ға қосу (төмен дыбыс, autoplay жоқ).
- [ ] Reduced-motion қолмен ауыстырғышы (қазір тек жүйе баптауы).
- [ ] README: скриншоттар бөлімі, hardware/assignment/translation қосу нұсқаулары (Фаза 10).
- [ ] Legacy `vlab_progress_v1` және `zertthana_build_v1` localStorage деректерін жаңа схемаға импорттау (Фаза 4/8).
- [ ] Тесттер: Vitest (i18n, quality detect, storage migrate) — Фаза 8/10.
