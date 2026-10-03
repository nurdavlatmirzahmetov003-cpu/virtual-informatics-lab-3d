# TODO

## Placeholders (фаза жабылмас бұрын ауыстырылуы тиіс)
Барлығы `src/scenes/DeskScene/models/` ішінде, нақты өлшемдермен процедуралық түрде жасалған (BoxGeometry емес: extrude/lathe/деформацияланған сфера, InstancedMesh). §50 бойынша Hero жабылмас бұрын лицензиясы таза, оңтайландырылған GLB-ге ауыстырылуы тиіс:

- [PLACEHOLDER] Desk model must be replaced — `Desk.tsx` (Poly Haven емен үсті + болат рама)
- [PLACEHOLDER] Monitor model must be replaced — `Monitor.tsx` (27″ панель, артқы корпус, тұғыр, эмиссивті экран, bias light)
- [PLACEHOLDER] Keyboard model must be replaced — `Keyboard.tsx` (TKL 87 перне, мүсінделген keycap-тар, алюминий рама)
- [PLACEHOLDER] Mouse model must be replaced — `Mouse.tsx` (деформацияланған сфера қабығы, UV-сызықтар, дөңгелек, бүйір батырмалар)
- [PLACEHOLDER] Desk mat must be replaced — `DeskMat.tsx` (мата текстурасы + тігіс жиегі) — процедуралық нұсқа жеткілікті болуы мүмкін
- [PLACEHOLDER] PC case model must be replaced — `PCCase.tsx` (болат шасси, шыңдалған шыны, торлы алдыңғы панель, 4 ARGB желдеткіш)
- [PLACEHOLDER] PC interior parts must be replaced — `PCCase.tsx` ішіндегі `motherboard`, `ram`, `cooler`, `gpu`, `psu-shroud`, `cables` топтары
- [PLACEHOLDER] Case fan model must be replaced — `Fan.tsx`
- [PLACEHOLDER] Headset + stand model must be replaced — `Headset.tsx`
- [PLACEHOLDER] Speaker models must be replaced — `Speakers.tsx`
- [PLACEHOLDER] Room — `Room.tsx` (бетон еден, қабырға, емен slat панель) — архитектура, GLB міндетті емес
- [PLACEHOLDER] `CAMERA_STATES` интерьер кадрлары (PC_INTERIOR, MOTHERBOARD, CPU, GPU, RAM, SSD, PSU) — бірінші жуықтау, келесі сессияда баптау
- [PLACEHOLDER] Labs беті — модульдер «Әзірленуде» статусымен; іске асқанда сілтемеге айналады

## Фаза 2 — келесі бөлім
- [ ] Chapter 6: ПК ішіне кіру — шыны панель ашылады/мөлдірленеді, ішкі жарық, камера `PC_INTERIOR`
- [ ] Chapter 7: exploded view (GPU, RAM, MB, CPU, кулер, SSD, PSU, желдеткіштер) — `PCCase` ішіндегі аталған топтарды timeline-мен жылжыту
- [ ] Белсенді бөлшекті highlight, қалғанын dim; аты + қысқа ақпарат; басқанда толық ақпарат
- [ ] SSD (NVMe M.2) және PSU-ды көрінетін етіп модельдеу (қазір PSU shroud астында жасырын, SSD жоқ)
- [ ] Hotspot / HardwareInfoPanel компоненттері
- [ ] Лицензиясы тексерілген GLB модельдер (Poly Haven, Sketchfab CC0/CC-BY, Blender) → `ASSET_MANIFEST.md`
- [ ] Asset пайплайн: `@gltf-transform/cli` (Draco/Meshopt, KTX2, 2K/1K/512)
- [ ] `ModelLoader`-ді нақты GLB-мен тексеру (сәтті + қате жолы)
- [ ] Монитор chapter-інде қолмен 360° айналдыру (қазір камера субъект айналасында ±0.55 рад орбита жасайды)

## Кейінгі фазалар
- [ ] Дыбыс: store-да бар, UI тумблері дыбыс эффектілерімен бірге
- [ ] Reduced-motion қолмен ауыстырғышы (қазір тек жүйе баптауы)
- [ ] README: скриншоттар, hardware/assignment/translation қосу нұсқаулары (Фаза 10)
- [ ] Legacy `vlab_progress_v1` / `zertthana_build_v1` деректерін импорттау (Фаза 4/8)
- [ ] Vitest: i18n, quality detect, storage migrate, story timeline chapter boundaries
