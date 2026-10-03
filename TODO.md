# TODO

## Placeholders (фаза жабылмас бұрын ауыстырылуы тиіс)
Барлығы `src/scenes/DeskScene/models/` ішінде, нақты өлшемдермен процедуралық түрде жасалған (BoxGeometry емес: extrude/lathe/деформацияланған сфера, InstancedMesh). §50 бойынша Hero жабылмас бұрын лицензиясы таза, оңтайландырылған GLB-ге ауыстырылуы тиіс:

- [PLACEHOLDER] Desk model must be replaced — `Desk.tsx` (Poly Haven емен үсті + болат рама)
- [PLACEHOLDER] Desk mat must be replaced — `DeskMat.tsx` (мата текстурасы + тігіс жиегі) — процедуралық нұсқа жеткілікті болуы мүмкін
- [PLACEHOLDER] Артқы корпус желдеткіші — `models/Fan.tsx` (алдыңғы 3 желдеткіш GLB-ге ауыстырылды; артқысы әлі процедуралық)
- [PLACEHOLDER] Құлаққап тұғыры — `models/HardwareDevices.tsx` (құлаққап GLB, тұғыр процедуралық цилиндр)
- [PLACEHOLDER] Room — `Room.tsx` (бетон еден, қабырға, емен slat панель) — архитектура, GLB міндетті емес
- [PLACEHOLDER] `CAMERA_STATES` MOTHERBOARD/CPU/GPU/RAM/SSD/PSU кадрлары қазір қолданылмайды (360° режимі `pc/parts.ts` focusDistance-ті пайдаланады) — Hardware Explorer-де қолдану немесе жою
- [PLACEHOLDER] Labs беті — модульдер «Әзірленуде» статусымен; іске асқанда сілтемеге айналады

## Фаза 2 — қалғаны
- [x] Лицензиясы тексерілген GLB модельдер (Poly Haven, Sketchfab CC0/CC-BY, Blender) → `ASSET_MANIFEST.md`; `ModelLoader` арқылы `models/*` және `pc/*` компоненттерін ауыстыру (`layout.ts` / `parts.ts` анкерлері сақталады)
- [x] Asset пайплайн: `npm run assets:optimize` (@gltf-transform: Meshopt, WebP 1K, simplify) + `npm run assets:validate`
- [x] `ModelLoader`-ді нақты GLB-мен тексеру (сәтті жолы; қате жолы → процедуралық fallback)
- [x] Draw calls <150: бір өту 46–124 (бұрын ~250–280)
- [x] Монитор / пернетақта / тышқан үшін 360° (құрылғыны басу немесе панельдегі «360° қарау»)
- [ ] Бөлшек панелінде «Тапсырма орындау» батырмасы (§39) — тапсырмалар жүйесімен бірге (Фаза 3/8)
- [ ] Брендтік логотиптерді (MSI, Cooler Master, Lian Li т.б.) текстуралардан алып тастау (Blender/Photoshop) — §6
- [ ] Үстел декоры: Poly Haven `potted_plant_04` (жүктелген, кодта қолданылмайды); үстел бетіне `european_walnut_veneer_04`

## Кейінгі фазалар
- [ ] Дыбыс: store-да бар, UI тумблері дыбыс эффектілерімен бірге
- [ ] Reduced-motion қолмен ауыстырғышы (қазір тек жүйе баптауы)
- [ ] README: скриншоттар, hardware/assignment/translation қосу нұсқаулары (Фаза 10)
- [ ] Legacy `vlab_progress_v1` / `zertthana_build_v1` деректерін импорттау (Фаза 4/8)
- [ ] Vitest: i18n, quality detect, storage migrate, story timeline chapter boundaries
