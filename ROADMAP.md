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
**2.3 ✅** Лицензиясы таза GLB модельдер (Sketchfab CC BY) + asset пайплайн, draw calls <150. Қалғаны: логотиптер, үстел текстурасы, §50 финалдық тексеру.

- Лицензиясы таза GLB модельдер: үстел, монитор, пернетақта, тышқан, наушник, колонкалар, корпус,
  ішкі бөліктер (MB, CPU, кулер, RAM, GPU, SSD, PSU, желдеткіштер).
- Poly Haven HDRI (1K–2K) + студиялық жарық.
- `DeskScene`: GSAP ScrollTrigger бір timeline — HOME_WIDE → MONITOR → KEYBOARD → MOUSE →
  PC_EXTERIOR → PC_INTERIOR → exploded view.
- Ақпарат панельдері, hotspot-тар, 360° айналдыру, DOF (High/Ultra).
- §50 қабылдау критерийлері орындалмайынша фаза жабылмайды.

## Фаза 3 — Hardware Explorer 🟡 (1-бөлім дайын, 2026-10-03)
**3.1 ✅** `/explorer` «Компьютер анатомиясы»: 8 сыртқы + 10 ішкі құрылғы, hotspot → камера фокусы, dim/highlight, kk/ru/en мәліметтер (атау, сипаттама, мақсат, сипаттамалар, үйлесімділік), 3 сұрақтық мини-квиз, 3D-сіз тізім режимі.
**3.2 ✅** PC Assembly Lab (§11): 3D drag/snap, реттілік, үйлесімділік, бағалау мен persist. 5 уақытша anatomy моделі жеке ашық жұмыс.

## Фаза 4 — Setup Studio ✅ (2026-10-03)
`data/hardware/catalog.ts` (15 санат, 64 өнім, ресми дереккөз + күн, «Demo price»), 5 қадамды конфигуратор, бюджетке сай ұсыныс,
тірі баға, 11 үйлесімділік ережесі, түстер (normal/roughness сақтай), 360° viewer, persist (`vil3d:setup` v1), `/studio/summary`.
Қалғаны: нақты KZ бағалары, өнім суреттері, әр өнімге жеке GLB, орындық GLB.

## Фаза 5 — Жинау анимациясы ✅
Бос үстел → 24-ке дейін қадамдық кино жинау → 360° orbit + «360° қарау / Ішін көру / Бөлшектер / Конфигурация / Өзгерту».

## Фаза 6 — AI көмекші 🟡 (6.1 жергілікті чат дайын; LLM backend әлі жоқ)
Жергілікті детерминистік recommender (каталог ID-лары), backend endpoint (`OPENAI_API_KEY` тек серверде), fallback.

## Фаза 7 — Білім беру зертханалары ⬜
Желі (PING анимациясы, авто-тексеру), алгоритмдер (≥3, қадам алға/артқа), логика (сүйреп қосу, ақиқат кестесі), тәжірибелер.

## Фаза 8 — Бағалау және прогресс ⬜
Ортақ grading логикасы, жетістіктер, «Менің нәтижелерім» дашборды, legacy прогресс миграциясы.

## Фаза 9 — Оптимизация ⬜
glTF Transform пайплайны, KTX2, LOD, instancing, lazy loading, FPS профильдеу.

## Фаза 10 — Финалдық QA ⬜
Браузерлер/экрандар/touch, қолжетімділік, қате өңдеу, README толық нұсқасы.
