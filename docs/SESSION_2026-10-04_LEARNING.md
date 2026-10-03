# 2026-10-04 — Білім беру зертханалары, тапсырмалар және прогресс

## Нәтиже
Қолданыстағы жоба/3D/каталог/AI қабаттары сақталды. Төрт білім беру модулі іске қосылды:

- Network: PC/laptop/router/switch/server/AP/printer/smartphone, максимум 16 құрылғы, жылжыту, порт/кабель, accessible select баламасы, IP/маска/gateway/DNS өрістері. LAN, router gateway, addressing және repair — 4 тапсырма. BFS тек switch/router/AP арқылы өтеді; IP қайталануы мен network/broadcast/маска/subnet қателері анықталады. PING пакеті SVG анимациясы.
- Algorithms: linear/binary search, bubble/selection/insertion sort. Immutable қадамдар, pseudocode, active indices/айнымалылар, массивтің көлденең қозғалысы, алға/артқа/autoplay/speed. Binary search сұрыпталған массивпен жұмыс істейтінін көрсетеді.
- Logic: 6 gate, максимум 10 gate, жылжыту/порт/сым, A/B switch, сигнал түсі/LED, 4 truth-table жолы. Бағалау графтың мінез-құлқын тексереді; балама NAND+NOT схемасы да өтеді. Цикл/қосылмаған кіріс белгісіз `?` береді.
- Experiments: CPU температурасы, RAM, сақтау жылдамдығы, latency, binary bits, RGB, resolution және refresh rate. Параметр/формула/визуал, decimal comma, дискретті мәндердің дәл бағалауы.

`EXERCISES`: 1 PC assembly + 5 algorithm + 4 network + 4 logic + 8 experiment + 18 anatomy = **40**. Assignment сілтемелері нақты тапсырмаға/құрылғыға апарады. Ең жақсы ұпай, соңғы әрекеттер, 3 achievement және орындалу пайызы `vil3d:progress` v2 арқылы сақталады. Lifetime best соңғы 200 әрекеттен бөлек; v1 деректері өшірілмей көшіріледі.

## Архитектура/оптимизация
Таза логика `src/lib/labs/`, реестр `src/data/labs/exercises.ts`, kk/ru/en мәтіндер `useEducationText.ts`, UI `pages/Labs/`. Global LoaderOverlay lazy. Rolldown `codeSplitting.includeDependenciesRecursively=false`: React/Zustand WebGL тобына кірмейді; production entry HTML Three/r3f preload жасамайды. 3D беттері өз модульдерін сұрағанда жүктейді.

## Тексерулер
- `npm test`: 23/23 (AI 9, assistant 4, assembly 3, PC Lab 2, education engines 4, progress 1). Progress тесті: 205 қайталаудан кейін де алдыңғы 100 ұпай сақталады, rehydrate/v1 migration/жарамсыз жазба тексерілді.
- Production build (TypeScript + Vite) және lint өтті. Chunk config-тің соңғы нұсқасы deprecation warning бермейді.
- Chromium desktop: LAN-ның 3 кабелі/PING/100, екі портты басу; duplicate IP қатесі; AND truth table/100; bubble forward/back/autoplay/100; refresh 60→300 Гц, 3.33 ms/100; assignment 40 жолы және monitor deep link/quiz/100.
- Progress: 6/40 = 15%, 600 best points; нашар қайталанған әрекет best score-ды түсірмейді; reload кейін сақталады.
- Mobile 375×812: тәжірибе, логика және PC assembly UI-ында horizontal page overflow жоқ; оқу графтарының ішкі панелі көлденең жылжиды. Нақты touch құрылғы тексерілмеген.
- Жаңа build-тегі `/studio/summary`: кино табиғи аяқталады; AI-мен жақсарту диалогы каталог ұсынысын/айырмасын көрсетеді. Ұсынысты қолданбай, бастапқы ASUS 300 Гц + Logitech жинағы сақталды.

Скриншоттар `docs/screenshots/{network-lab,logic-lab,algorithm-lab,experiment-lab,progress,assembly-final,assistant-improve}.jpg`.

## Шектеулер және жалғастыру
Бұл LAN симуляторы нақты ICMP/DNS немесе Internet routing орындамайды. Gate lab комбинациялық A/B схемасы. CPU т.б. тәжірибе мәндері оқу формулалары; нақты telemetry емес. Legacy импорты жоқ. Барлық SKU үшін дәл жеке GLB, қалған anatomy/орындық модельдері, KTX2/LOD және Firefox/Safari/нақты touch QA ашық. Нақты LLM кілтімен end-to-end тексерілмеген; API-сіз көмекші жұмыс істейді.

Жалғастыру нүктесі — PROJECT_STATE.md соңындағы NEXT_ACTION. Дайын модульдерді нөлден қайта жасама.
