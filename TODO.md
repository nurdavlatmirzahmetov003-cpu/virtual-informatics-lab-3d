# TODO

## Placeholders (фаза жабылмас бұрын ауыстырылуы тиіс)
Барлығы `src/scenes/DeskScene/models/` ішінде, нақты өлшемдермен процедуралық түрде жасалған (BoxGeometry емес: extrude/lathe/деформацияланған сфера, InstancedMesh). §50 бойынша Hero жабылмас бұрын лицензиясы таза, оңтайландырылған GLB-ге ауыстырылуы тиіс:

- [PLACEHOLDER] Desk model must be replaced — `Desk.tsx` (Poly Haven емен үсті + болат рама)
- [PLACEHOLDER] Monitor model must be replaced — `Monitor.tsx` (27″ панель, артқы корпус, тұғыр, эмиссивті экран, bias light)
- [PLACEHOLDER] Keyboard model must be replaced — `Keyboard.tsx` (TKL 87 перне, мүсінделген keycap-тар, алюминий рама)
- [PLACEHOLDER] Mouse model must be replaced — `Mouse.tsx` (деформацияланған сфера қабығы, UV-сызықтар, дөңгелек, бүйір батырмалар)
- [PLACEHOLDER] Desk mat must be replaced — `DeskMat.tsx` (мата текстурасы + тігіс жиегі) — процедуралық нұсқа жеткілікті болуы мүмкін
- [PLACEHOLDER] PC case (chassis) model must be replaced — `pc/Chassis.tsx` (болат шасси, алынатын шыңдалған шыны, торлы алдыңғы панель, PSU shroud, артқы желдеткіш, кабельдер)
- [PLACEHOLDER] Motherboard model must be replaced — `pc/Motherboard.tsx` (PCB текстурасы, қабырғалы VRM радиаторлары, LGA рамасы, 4 DIMM, PCIe, M.2, конденсаторлар)
- [PLACEHOLDER] CPU model must be replaced — `pc/Cpu.tsx` (субстрат, ойығы бар IHS, таңба)
- [PLACEHOLDER] CPU cooler model must be replaced — `pc/CpuCooler.tsx` (46 қабырға, 4 мыс жылу түтігі, 120 мм желдеткіш)
- [PLACEHOLDER] RAM kit model must be replaced — `pc/RamKit.tsx` (4 × DDR5, радиатор профилі, алтын контактілер, RGB)
- [PLACEHOLDER] GPU model must be replaced — `pc/Gpu.tsx` (тесігі бар қаптама, 3 желдеткіш, қабырғалар, backplate, PCIe, кронштейн)
- [PLACEHOLDER] NVMe SSD model must be replaced — `pc/NvmeSsd.tsx` (M.2 2280, чиптер, жапсырма, кілт ойығы)
- [PLACEHOLDER] PSU model must be replaced — `pc/Psu.tsx` (желдеткіш торы, модульді панель, ұяшықтар, жапсырма)
- [PLACEHOLDER] Case fan model must be replaced — `models/Fan.tsx` (корпус + GPU/frameless нұсқасы)
- [PLACEHOLDER] Headset + stand model must be replaced — `Headset.tsx`
- [PLACEHOLDER] Speaker models must be replaced — `Speakers.tsx`
- [PLACEHOLDER] Room — `Room.tsx` (бетон еден, қабырға, емен slat панель) — архитектура, GLB міндетті емес
- [PLACEHOLDER] `CAMERA_STATES` MOTHERBOARD/CPU/GPU/RAM/SSD/PSU кадрлары қазір қолданылмайды (360° режимі `pc/parts.ts` focusDistance-ті пайдаланады) — Hardware Explorer-де қолдану немесе жою
- [PLACEHOLDER] Labs беті — модульдер «Әзірленуде» статусымен; іске асқанда сілтемеге айналады

## Фаза 2 — қалғаны
- [ ] Лицензиясы тексерілген GLB модельдер (Poly Haven, Sketchfab CC0/CC-BY, Blender) → `ASSET_MANIFEST.md`; `ModelLoader` арқылы `models/*` және `pc/*` компоненттерін ауыстыру (`layout.ts` / `parts.ts` анкерлері сақталады)
- [ ] Asset пайплайн: `@gltf-transform/cli` (Draco/Meshopt, KTX2, 2K/1K/512)
- [ ] `ModelLoader`-ді нақты GLB-мен тексеру (сәтті + қате жолы)
- [ ] Статикалық mesh-терді біріктіру (draw calls ~250 → <150), әсіресе ПК ішіндегі ұсақ бөлшектер
- [ ] Монитор / пернетақта / тышқан үшін де hotspot + 360° (қазір тек ПК бөлшектері)
- [ ] Бөлшек панелінде «Тапсырма орындау» батырмасы (§39) — тапсырмалар жүйесімен бірге (Фаза 3/8)

## Кейінгі фазалар
- [ ] Дыбыс: store-да бар, UI тумблері дыбыс эффектілерімен бірге
- [ ] Reduced-motion қолмен ауыстырғышы (қазір тек жүйе баптауы)
- [ ] README: скриншоттар, hardware/assignment/translation қосу нұсқаулары (Фаза 10)
- [ ] Legacy `vlab_progress_v1` / `zertthana_build_v1` деректерін импорттау (Фаза 4/8)
- [ ] Vitest: i18n, quality detect, storage migrate, story timeline chapter boundaries
