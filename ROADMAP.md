# ROADMAP

Толық сипаттама: `MASTER_PROMPT.md` §46. Белгілер: ✅ дайын · 🟡 жартылай · ⬜ басталмаған.

## Фаза 0 — Аудит ✅ (2026-10-03)
- `D:\informatics-lab` ішінде тек `MASTER_PROMPT.md` болды; ескі прототип `D:\VirtualLab`-та табылды.
- Прототип іске қосылып тексерілді (консоль қатесіз, 17 бөлікті жинау анимациясы жұмыс істейді).
- Прототип `legacy/`-ге көшірілді (түпнұсқа `D:\VirtualLab` өзгертілмеді).
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, ASSET_MANIFEST, CHANGELOG, KNOWN_ISSUES, ARCHITECTURE.

## Фаза 1 — Негіз ✅ (2026-10-03)
- Vite + React + TS + three + R3F + drei + postprocessing + GSAP + Zustand + Router + lucide.
- Папкалар құрылымы (§35), дизайн токендері, CSS Modules.
- i18n: kk/ru/en (орталықтанған JSON, типтелген кілттер).
- SceneCanvas, QualityController (Low/Medium/High/Ultra + авто), PostEffects, EnvironmentLighting,
  CameraRig (аталған камера күйлері), ModelLoader (Draco/Meshopt/KTX2 + error boundary),
  LoaderOverlay, WebGL fallback.
- Беттер: Басты (3D), Зертханалар, Setup Studio, Нәтижелерім, 404.

## Фаза 2 — Кинематографиялық Hero 🟡 (1-бөлім дайын, 2026-10-03)
**2.1 ✅** Үстел сахнасы (процедуралық уақытша модельдер), Poly Haven HDRI + key/fill/rim + монитор RectAreaLight + bias light,
Neutral tone mapping, DOF (High/Ultra), бір GSAP ScrollTrigger timeline: 5 chapter (Сетап → Монитор → Пернетақта →
Тышқан → Жүйелік блок) + ақпарат панельдері (kk/ru/en), chapter навигациясы, прогресс, сүйреп орбита, мобильді bottom sheet.
**2.2 ✅** ПК 8 бөлшекке бөлінді, Chapter 6 «Корпустың іші» (шыны алынады), Chapter 7 exploded view (бөлшек бойынша фокус +
ақпарат, highlight/dim), hotspot-тар, 360° режимі (OrbitControls, reset, auto-rotate, жинау/бөлшектеу), өнімділік оптимизациясы.
**2.3 ⬜ ← КЕЛЕСІ** Лицензиясы таза GLB модельдер + asset пайплайн (§50 қабылдау критерийлері үшін), draw call азайту.

- Лицензиясы таза GLB модельдер: үстел, монитор, пернетақта, тышқан, наушник, колонкалар, корпус,
  ішкі бөліктер (MB, CPU, кулер, RAM, GPU, SSD, PSU, желдеткіштер).
- Poly Haven HDRI (1K–2K) + студиялық жарық.
- `DeskScene`: GSAP ScrollTrigger бір timeline — HOME_WIDE → MONITOR → KEYBOARD → MOUSE →
  PC_EXTERIOR → PC_INTERIOR → exploded view.
- Ақпарат панельдері, hotspot-тар, 360° айналдыру, DOF (High/Ultra).
- §50 қабылдау критерийлері орындалмайынша фаза жабылмайды.

## Фаза 3 — Hardware Explorer ⬜
Computer Anatomy режимі, hotspot → камера фокусы, kk/ru/en атаулар, мини-квиз; PC Assembly Lab.

## Фаза 4 — Setup Studio ⬜
`data/hardware/catalog.ts` (ресми дереккөз + күн, «Demo price»), таңдау, баға, түстер (PBR сақтай),
үйлесімділік, 360° viewer, persist.

## Фаза 5 — Жинау анимациясы ⬜
Бос үстел → 23 қадамдық кино жинау → 360° orbit + «360° қарау / Ішін көру / Бөлшектер / Конфигурация / Өзгерту».

## Фаза 6 — AI көмекші ⬜
Жергілікті детерминистік recommender (каталог ID-лары), backend endpoint (`OPENAI_API_KEY` тек серверде), fallback.

## Фаза 7 — Білім беру зертханалары ⬜
Желі (PING анимациясы, авто-тексеру), алгоритмдер (≥3, қадам алға/артқа), логика (сүйреп қосу, ақиқат кестесі), тәжірибелер.

## Фаза 8 — Бағалау және прогресс ⬜
Ортақ grading логикасы, жетістіктер, «Менің нәтижелерім» дашборды, legacy прогресс миграциясы.

## Фаза 9 — Оптимизация ⬜
glTF Transform пайплайны, KTX2, LOD, instancing, lazy loading, FPS профильдеу.

## Фаза 10 — Финалдық QA ⬜
Браузерлер/экрандар/touch, қолжетімділік, қате өңдеу, README толық нұсқасы.
