# DEVICE CATALOG (V2): 60 devices

Stage V2-0, 2026-10-10. This file is the source list for V2-3 (zones), V2-4a/b (360° viewer, info and quiz), V2-5 (teardown) and V2-6 (ports and cables).

- **The site text** for each device (name, explanations, quiz) goes into the locale files under `devices.<id>.*` in V2-4. The names below are reference translations: kk is the reference language, then ru and en.
- **Models:** see `ASSET_SOURCING.md` (by `id`).

## Fields

| Field | Meaning |
|---|---|
| `id` | Stable snake_case key: locale keys `devices.<id>`, model `devices/<id>.glb`, progress `device:<id>` |
| kk / ru / en | Name |
| Student | Explanation for a school student (grades 5–9): one sentence, no jargon |
| Adult | Technical explanation for an adult learner: interfaces, parameters |
| Teardown | ✅ exploded view with the listed parts; ◐ simple (2–3 parts: cover/inside); — none |
| Ports | Connectors on the device. Names match the port markers `port_<type>_<n>` (see the list at the end) |
| Zone | Lab zone (V2-3) |
| Quiz | Quiz topics (3–5 questions each in V2-4) |

## Lab zones (V2-3)

| Zone `id` | kk | ru | en | Contents |
|---|---|---|---|---|
| `assembly` | Жинау үстелі | Стол сборки ПК | PC build bench | PC internals, teardown of the system unit |
| `storage` | Жад қабырғасы | Стена накопителей | Storage wall | HDD/SSD/flash/disc, speed comparison |
| `peripherals` | Перифериялар үстелі | Стол периферии | Peripherals desk | Input/output devices, cables and ports |
| `print_media` | Баспа және медиа бұрышы | Уголок печати и медиа | Print & media corner | Printers, scanner, projector, 3D printer, interactive panel |
| `network` | Желі бұрышы | Сетевой уголок | Network corner | Router, switch, rack, Wi-Fi, Ethernet |
| `mobile` | Мобильді құрылғылар | Мобильные устройства | Mobile devices | Laptop, smartphone, tablet, all-in-one, smartwatch |
| `power` | Қуат және кабельдер | Питание и кабели | Power & cables | UPS, dock, hub, card reader, all cables |

---

## 1. PC internals (12), zone `assembly`

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Quiz |
|---|---|---|---|---|---|---|---|
| 1 | `cpu` | Процессор / Процессор / CPU | The computer's "brain": it runs every command. | Executes instructions; cores/threads, clock speed (GHz), cache L1–L3, TDP, socket (AM5, LGA1700/1851), iGPU (F series has none). | ✅ heat spreader (IHS), die, substrate, contacts/pins | `cpu_socket` (pins or pads) | cores vs threads; GHz; what a socket is; F series has no video; why thermal paste |
| 2 | `cooler_air` | Ауа кулері / Воздушный кулер / Air CPU cooler | A metal radiator and fan that cool the processor. | Heat pipes → fin stack → fan; TDP rating, height (case clearance), mounting bracket, PWM 4-pin. | ✅ fan, fin stack, heat pipes, base plate, bracket | `fan_4pin` (CPU_FAN) | why the CPU heats up; heat pipe principle; what happens without a cooler (V2-7) |
| 3 | `cooler_liquid` | Сұйық салқындату (СЖО) / Жидкостное охлаждение / AIO liquid cooler | Liquid carries heat to a radiator. | Closed loop: pump block → tubes → 240/360 mm radiator → fans; pump RPM, mounting on top/front. | ✅ pump block, tubes, radiator, 2–3 fans | `fan_4pin`, `pump_3pin`, `usb_internal` | air vs liquid; radiator size; where the pump connects |
| 4 | `motherboard` | Аналық плата / Материнская плата / Motherboard | The board every part plugs into. | Chipset, VRM, DIMM slots, PCIe x16/x1, M.2, SATA, front-panel header, ATX/mATX/ITX form factors. | ✅ PCB, VRM heatsinks, I/O shield, M.2 cover, chipset heatsink | `cpu_socket`, `dimm`, `pcie_x16`, `pcie_x1`, `m2`, `sata_data`, `atx_24pin`, `eps_8pin`, `fan_4pin`, `usb_a`, `usb_c`, `rj45`, `hdmi`, `displayport`, `audio_35` | form factors; which slot is for what; what a chipset is; rear panel ports |
| 5 | `ram` | Жедел жад (RAM) / Оперативная память (ОЗУ) / Memory (RAM) | Fast short-term memory: it is wiped when the power goes off. | DDR4/DDR5 DIMM, capacity, MT/s frequency, CL latency, dual channel, key notch. | ◐ heat spreader, PCB with memory chips | `dimm` (edge connector) | RAM vs storage; why it clears on power-off; dual channel; DDR4 ≠ DDR5 notch |
| 6 | `gpu` | Видеокарта / Видеокарта / Graphics card (GPU) | Draws the picture on screen and runs games. | GPU chip + VRAM, PCIe x16, power (8-pin / 12V-2x6), outputs HDMI/DP, cooling. | ✅ fans, shroud, heatsink, GPU chip, PCB, backplate, I/O bracket (proved in V2-0) | `pcie_x16`, `pcie_8pin`, `hdmi`, `displayport` | iGPU vs dGPU; VRAM; why extra power; which port the monitor uses |
| 7 | `psu` | Қоректендіру блогы / Блок питания / Power supply unit (PSU) | Turns mains power into safe power for the computer. | AC 230 V → DC 12/5/3.3 V; watts, 80 PLUS efficiency, modular cables, ATX 3.x. | ✅ case, fan, (inside: transformer, capacitors, heatsinks, schematic) | `iec_c14` (mains), `atx_24pin`, `eps_8pin`, `pcie_8pin`, `sata_power` | how many watts are needed; 80 PLUS; why a weak PSU shuts down (V2-7) |
| 8 | `case` | Жүйелік блок корпусы / Корпус системного блока / PC case | The "house" that protects all the parts. | Form factors (ATX mid tower…), airflow, front panel, dust filters, GPU and cooler clearance. | ✅ side panels (glass/steel), front panel, top panel, frame, filters | `usb_a`, `usb_c`, `audio_35` (front panel), `power_button` | airflow direction; form factor compatibility; front panel connectors |
| 9 | `case_fan` | Корпус желдеткіші / Корпусный вентилятор / Case fan | Brings cool air into the case and pushes hot air out. | 120/140 mm, RPM, PWM vs DC, static pressure vs airflow, intake/exhaust. | ◐ frame, rotor, motor | `fan_4pin` | intake vs exhaust; which way air flows; PWM |
| 10 | `thermal_paste` | Термопаста / Термопаста / Thermal paste | A paste that passes heat from the processor to the cooler. | Fills micro gaps between IHS and cold plate; thermal conductivity W/m·K; application amount. | — | — | why paste is needed; how much to apply; what happens without it |
| 11 | `internal_cables` | Ішкі кабельдер / Внутренние кабели / Internal cables | Cables that power the parts and connect them to each other. | ATX 24-pin, EPS 8-pin, PCIe 8-pin/12V-2x6, SATA power/data, front-panel cables, fan cables. | — | `atx_24pin`, `eps_8pin`, `pcie_8pin`, `sata_power`, `sata_data` | which cable goes where; keyed connectors |
| 12 | `cmos_battery` | CMOS батареясы / Батарейка CMOS / CMOS battery | A small battery that keeps the computer's clock and settings. | CR2032, powers the RTC and UEFI settings; time resets when it is dead. | — | — | why the clock resets; what BIOS/UEFI is |

## 2. Storage (9), zone `storage`

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Quiz |
|---|---|---|---|---|---|---|---|
| 13 | `hdd_35` | 3,5″ қатқыл диск (HDD) / Жёсткий диск 3,5″ / 3.5″ hard disk drive | Stores data magnetically on spinning platters. | Platters, head, actuator; 5400/7200 RPM, ~150–250 MB/s, cheap per TB; sensitive to shocks. | ✅ cover, platters, read/write head + arm, actuator magnet, spindle motor, controller board | `sata_data`, `sata_power` | why HDD is slow; RPM; HDD vs SSD (V2-7 boot test) |
| 14 | `hdd_25` | 2,5″ қатқыл диск / Жёсткий диск 2,5″ / 2.5″ HDD | A smaller hard disk for laptops. | 2.5″ form factor, 7–9.5 mm, 5400 RPM, laptop and external drives. | ◐ cover, platter, head | `sata_data`, `sata_power` | 2.5″ vs 3.5″; where it is used |
| 15 | `ssd_sata` | SATA SSD (2,5″) / SATA SSD / SATA SSD | Fast storage with no moving parts. | NAND flash + controller, SATA III ≈ 550 MB/s limit, 2.5″. | ◐ case, PCB, NAND chips, controller | `sata_data`, `sata_power` | why SSD is faster; SATA limit; no moving parts |
| 16 | `ssd_nvme` | NVMe M.2 SSD / NVMe SSD M.2 / NVMe M.2 SSD | A very fast, small stick-shaped storage drive. | PCIe 3.0/4.0/5.0 ×4, 3500–14000 MB/s, M.2 2280, M-key; heatsink. | ◐ heatsink, PCB, controller, NAND, DRAM | `m2` (M-key) | NVMe vs SATA; PCIe generations; M.2 ≠ always NVMe |
| 17 | `usb_flash` | Флешка (USB жинақтағыш) / USB-флешка / USB flash drive | A small portable storage that plugs into USB. | NAND + USB controller, USB 2.0/3.x speeds, FAT32/exFAT. | ◐ cap/shell, PCB | `usb_a` / `usb_c` | USB 2.0 vs 3.x; file systems; safe eject |
| 18 | `sd_card` | SD / microSD жад картасы / Карта памяти SD / microSD / SD / microSD card | A tiny memory card for cameras and phones. | SD/SDHC/SDXC, speed classes (U1/U3, V30, A1/A2), microSD + adapter. | — | `sd_slot` | capacity classes; speed class marks; where they are used |
| 19 | `external_drive` | Сыртқы диск / Внешний диск / External drive | A drive in a box for backups and carrying files. | 2.5″ HDD or SSD in a USB enclosure, USB 3.2 / USB-C, power over USB. | ◐ enclosure, drive, USB bridge board | `usb_c` / `usb_micro_b` | backup idea (3-2-1); HDD vs SSD external |
| 20 | `optical_disc` | CD/DVD/Blu-ray дискі / Оптический диск / Optical disc | A shiny disc read by a laser. | CD 700 MB, DVD 4.7/8.5 GB, BD 25–100 GB; pits and lands, laser wavelengths. | — | — | capacities; why Blu-ray holds more (laser); read-only vs RW |
| 21 | `optical_drive` | Оптикалық жетек / Оптический привод / Optical drive | A device that reads and writes discs. | 5.25″ bay, SATA, laser pickup, tray; external USB variants. | ◐ tray, laser unit, motor | `sata_data`, `sata_power` | why modern PCs drop them; reading vs writing |

## 3. Input devices (7), zone `peripherals`

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Quiz |
|---|---|---|---|---|---|---|---|
| 22 | `keyboard` | Пернетақта / Клавиатура / Keyboard | Used to type letters and commands. | Membrane vs mechanical switches, layouts (ANSI/ISO, KZ/RU), full/TKL/75 %, wired/2.4 GHz/Bluetooth, polling rate. | ✅ keycaps, plate + switches, PCB, case (mechanical) | `usb_a` / `usb_c` / wireless | membrane vs mechanical; layouts; wireless types |
| 23 | `mouse` | Тышқан / Мышь / Mouse | Moves the cursor on screen. | Optical sensor, DPI, polling rate, wired/wireless, weight. | ◐ shell, buttons, sensor PCB, battery | `usb_a` / wireless receiver | DPI; optical sensor; wireless receiver |
| 24 | `graphics_tablet` | Графикалық планшет / Графический планшет / Graphics tablet | A board and pen for drawing on the computer. | EMR pen, pressure levels, active area, screen vs screenless. | — | `usb_c` | pressure levels; who uses it |
| 25 | `gamepad` | Геймпад / Геймпад / Gamepad | A controller for playing games. | Analog sticks, triggers, vibration, XInput, Bluetooth/2.4 GHz. | ◐ shell, PCB, vibration motors, battery | `usb_c` / Bluetooth | analog vs digital input; wireless |
| 26 | `microphone` | Микрофон / Микрофон / Microphone | Turns your voice into a signal for the computer. | Dynamic vs condenser, polar patterns, USB vs XLR, sample rate. | ◐ grille, capsule, body | `usb_c` / `xlr` / `audio_35` | condenser vs dynamic; analog vs digital (USB) |
| 27 | `webcam` | Веб-камера / Веб-камера / Webcam | A camera for video calls and lessons. | Resolution, fps, field of view, privacy shutter, built-in mic. | ◐ shell, lens, sensor PCB | `usb_a` / `usb_c` | resolution and fps; privacy |
| 28 | `scanner` | Сканер / Сканер / Scanner | Copies paper documents into the computer. | Flatbed CIS/CCD, DPI, OCR, ADF. | ◐ lid, glass, scanning head | `usb_b` | DPI; OCR; scanner vs camera |

## 4. Output devices (7), zones `peripherals` / `print_media`

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Zone | Quiz |
|---|---|---|---|---|---|---|---|---|
| 29 | `monitor` | Монитор / Монитор / Monitor | The screen that shows the picture. | Diagonal, resolution, refresh rate (Hz), panel IPS/VA/OLED, response time, HDR, inputs. | ◐ stand, back cover, panel, power board | `hdmi`, `displayport`, `usb_c`, `iec_c14` / `dc_in`, `audio_35` | `peripherals` | resolution; Hz; panel types; HDMI vs DP |
| 30 | `printer_laser` | Лазерлік принтер / Лазерный принтер / Laser printer | Prints pages quickly using toner powder. | Drum, toner, fuser, ppm, duplex, Wi-Fi/Ethernet. | ✅ covers, toner cartridge, drum, fuser, paper tray | `usb_b`, `rj45`, `iec_c14` | `print_media` | laser vs inkjet; toner; cost per page |
| 31 | `printer_inkjet` | Сиялы принтер / Струйный принтер / Inkjet printer | Prints with tiny drops of ink and is good for photos. | Print head, cartridges or ink tank, dpi, colour CMYK. | ◐ lid, cartridges, print head carriage | `usb_b`, Wi-Fi, `dc_in` | `print_media` | CMYK; ink tank vs cartridge; photo printing |
| 32 | `projector` | Проектор / Проектор / Projector | Shows the picture big on a wall or screen. | DLP/LCD, lumens, native resolution, throw ratio, keystone. | ◐ case, lamp/LED, lens | `hdmi`, `usb_a`, `iec_c14` | `print_media` | lumens; throw distance; school use |
| 33 | `speakers` | Колонкалар / Колонки / Speakers | Play sound out loud. | 2.0/2.1, watts RMS, frequency range, active vs passive, Bluetooth. | ◐ grille, driver, enclosure | `audio_35`, `usb_a`, Bluetooth | `peripherals` | active vs passive; 2.0 vs 2.1; jack colours |
| 34 | `headset` | Құлаққап (гарнитура) / Наушники (гарнитура) / Headphones / headset | Lets you hear sound privately and speak into a mic. | Closed/open, drivers, impedance, mic, 3.5 mm TRRS/USB/2.4 GHz. | ◐ ear cups, drivers, headband | `audio_35` (TRRS), `usb_a` / `usb_c` | `peripherals` | headphones vs headset; TRRS vs TRS; wireless |
| 35 | `interactive_panel` | Интерактивті тақта / Интерактивная панель / Interactive display | A big touch screen for the classroom. | Touch panel (IR/capacitive), built-in Android, OPS PC slot, HDMI in, casting. | ◐ frame, display, OPS module | `hdmi`, `usb_a`, `usb_c`, `rj45` | `print_media` | touch technologies; how a teacher connects a laptop |

## 5. Networking (9), zone `network`

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Quiz |
|---|---|---|---|---|---|---|---|
| 36 | `router` | Маршрутизатор (роутер) / Маршрутизатор / Router | Shares the internet with home devices over Wi-Fi and cables. | Routing, NAT, DHCP, Wi-Fi 5/6/7 (2.4/5/6 GHz), WAN/LAN ports, firewall, WPA2/WPA3. | ◐ case, PCB, antennas | `rj45` (WAN + LAN ×4), `dc_in`, `usb_a` | WAN vs LAN; DHCP; Wi-Fi bands; WPA3 and password safety (V2-6) |
| 37 | `switch` | Коммутатор (свитч) / Коммутатор / Network switch | Connects many computers with cables. | Layer 2, MAC table, 1/2.5/10 Gb/s ports, unmanaged vs managed, PoE. | ◐ case, PCB | `rj45` ×8–24, `dc_in` / `iec_c14` | switch vs router; MAC address; PoE |
| 38 | `modem` | Модем (ONT) / Модем (ONT) / Modem (ONT) | Connects the home to the provider's internet line. | DSL/cable/fibre ONT, converts the provider's signal to Ethernet, often combined with a router. | — | `rj45`, `sc_fiber` / `rj11`, `dc_in` | modem vs router; fibre (GPON) |
| 39 | `wifi_adapter` | Wi-Fi адаптері / Wi-Fi адаптер / Wi-Fi adapter | Lets a computer connect to Wi-Fi. | USB or PCIe card, Wi-Fi 6/6E, antennas, Bluetooth combo. | — | `usb_a` / `pcie_x1` | when you need it; bands; antennas |
| 40 | `nic` | Желі картасы / Сетевая карта / Network card (NIC) | Gives the computer an Ethernet cable port. | PCIe NIC, 1/2.5/10 GbE, built-in on motherboards, MAC address. | — | `pcie_x1`, `rj45` | MAC address; speed; built-in vs add-in |
| 41 | `ethernet_cable` | Ethernet кабелі (RJ-45) / Ethernet-кабель / Ethernet cable | A network cable for wired connections. | Twisted pair Cat5e/6/6a, RJ-45, T568B, up to 100 m, straight vs crossover. | ◐ jacket, 4 twisted pairs, RJ-45 plug | `rj45` (both ends) | Cat categories; 100 m limit; wired vs Wi-Fi |
| 42 | `access_point` | Wi-Fi кіру нүктесі / Точка доступа / Access point | Spreads Wi-Fi across a big room or school. | Ceiling AP, PoE powered, controller, roaming, SSIDs/VLAN. | — | `rj45` (PoE) | AP vs router; PoE; school Wi-Fi |
| 43 | `nas` | Желілік сақтау (NAS) / Сетевое хранилище (NAS) / NAS | A shared drive for the whole network. | Bays with HDDs, RAID 1/5, SMB, backups, Ethernet. | ◐ case, drive bays, HDDs | `rj45`, `usb_a`, `dc_in` | RAID idea; backups; shared folders |
| 44 | `server_rack` | Серверлік шкаф / Серверная стойка / Server rack | A cabinet that holds network equipment. | 19″ rack units (U), patch panel, switches, cable management, cooling. | ◐ door, rails, patch panel | — | what 1U means; patch panel; cooling |

## 6. Mobile and other devices (11), zones `mobile` / `print_media` / `power`

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Zone | Quiz |
|---|---|---|---|---|---|---|---|---|
| 45 | `laptop` | Ноутбук / Ноутбук / Laptop | A portable computer with a built-in screen and keyboard. | Integrated parts: SoC/CPU, soldered/SO-DIMM RAM, M.2, battery, cooling, Thunderbolt/USB-C. | ✅ bottom cover, battery, SO-DIMM RAM, M.2 SSD, cooler + heat pipe, Wi-Fi card, motherboard, keyboard, display | `usb_c`, `usb_a`, `hdmi`, `audio_35`, `rj45` (some), `dc_in` | `mobile` | laptop vs desktop; what can be upgraded; battery care |
| 46 | `all_in_one` | Моноблок / Моноблок / All-in-one PC | A computer hidden behind its screen. | Laptop-like parts behind the panel, external PSU or internal, VESA. | ✅ back cover, motherboard, RAM, storage, cooler, speakers, display panel | `usb_a`, `usb_c`, `hdmi` (in/out), `rj45`, `dc_in`, `audio_35` | `mobile` | AIO vs tower; upgradability; where the PC is |
| 47 | `smartphone` | Смартфон / Смартфон / Smartphone | A pocket computer and phone. | SoC (CPU+GPU+NPU), LPDDR, UFS storage, battery, cameras, 5G/Wi-Fi/Bluetooth/NFC. | ✅ back glass, battery, mainboard (SoC), camera module, speaker, display, frame | `usb_c`, `sim_tray` | SoC; why batteries swell; what NFC is |
| 48 | `tablet` | Планшет / Планшет / Tablet | A large touch screen that works like a phone. | SoC, battery, display, stylus support, keyboard covers. | ✅ display, battery cells, logic board, cameras, frame | `usb_c` | tablet vs laptop; stylus |
| 49 | `smartwatch` | Смарт-сағат / Смарт-часы / Smartwatch | A watch that counts steps and shows messages. | Sensors (PPG pulse, accelerometer, GPS), Bluetooth pairing, battery. | ◐ strap, case, sensor back | `magnetic_charger` | sensors; pairing with a phone |
| 50 | `printer_3d` | 3D-принтер / 3D-принтер / 3D printer | Makes real objects layer by layer from plastic. | FDM: hotend, extruder, heated bed, X/Y/Z axes, PLA/PETG, slicer, G-code. | ✅ frame, Z axis, X gantry, hotend + extruder, heated bed, control board, PSU, spool | `usb_c` / `sd_slot`, `iec_c14` | layers; slicer; nozzle temperature; safety |
| 51 | `ups` | Үздіксіз қоректендіру көзі (UPS) / ИБП / UPS | A battery that keeps the computer on during a power cut. | Line-interactive/online, VA/W, battery runtime, AVR, USB shutdown. | ◐ case, battery, inverter board | `iec_c13` (outputs), `iec_c14` (input), `usb_b` | VA vs W; why servers need it; safe shutdown |
| 52 | `docking_station` | Док-станция / Док-станция / Docking station | One cable connects a laptop to many devices. | USB-C/Thunderbolt dock, DisplayPort Alt Mode, PD charging, Ethernet. | — | `usb_c` (host), `usb_a`, `hdmi`, `displayport`, `rj45`, `audio_35`, `dc_in` | `power` | Alt Mode; Power Delivery; one cable desk |
| 53 | `usb_hub` | USB-хаб / USB-хаб / USB hub | Turns one USB port into several. | Bus-powered vs self-powered, USB 2.0/3.x bandwidth sharing. | — | `usb_a` ×4, `usb_c` (upstream) | `power` | shared bandwidth; powered hubs |
| 54 | `card_reader` | Карт-ридер / Картридер / Card reader | Reads memory cards on a computer. | SD/microSD/CF slots, UHS-I/II, USB 3.x. | — | `sd_slot`, `usb_a` / `usb_c` | `power` | card types; speed |
| 55 | `sbc` | Бір платалы компьютер (Raspberry Pi) / Одноплатный компьютер / Single-board computer | A whole tiny computer on one small board. | ARM SoC, GPIO, microSD boot, HDMI, USB, Ethernet; programming and IoT. | ◐ case, board | `usb_c` (power), `hdmi_micro`, `usb_a`, `rj45`, `gpio`, `sd_slot` | `mobile` | GPIO; what SoC means; uses in school projects |

## 7. Cables and connectors (5), zone `power` (V2-6)

| # | id | kk / ru / en | Student | Adult | Teardown | Ports | Quiz |
|---|---|---|---|---|---|---|---|
| 56 | `hdmi_cable` | HDMI кабелі / Кабель HDMI / HDMI cable | Carries picture and sound to a monitor or TV. | HDMI 1.4/2.0/2.1, bandwidth, ARC/eARC, connector types A/C/D. | — | `hdmi` | HDMI vs DP; what it carries; versions |
| 57 | `displayport_cable` | DisplayPort кабелі / Кабель DisplayPort / DisplayPort cable | A cable for high-refresh monitors. | DP 1.4/2.1, latch, MST daisy-chain, USB-C Alt Mode. | — | `displayport` | when to use DP; latch; Alt Mode |
| 58 | `usb_c_cable` | USB-C кабелі / Кабель USB-C / USB-C cable | A reversible cable for charging and data. | USB 2.0/3.2/USB4, PD up to 240 W, e-marker, Thunderbolt. | — | `usb_c` | reversibility; not every USB-C cable is fast; PD |
| 59 | `usb_a_cable` | USB-A / USB-B кабелі / Кабель USB-A / USB-B / USB-A / USB-B cable | A cable for printers, keyboards and other older devices. | USB-A host, USB-B device (printers), micro-B; speeds 2.0/3.x (blue tab). | — | `usb_a`, `usb_b` | which end goes where; colour of USB 3 ports |
| 60 | `audio_cable` | 3,5 мм аудио кабель / Аудиокабель 3,5 мм / 3.5 mm audio cable | Connects speakers and headphones. | TRS vs TRRS, jack colours (green out, pink mic, blue line-in). | — | `audio_35` | jack colours; TRS vs TRRS; headset splitter |

Power cable (IEC C13/C14) is modelled as part of `internal_cables` / `psu` and appears in V2-6 together with `ups`.

---

## Port types (marker names `port_<type>_<n>`)

These are the shared keys for V2-6 (cables) and for the Blender pipeline (`ports[].type`).

| Type | kk / ru / en | Group |
|---|---|---|
| `hdmi`, `hdmi_micro` | HDMI | Video |
| `displayport` | DisplayPort | Video |
| `usb_a`, `usb_b`, `usb_c`, `usb_micro_b` | USB-A / USB-B / USB-C / micro-USB | USB |
| `usb_internal` | Ішкі USB тақтасы / Внутренний USB-разъём / Internal USB header | Internal |
| `audio_35` | 3,5 мм аудио ұяшық / Аудиоразъём 3,5 мм / 3.5 mm audio jack | Audio |
| `xlr` | XLR | Audio |
| `rj45`, `rj11`, `sc_fiber` | RJ-45 Ethernet, RJ-11, оптика SC / SC fibre | Network |
| `iec_c13`, `iec_c14`, `dc_in`, `magnetic_charger` | Қуат / Питание / Power | Power |
| `atx_24pin`, `eps_8pin`, `pcie_8pin`, `sata_power` | ATX 24-pin, EPS 8-pin, PCIe 8-pin, SATA қуаты / питание / power | PSU cables |
| `sata_data`, `m2`, `dimm`, `pcie_x16`, `pcie_x1`, `cpu_socket` | Слоттар / Слоты / Slots | Motherboard |
| `fan_4pin`, `pump_3pin` | Желдеткіш / Вентилятор / Fan header | Cooling |
| `sd_slot`, `sim_tray`, `gpio` | SD ұяшығы, SIM науасы, GPIO / Слот SD, лоток SIM, GPIO / SD slot, SIM tray, GPIO | Other |
| `power_button` | Қосу батырмасы / Кнопка питания / Power button | Front panel |

## Count

| Category | Devices | Full teardown (✅) | Simple (◐) |
|---|---|---|---|
| PC internals | 12 | 7 | 2 |
| Storage | 9 | 1 | 6 |
| Input | 7 | 1 | 5 |
| Output | 7 | 1 | 6 |
| Networking | 9 | 0 | 5 |
| Mobile and other | 11 | 5 | 3 |
| Cables | 5 | 0 | 0 |
| **Total** | **60** | **15** | **27** |

PLAN_V2 §1.3 requires full teardown animations for the system unit (`case` with internals), `laptop`, `all_in_one`, `smartphone`, `tablet` and `printer_3d`. They are in the table above; V2-5a/b do them first.
