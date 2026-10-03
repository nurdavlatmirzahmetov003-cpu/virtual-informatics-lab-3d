# Virtual Informatics Lab 3D

**Оқушыларға арналған виртуалды информатика зертханасы** — шынайы 3D компьютер, Setup Studio және
интерактивті информатика зертханалары бар веб-платформа.

> Ағымдағы күй: Фаза 1 (негіз) аяқталды. Толық жоспар — `ROADMAP.md`, күй — `PROJECT_STATE.md`.

## Іске қосу

Node.js 20+ қажет.

```bash
npm install
npm run dev        # http://localhost:5173
```

Windows: `start.bat` (қажет болса `npm install` жасайды да, dev серверді ашады).

| Команда | Не істейді |
|---|---|
| `npm run dev` | Vite dev сервер |
| `npm run build` | `tsc -b` + production build → `dist/` |
| `npm run preview` | build-ті жергілікті көру |
| `npm run typecheck` | TypeScript тексеру |
| `npm run lint` | ESLint |

## Құрылым
Толығырақ: `ARCHITECTURE.md`.

- `src/components/3d` — SceneCanvas, сапа контроллері, жарық, камера, модель жүктегіш
- `src/locales` — `kk.json` (негізгі), `ru.json`, `en.json`
- `src/data/camera/cameraStates.ts` — аталған камера кадрлары
- `public/assets/{models,textures,hdr,audio}` — ассеттер (лицензиялары `ASSET_MANIFEST.md`-де)
- `legacy/` — ескі прототип (анықтама үшін; `python -m http.server 8077 --directory legacy`)

## Аударма қосу
Кілтті алдымен `src/locales/kk.json`-ға қосыңыз (TS кілттерді осыдан алады), содан кейін `ru.json` мен `en.json`-ға. Компонентте: `const t = useT(); t('home.title')`.

## Графика сапасы
Low / Medium / High / Ultra + Авто (`src/lib/quality`). Авто режим GPU мен құрылғыны анықтап, FPS төмендесе сапаны өзі түсіреді.

## AI конфигурациясы
Фаза 6-да. Кілт тек серверде: `.env` → `OPENAI_API_KEY` (`.env.example` қараңыз). Браузер кодына ешқашан қойылмайды.
