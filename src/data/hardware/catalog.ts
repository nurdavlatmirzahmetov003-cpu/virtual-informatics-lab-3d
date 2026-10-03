/**
 * Setup Studio catalog — current retail models, specifications checked on
 * 2026-10-03 against the manufacturer page in `specSourceUrl` (retail
 * listings where the maker publishes no spec page). Only figures that were
 * confirmed are stored; compatibility values drive lib/studio.
 *
 * PRICES: no live Kazakhstan store price could be verified for this build,
 * so every price is an illustrative "Demo price" (priceSource.kind = 'demo').
 */
import type { HardwareCategory, HardwareItem } from './types';

const CHECKED = '2026-10-03';
const DEMO = { priceUpdatedAt: CHECKED, priceSource: { kind: 'demo' }, specCheckedAt: CHECKED } as const;
const M = (file: string) => `hardware/${file}.glb`;

type Draft = Omit<HardwareItem, 'priceUpdatedAt' | 'priceSource' | 'specCheckedAt'>;
const item = (d: Draft): HardwareItem => ({ ...DEMO, ...d });

export const CATALOG: readonly HardwareItem[] = [
  // ───────────── Monitors ─────────────
  item({
    id: 'mon-asus-va24ehf', category: 'monitor', brand: 'ASUS', model: 'VA24EHF',
    priceKZT: 55_000, modelPath: M('monitor_ultrawide'), modelSize: 0.54, colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'programming', 'universal'],
    specSourceUrl: 'https://www.asus.com/displays-desktops/monitors/eye-care/va24ehf/techspec/',
    specifications: [
      { key: 'diagonal', value: 23.8, unit: 'inch' },
      { key: 'resolution', value: '1920 × 1080' },
      { key: 'refresh', value: 100, unit: 'hz' },
      { key: 'panel', value: 'IPS' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mon-dell-u2724d', category: 'monitor', brand: 'Dell', model: 'UltraSharp U2724D',
    priceKZT: 230_000, modelPath: M('monitor_ultrawide'), modelSize: 0.61, colors: ['black', 'silver'],
    performanceTier: 'performance', recommendedUse: ['programming', 'design3d', 'study'],
    specSourceUrl: 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-monitor-u2724d/apd/210-bkst/monitors-monitor-accessories',
    specifications: [
      { key: 'diagonal', value: 27, unit: 'inch' },
      { key: 'resolution', value: '2560 × 1440' },
      { key: 'refresh', value: 120, unit: 'hz' },
      { key: 'panel', value: 'IPS Black, 98% DCI-P3' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mon-asus-xg27acs', category: 'monitor', brand: 'ASUS', model: 'ROG Strix XG27ACS',
    priceKZT: 150_000, modelPath: M('monitor_ultrawide'), modelSize: 0.61, colors: ['black'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://rog.asus.com/monitors/27-to-31-5-inches/rog-strix-xg27acs/spec/',
    specifications: [
      { key: 'diagonal', value: 27, unit: 'inch' },
      { key: 'resolution', value: '2560 × 1440' },
      { key: 'refresh', value: 180, unit: 'hz' },
      { key: 'panel', value: 'Fast IPS, 1 ms GtG' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mon-lg-27gr93u', category: 'monitor', brand: 'LG', model: 'UltraGear 27GR93U',
    priceKZT: 280_000, modelPath: M('monitor_ultrawide'), modelSize: 0.61, colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'design3d', 'streaming'],
    specSourceUrl: 'https://www.lg.com/us/monitors/lg-27gr93u-b-gaming-monitor',
    specifications: [
      { key: 'diagonal', value: 27, unit: 'inch' },
      { key: 'resolution', value: '3840 × 2160 (4K)' },
      { key: 'refresh', value: 144, unit: 'hz' },
      { key: 'panel', value: 'IPS, HDR400' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mon-lg-34gp83a', category: 'monitor', brand: 'LG', model: 'UltraGear 34GP83A-B',
    priceKZT: 260_000, modelPath: M('monitor_ultrawide'), modelSize: 0.81, colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'programming', 'streaming'],
    specSourceUrl: 'https://www.lg.com/us/monitors/lg-34gp83a-b-gaming-monitor',
    specifications: [
      { key: 'diagonal', value: 34, unit: 'inch' },
      { key: 'resolution', value: '3440 × 1440 (21:9)' },
      { key: 'refresh', value: 160, unit: 'hz' },
      { key: 'panel', value: 'Nano IPS, curved' },
    ],
    compatibility: {},
  }),

  item({
    id: 'mon-asus-xg27aqmr', category: 'monitor', brand: 'ASUS', model: 'ROG Strix XG27AQMR',
    priceKZT: 250_000, modelPath: M('monitor_ultrawide'), modelSize: 0.6148, colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://rog.asus.com/us/monitors/27-to-31-5-inches/rog-strix-xg27aqmr/spec/',
    specifications: [
      { key: 'diagonal', value: 27, unit: 'inch' },
      { key: 'resolution', value: '2560 × 1440' },
      { key: 'refresh', value: 300, unit: 'hz' },
      { key: 'panel', value: 'Fast IPS, 1 ms GtG, DisplayHDR 600' },
    ],
    compatibility: {},
  }),
  // ───────────── Keyboards ─────────────
  item({
    id: 'kb-logitech-k120', category: 'keyboard', brand: 'Logitech', model: 'K120',
    priceKZT: 5_000, modelPath: M('keyboard_mech'), modelSize: 0.45, colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'universal'],
    specSourceUrl: 'https://www.logitech.com/en-us/products/keyboards/k120-usb-standard-computer.html',
    specifications: [
      { key: 'layout', value: 'full', translate: true },
      { key: 'switches', value: 'membrane', translate: true },
      { key: 'connection', value: 'usb', translate: true },
      { key: 'weight', value: 550, unit: 'g' },
    ],
    compatibility: {},
  }),
  item({
    id: 'kb-logitech-mx-keys-s', category: 'keyboard', brand: 'Logitech', model: 'MX Keys S',
    priceKZT: 55_000, modelPath: M('keyboard_mech'), modelSize: 0.43, colors: ['graphite', 'grey', 'black'],
    performanceTier: 'performance', recommendedUse: ['programming', 'study', 'design3d'],
    specSourceUrl: 'https://www.logitech.com/en-us/products/keyboards/mx-keys-s.html',
    specifications: [
      { key: 'layout', value: 'full', translate: true },
      { key: 'switches', value: 'scissor', translate: true },
      { key: 'connection', value: 'boltBt', translate: true },
      { key: 'weight', value: 810, unit: 'g' },
    ],
    compatibility: {},
  }),
  item({
    id: 'kb-keychron-k8-pro', category: 'keyboard', brand: 'Keychron', model: 'K8 Pro',
    priceKZT: 50_000, modelPath: M('keyboard_mech'), modelSize: 0.359, colors: ['black', 'grey'], rgb: true,
    performanceTier: 'mainstream', recommendedUse: ['programming', 'universal', 'study'],
    specSourceUrl: 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard',
    specifications: [
      { key: 'layout', value: 'tkl', translate: true },
      { key: 'switches', value: 'Gateron G Pro (hot-swap)' },
      { key: 'connection', value: 'btWired', translate: true },
      { key: 'battery', value: 290, unit: 'h' },
    ],
    compatibility: {},
  }),
  item({
    id: 'kb-logitech-pro-x-tkl', category: 'keyboard', brand: 'Logitech G', model: 'PRO X TKL LIGHTSPEED',
    priceKZT: 95_000, modelPath: M('keyboard_mech'), modelSize: 0.36, colors: ['black', 'white'], rgb: true,
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://www.logitechg.com/en-us/products/gaming-keyboards/pro-x-tkl-wireless-keyboard.html',
    specifications: [
      { key: 'layout', value: 'tkl', translate: true },
      { key: 'switches', value: 'GX (hot-swap)' },
      { key: 'connection', value: 'lightspeedBt', translate: true },
      { key: 'battery', value: 50, unit: 'h' },
    ],
    compatibility: {},
  }),
  item({
    id: 'kb-razer-huntsman-v3-pro-tkl', category: 'keyboard', brand: 'Razer', model: 'Huntsman V3 Pro TKL',
    priceKZT: 110_000, modelPath: M('keyboard_mech'), modelSize: 0.36, colors: ['black', 'white'], rgb: true,
    performanceTier: 'enthusiast', recommendedUse: ['gaming'],
    specSourceUrl: 'https://www.razer.com/gaming-keyboards/razer-huntsman-v3-pro-tkl',
    specifications: [
      { key: 'layout', value: 'tkl', translate: true },
      { key: 'switches', value: 'Analog Optical Gen-2 (0.1–4.0 mm)' },
      { key: 'connection', value: 'usb', translate: true },
      { key: 'pollingRate', value: 8000, unit: 'hz' },
    ],
    compatibility: {},
  }),

  // ───────────── Mice ─────────────
  item({
    id: 'mouse-logitech-g102', category: 'mouse', brand: 'Logitech G', model: 'G102 LIGHTSYNC',
    priceKZT: 10_000, modelPath: M('mouse_gaming'), modelSize: 0.117, colors: ['black', 'white'], rgb: true,
    performanceTier: 'entry', recommendedUse: ['study', 'gaming', 'universal'],
    specSourceUrl: 'https://www.logitechg.com/en-us/products/gaming-mice/g203-lightsync-rgb-6-button-gaming-mouse.html',
    specifications: [
      { key: 'weight', value: 85, unit: 'g' },
      { key: 'dpi', value: '200–8 000', unit: 'dpi' },
      { key: 'connection', value: 'usb', translate: true },
      { key: 'pollingRate', value: 1000, unit: 'hz' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mouse-logitech-g305', category: 'mouse', brand: 'Logitech G', model: 'G305 LIGHTSPEED',
    priceKZT: 16_000, modelPath: M('mouse_gaming'), modelSize: 0.117, colors: ['black', 'white'],
    performanceTier: 'entry', recommendedUse: ['study', 'programming', 'universal', 'gaming'],
    specSourceUrl: 'https://www.logitechg.com/en-us/products/gaming-mice/g305-lightspeed-wireless-gaming-mouse.html',
    specifications: [
      { key: 'weight', value: 99, unit: 'g' },
      { key: 'dpi', value: '200–12 000', unit: 'dpi' },
      { key: 'connection', value: 'lightspeed', translate: true },
      { key: 'battery', value: 250, unit: 'h' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mouse-logitech-g502x-plus', category: 'mouse', brand: 'Logitech G', model: 'G502 X PLUS',
    priceKZT: 65_000, modelPath: M('mouse_gaming'), modelSize: 0.131, colors: ['black', 'white'], rgb: true,
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'design3d'],
    specSourceUrl: 'https://www.logitechg.com/en-us/products/gaming-mice/g502-x-plus-wireless-lightforce.html',
    specifications: [
      { key: 'weight', value: 106, unit: 'g' },
      { key: 'sensor', value: 'HERO 25K' },
      { key: 'dpi', value: '100–25 600', unit: 'dpi' },
      { key: 'connection', value: 'lightspeed', translate: true },
    ],
    compatibility: {},
  }),
  item({
    id: 'mouse-logitech-superlight2', category: 'mouse', brand: 'Logitech G', model: 'PRO X SUPERLIGHT 2',
    priceKZT: 70_000, modelPath: M('mouse_gaming'), modelSize: 0.125, colors: ['black', 'white'],
    performanceTier: 'enthusiast', recommendedUse: ['gaming'],
    specSourceUrl: 'https://www.logitechg.com/en-us/products/gaming-mice/pro-x2-superlight-wireless-mouse.html',
    specifications: [
      { key: 'weight', value: 60, unit: 'g' },
      { key: 'sensor', value: 'HERO 2' },
      { key: 'dpi', value: '100–32 000', unit: 'dpi' },
      { key: 'pollingRate', value: 2000, unit: 'hz' },
    ],
    compatibility: {},
  }),
  item({
    id: 'mouse-razer-viper-v3-pro', category: 'mouse', brand: 'Razer', model: 'Viper V3 Pro',
    priceKZT: 80_000, modelPath: M('mouse_gaming'), modelSize: 0.127, colors: ['black', 'white'],
    performanceTier: 'enthusiast', recommendedUse: ['gaming'],
    specSourceUrl: 'https://www.razer.com/gaming-mice/razer-viper-v3-pro',
    specifications: [
      { key: 'weight', value: 54, unit: 'g' },
      { key: 'sensor', value: 'Focus Pro 35K Gen-2' },
      { key: 'dpi', value: '35 000', unit: 'dpi' },
      { key: 'pollingRate', value: 8000, unit: 'hz' },
    ],
    compatibility: {},
  }),

  // ───────────── Headsets ─────────────
  item({
    id: 'hs-hyperx-cloud-iii', category: 'headset', brand: 'HyperX', model: 'Cloud III',
    priceKZT: 45_000, modelPath: M('headset_gaming'), modelSize: 0.2, colors: ['black'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'study', 'universal'],
    specSourceUrl: 'https://hyperx.com/products/hyperx-cloud-iii-gaming-headset',
    specifications: [
      { key: 'driver', value: 53, unit: 'mm' },
      { key: 'connection', value: 'jackUsb', translate: true },
      { key: 'freq', value: '10 Hz – 21 kHz' },
    ],
    compatibility: {},
  }),
  item({
    id: 'hs-steelseries-nova7', category: 'headset', brand: 'SteelSeries', model: 'Arctis Nova 7 Wireless',
    priceKZT: 85_000, modelPath: M('headset_gaming'), modelSize: 0.2, colors: ['black', 'white'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://steelseries.com/gaming-headsets/arctis-nova-7',
    specifications: [
      { key: 'driver', value: 40, unit: 'mm' },
      { key: 'connection', value: 'dongleBt', translate: true },
      { key: 'battery', value: 38, unit: 'h' },
    ],
    compatibility: {},
  }),
  item({
    id: 'hs-razer-blackshark-v2-pro', category: 'headset', brand: 'Razer', model: 'BlackShark V2 Pro (2023)',
    priceKZT: 95_000, modelPath: M('headset_gaming'), modelSize: 0.2, colors: ['black', 'white'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://www.razer.com/gaming-headsets/razer-blackshark-v2-pro',
    specifications: [
      { key: 'driver', value: 50, unit: 'mm' },
      { key: 'connection', value: 'dongleBt', translate: true },
      { key: 'battery', value: 70, unit: 'h' },
    ],
    compatibility: {},
  }),
  item({
    id: 'hs-logitech-pro-x2', category: 'headset', brand: 'Logitech G', model: 'PRO X 2 LIGHTSPEED',
    priceKZT: 120_000, modelPath: M('headset_gaming'), modelSize: 0.19, colors: ['black', 'white'],
    performanceTier: 'enthusiast', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://www.logitechg.com/en-us/products/gaming-audio/pro-x-2-wireless-headset.html',
    specifications: [
      { key: 'driver', value: '50 mm graphene' },
      { key: 'connection', value: 'lightspeedBtJack', translate: true },
      { key: 'battery', value: 50, unit: 'h' },
      { key: 'weight', value: 345, unit: 'g' },
    ],
    compatibility: {},
  }),

  // ───────────── Speakers ─────────────
  item({
    id: 'spk-creative-pebble-v3', category: 'speakers', brand: 'Creative', model: 'Pebble V3',
    priceKZT: 20_000, modelPath: M('speaker_left'), modelSize: 0.118, colors: ['black', 'white'],
    performanceTier: 'entry', recommendedUse: ['study', 'programming', 'universal'],
    specSourceUrl: 'https://uk.creative.com/p/speakers/creative-pebble-v3',
    specifications: [
      { key: 'system', value: '2.0' },
      { key: 'power', value: '8 W RMS (16 W peak)' },
      { key: 'connection', value: 'USB-C, Bluetooth 5.0, AUX' },
    ],
    compatibility: {},
  }),
  item({
    id: 'spk-logitech-z407', category: 'speakers', brand: 'Logitech', model: 'Z407',
    priceKZT: 45_000, modelPath: M('speaker_left'), modelSize: 0.2, colors: ['graphite'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'universal', 'streaming'],
    specSourceUrl: 'https://www.logitech.com/en-us/products/speakers/z407-bluetooth-computer-speakers.html',
    specifications: [
      { key: 'system', value: '2.1' },
      { key: 'power', value: '40 W RMS (80 W peak)' },
      { key: 'connection', value: 'Bluetooth 5.0, 3.5 mm, Micro-USB' },
    ],
    compatibility: {},
  }),
  item({
    id: 'spk-edifier-r1280db', category: 'speakers', brand: 'Edifier', model: 'R1280DB',
    priceKZT: 60_000, modelPath: M('speaker_left'), modelSize: 0.24, colors: ['wood', 'black'],
    performanceTier: 'performance', recommendedUse: ['design3d', 'streaming', 'universal'],
    specSourceUrl: 'https://www.edifier.com/us-en/p/bookshelf-speakers/r1280db',
    specifications: [
      { key: 'system', value: '2.0' },
      { key: 'power', value: 42, unit: 'w' },
      { key: 'connection', value: 'Bluetooth, RCA, optical, coaxial' },
    ],
    compatibility: {},
  }),

  // ───────────── Desks ─────────────
  item({
    id: 'desk-ikea-uppspel', category: 'desk', brand: 'IKEA', model: 'UPPSPEL 180 × 80',
    priceKZT: 180_000, modelPath: 'procedural:desk', modelSize: 1.8, colors: ['black'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://www.ikea.com/us/en/p/uppspel-gaming-desk-black-s39407273/',
    specifications: [
      { key: 'size', value: '180 × 80', unit: 'cm' },
      { key: 'heightRange', value: '72–120', unit: 'cm' },
      { key: 'adjust', value: 'electric', translate: true },
    ],
    compatibility: {},
  }),
  item({
    id: 'desk-flexispot-e7', category: 'desk', brand: 'FlexiSpot', model: 'E7',
    priceKZT: 200_000, modelPath: 'procedural:desk', modelSize: 1.6, colors: ['black', 'white', 'wood'],
    performanceTier: 'performance', recommendedUse: ['programming', 'design3d', 'study', 'universal'],
    specSourceUrl: 'https://www.flexispot.com/standing-desks/e7',
    specifications: [
      { key: 'heightRange', value: '58–123', unit: 'cm' },
      { key: 'maxLoad', value: 125, unit: 'kg' },
      { key: 'adjust', value: 'electricDual', translate: true },
    ],
    compatibility: {},
  }),
  item({
    id: 'desk-secretlab-magnus-pro', category: 'desk', brand: 'Secretlab', model: 'MAGNUS Pro',
    priceKZT: 350_000, modelPath: 'procedural:desk', modelSize: 1.5, colors: ['black', 'white'],
    performanceTier: 'enthusiast', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://secretlab.co/products/magnus-pro',
    specifications: [
      { key: 'size', value: '150 × 70', unit: 'cm' },
      { key: 'heightRange', value: '65–125', unit: 'cm' },
      { key: 'maxLoad', value: 120, unit: 'kg' },
    ],
    compatibility: {},
  }),

  // ───────────── Chairs ─────────────
  item({
    id: 'chair-ikea-markus', category: 'chair', brand: 'IKEA', model: 'MARKUS',
    priceKZT: 75_000, modelPath: 'procedural:chair', modelSize: 1.3, colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'programming', 'universal'],
    specSourceUrl: 'https://www.ikea.com/us/en/p/markus-office-chair-vissle-dark-gray-90289172/',
    specifications: [
      { key: 'maxLoad', value: 110, unit: 'kg' },
      { key: 'seatHeight', value: '46–57', unit: 'cm' },
      { key: 'feature', value: 'meshBack', translate: true },
    ],
    compatibility: {},
  }),
  item({
    id: 'chair-secretlab-titan-evo', category: 'chair', brand: 'Secretlab', model: 'TITAN Evo (Regular)',
    priceKZT: 260_000, modelPath: 'procedural:chair', modelSize: 1.35, colors: ['black', 'white'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://secretlab.co/products/titan-evo-2022-series',
    specifications: [
      { key: 'maxLoad', value: 130, unit: 'kg' },
      { key: 'seatHeight', value: '45–52', unit: 'cm' },
      { key: 'feature', value: 'lumbar4', translate: true },
    ],
    compatibility: {},
  }),
  item({
    id: 'chair-hm-embody-gaming', category: 'chair', brand: 'Herman Miller × Logitech G', model: 'Embody Gaming Chair',
    priceKZT: 900_000, modelPath: 'procedural:chair', modelSize: 1.3, colors: ['black'],
    performanceTier: 'enthusiast', recommendedUse: ['programming', 'design3d', 'gaming'],
    specSourceUrl: 'https://store.hermanmiller.com/gaming-chairs/embody-gaming-chair/',
    specifications: [
      { key: 'maxLoad', value: 136, unit: 'kg' },
      { key: 'feature', value: 'backfit', translate: true },
      { key: 'warranty', value: 12, unit: 'year' },
    ],
    compatibility: {},
  }),

  // ───────────── Cases ─────────────
  item({
    id: 'case-deepcool-cc560-v2', category: 'case', brand: 'DeepCool', model: 'CC560 V2',
    priceKZT: 30_000, modelPath: M('chassis'), colors: ['black', 'white'], rgb: true,
    performanceTier: 'entry', recommendedUse: ['study', 'gaming', 'universal'],
    specSourceUrl: 'https://www.deepcool.com/products/Cases/CC560-V2/',
    specifications: [
      { key: 'boards', value: 'ATX / mATX / ITX' },
      { key: 'maxGpu', value: 370, unit: 'mm' },
      { key: 'maxCooler', value: 165, unit: 'mm' },
      { key: 'fans', value: '4 × 120 mm LED' },
    ],
    compatibility: { supportsFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 370, maxCoolerHeightMm: 165, maxRadiatorMm: 360 },
  }),
  item({
    id: 'case-corsair-4000d-airflow', category: 'case', brand: 'Corsair', model: '4000D AIRFLOW',
    priceKZT: 45_000, modelPath: M('chassis'), colors: ['black', 'white'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'programming', 'universal', 'streaming'],
    specSourceUrl: 'https://www.corsair.com/us/en/p/pc-cases/cc-9011200-ww/4000d-airflow-tempered-glass-mid-tower-atx-case-black-cc-9011200-ww',
    specifications: [
      { key: 'boards', value: 'E-ATX / ATX / mATX / ITX' },
      { key: 'maxGpu', value: 360, unit: 'mm' },
      { key: 'maxCooler', value: 170, unit: 'mm' },
      { key: 'fans', value: '2 × 120 mm' },
    ],
    compatibility: { supportsFormFactors: ['E-ATX', 'ATX', 'mATX', 'ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 170, maxRadiatorMm: 360 },
  }),
  item({
    id: 'case-nzxt-h5-flow-2024', category: 'case', brand: 'NZXT', model: 'H5 Flow (2024)',
    priceKZT: 45_000, modelPath: M('chassis'), colors: ['black', 'white'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://support.nzxt.com/hc/en-us/articles/40225168535451-H5-Flow-2024-Specs',
    specifications: [
      { key: 'boards', value: 'E-ATX / ATX / mATX / ITX' },
      { key: 'maxGpu', value: 410, unit: 'mm' },
      { key: 'maxCooler', value: 170, unit: 'mm' },
    ],
    compatibility: { supportsFormFactors: ['E-ATX', 'ATX', 'mATX', 'ITX'], maxGpuLengthMm: 410, maxCoolerHeightMm: 170, maxRadiatorMm: 360 },
  }),
  item({
    id: 'case-fractal-north', category: 'case', brand: 'Fractal Design', model: 'North',
    priceKZT: 70_000, modelPath: M('chassis'), colors: ['black', 'white', 'wood'],
    performanceTier: 'performance', recommendedUse: ['design3d', 'programming', 'universal'],
    specSourceUrl: 'https://www.fractal-design.com/products/cases/north/north/',
    specifications: [
      { key: 'boards', value: 'ATX / mATX / ITX' },
      { key: 'maxGpu', value: 355, unit: 'mm' },
      { key: 'maxCooler', value: 170, unit: 'mm' },
    ],
    compatibility: { supportsFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 355, maxCoolerHeightMm: 170, maxRadiatorMm: 360 },
  }),
  item({
    id: 'case-lianli-o11d-evo', category: 'case', brand: 'Lian Li', model: 'O11 Dynamic EVO',
    priceKZT: 75_000, modelPath: M('chassis'), colors: ['black', 'white', 'grey'],
    performanceTier: 'enthusiast', recommendedUse: ['gaming', 'streaming', 'design3d'],
    specSourceUrl: 'https://lian-li.com/product/o11-dynamic-evo/',
    specifications: [
      { key: 'boards', value: 'E-ATX / ATX / mATX / ITX' },
      { key: 'maxGpu', value: 426, unit: 'mm' },
      { key: 'maxCooler', value: 167, unit: 'mm' },
    ],
    compatibility: { supportsFormFactors: ['E-ATX', 'ATX', 'mATX', 'ITX'], maxGpuLengthMm: 426, maxCoolerHeightMm: 167, maxRadiatorMm: 420 },
  }),

  // ───────────── CPUs ─────────────
  item({
    id: 'cpu-amd-r5-8500g', category: 'cpu', brand: 'AMD', model: 'Ryzen 5 8500G',
    priceKZT: 75_000, modelPath: M('cpu_am4'), colors: ['silver'],
    performanceTier: 'entry', recommendedUse: ['study', 'programming', 'universal'],
    specSourceUrl: 'https://www.amd.com/en/products/processors/desktops/ryzen/8000-series/amd-ryzen-5-8500g.html',
    specifications: [
      { key: 'cores', value: '6 / 12' },
      { key: 'boost', value: 5.0, unit: 'ghz' },
      { key: 'tdp', value: 65, unit: 'w' },
      { key: 'igpu', value: 'Radeon 740M' },
    ],
    compatibility: { socket: 'AM5', integratedGraphics: true, tdpW: 65, peakPowerW: 88 },
  }),
  item({
    id: 'cpu-intel-i5-14400f', category: 'cpu', brand: 'Intel', model: 'Core i5-14400F',
    priceKZT: 85_000, modelPath: M('cpu_am4'), colors: ['silver'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'universal', 'programming'],
    specSourceUrl: 'https://www.intel.com/content/www/us/en/products/sku/236788/intel-core-i5-processor-14400f-20m-cache-up-to-4-70-ghz/specifications.html',
    specifications: [
      { key: 'cores', value: '10 (6P + 4E) / 16' },
      { key: 'boost', value: 4.7, unit: 'ghz' },
      { key: 'tdp', value: '65 / 148 W' },
      { key: 'igpu', value: 'none', translate: true },
    ],
    compatibility: { socket: 'LGA1700', integratedGraphics: false, tdpW: 65, peakPowerW: 148 },
  }),
  item({
    id: 'cpu-amd-r5-7600', category: 'cpu', brand: 'AMD', model: 'Ryzen 5 7600',
    priceKZT: 95_000, modelPath: M('cpu_am4'), colors: ['silver'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'programming', 'universal', 'study'],
    specSourceUrl: 'https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html',
    specifications: [
      { key: 'cores', value: '6 / 12' },
      { key: 'boost', value: 5.1, unit: 'ghz' },
      { key: 'tdp', value: 65, unit: 'w' },
      { key: 'igpu', value: 'Radeon Graphics' },
    ],
    compatibility: { socket: 'AM5', integratedGraphics: true, tdpW: 65, peakPowerW: 88 },
  }),
  item({
    id: 'cpu-intel-ultra7-265k', category: 'cpu', brand: 'Intel', model: 'Core Ultra 7 265K',
    priceKZT: 160_000, modelPath: M('cpu_am4'), colors: ['silver'],
    performanceTier: 'performance', recommendedUse: ['design3d', 'streaming', 'programming'],
    specSourceUrl: 'https://www.intel.com/content/www/us/en/products/sku/241060/intel-core-ultra-7-processor-265k-30m-cache-up-to-5-50-ghz/specifications.html',
    specifications: [
      { key: 'cores', value: '20 (8P + 12E) / 20' },
      { key: 'boost', value: 5.5, unit: 'ghz' },
      { key: 'tdp', value: '125 / 250 W' },
      { key: 'igpu', value: 'Intel Graphics' },
    ],
    compatibility: { socket: 'LGA1851', integratedGraphics: true, tdpW: 125, peakPowerW: 250 },
  }),
  item({
    id: 'cpu-amd-r7-7800x3d', category: 'cpu', brand: 'AMD', model: 'Ryzen 7 7800X3D',
    priceKZT: 220_000, modelPath: M('cpu_am4'), colors: ['silver'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html',
    specifications: [
      { key: 'cores', value: '8 / 16' },
      { key: 'boost', value: 5.0, unit: 'ghz' },
      { key: 'tdp', value: 120, unit: 'w' },
      { key: 'cache', value: '96 MB L3 (3D V-Cache)' },
    ],
    compatibility: { socket: 'AM5', integratedGraphics: true, tdpW: 120, peakPowerW: 162 },
  }),
  item({
    id: 'cpu-amd-r9-9950x', category: 'cpu', brand: 'AMD', model: 'Ryzen 9 9950X',
    priceKZT: 300_000, modelPath: M('cpu_am4'), colors: ['silver'],
    performanceTier: 'enthusiast', recommendedUse: ['design3d', 'streaming', 'programming'],
    specSourceUrl: 'https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html',
    specifications: [
      { key: 'cores', value: '16 / 32' },
      { key: 'boost', value: 5.7, unit: 'ghz' },
      { key: 'tdp', value: 170, unit: 'w' },
      { key: 'cache', value: '64 MB L3' },
    ],
    compatibility: { socket: 'AM5', integratedGraphics: true, tdpW: 170, peakPowerW: 230 },
  }),

  // ───────────── CPU cooling ─────────────
  item({
    id: 'cool-deepcool-ak400', category: 'cooling', brand: 'DeepCool', model: 'AK400',
    priceKZT: 18_000, modelPath: M('cooler_tower'), modelSize: 0.155, colors: ['black', 'white'],
    performanceTier: 'entry', recommendedUse: ['study', 'gaming', 'programming', 'universal'],
    specSourceUrl: 'https://www.deepcool.com/products/Cooling/cpuaircoolers/AK400-Performance-CPU-Cooler/2021/15222.shtml',
    specifications: [
      { key: 'coolerType', value: 'air', translate: true },
      { key: 'height', value: 155, unit: 'mm' },
      { key: 'capacity', value: 220, unit: 'w' },
      { key: 'sockets', value: 'AM5 / AM4 / LGA1700' },
    ],
    compatibility: { sockets: ['AM5', 'LGA1700'], coolerHeightMm: 155, coolingCapacityW: 220 },
  }),
  item({
    id: 'cool-thermalright-pa120se', category: 'cooling', brand: 'Thermalright', model: 'Peerless Assassin 120 SE',
    priceKZT: 20_000, modelPath: M('cooler_tower'), modelSize: 0.155, colors: ['black', 'white', 'silver'], rgb: true,
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://www.thermalright.com/product/peerless-assassin-120-se/',
    specifications: [
      { key: 'coolerType', value: 'airDual', translate: true },
      { key: 'height', value: 155, unit: 'mm' },
      { key: 'sockets', value: 'AM5 / AM4 / LGA1851 / LGA1700' },
    ],
    compatibility: { sockets: ['AM5', 'LGA1700', 'LGA1851'], coolerHeightMm: 155 },
  }),
  item({
    id: 'cool-nzxt-kraken-240', category: 'cooling', brand: 'NZXT', model: 'Kraken 240 (2024)',
    priceKZT: 70_000, modelPath: M('cooler_tower'), modelSize: 0.155, colors: ['black', 'white'], rgb: true,
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'design3d'],
    specSourceUrl: 'https://nzxt.com/product/kraken-240',
    specifications: [
      { key: 'coolerType', value: 'aio', translate: true },
      { key: 'radiator', value: 240, unit: 'mm' },
      { key: 'sockets', value: 'AM5 / AM4 / LGA1851 / LGA1700' },
    ],
    compatibility: { sockets: ['AM5', 'LGA1700', 'LGA1851'], radiatorMm: 240 },
  }),
  item({
    id: 'cool-noctua-nh-d15-g2', category: 'cooling', brand: 'Noctua', model: 'NH-D15 G2',
    priceKZT: 80_000, modelPath: M('cooler_tower'), modelSize: 0.168, colors: ['grey', 'black'],
    performanceTier: 'enthusiast', recommendedUse: ['design3d', 'streaming', 'programming'],
    specSourceUrl: 'https://www.noctua.at/en/products/nh-d15-g2/specifications',
    specifications: [
      { key: 'coolerType', value: 'airDual', translate: true },
      { key: 'height', value: 168, unit: 'mm' },
      { key: 'fans', value: '2 × 140 mm' },
      { key: 'sockets', value: 'AM5 / AM4 / LGA1851 / LGA1700' },
    ],
    compatibility: { sockets: ['AM5', 'LGA1700', 'LGA1851'], coolerHeightMm: 168 },
  }),

  // ───────────── Motherboards ─────────────
  item({
    id: 'mb-msi-pro-b760m-a-ddr4', category: 'motherboard', brand: 'MSI', model: 'PRO B760M-A WIFI DDR4',
    priceKZT: 65_000, modelPath: M('motherboard_x570'), colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'programming', 'universal', 'gaming'],
    specSourceUrl: 'https://www.msi.com/Motherboard/PRO-B760M-A-WIFI-DDR4/Specification',
    specifications: [
      { key: 'socket', value: 'LGA1700 (Intel B760)' },
      { key: 'formFactor', value: 'Micro-ATX' },
      { key: 'memory', value: '4 × DDR4' },
      { key: 'm2', value: '2 × M.2 PCIe 4.0' },
    ],
    compatibility: { socket: 'LGA1700', memoryType: 'DDR4', formFactor: 'mATX' },
  }),
  item({
    id: 'mb-msi-b650-gaming-plus', category: 'motherboard', brand: 'MSI', model: 'B650 GAMING PLUS WIFI',
    priceKZT: 80_000, modelPath: M('motherboard_x570'), colors: ['black'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'universal', 'study', 'programming'],
    specSourceUrl: 'https://www.msi.com/Motherboard/B650-GAMING-PLUS-WIFI/Specification',
    specifications: [
      { key: 'socket', value: 'AM5 (AMD B650)' },
      { key: 'formFactor', value: 'ATX' },
      { key: 'memory', value: '4 × DDR5' },
      { key: 'm2', value: '2 × M.2 PCIe 4.0' },
    ],
    compatibility: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX' },
  }),
  item({
    id: 'mb-asus-tuf-b650-plus', category: 'motherboard', brand: 'ASUS', model: 'TUF GAMING B650-PLUS WIFI',
    priceKZT: 95_000, modelPath: M('motherboard_x570'), colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'design3d'],
    specSourceUrl: 'https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650-plus-wifi/techspec/',
    specifications: [
      { key: 'socket', value: 'AM5 (AMD B650)' },
      { key: 'formFactor', value: 'ATX' },
      { key: 'memory', value: '4 × DDR5' },
      { key: 'm2', value: '1 × PCIe 5.0 + 2 × PCIe 4.0' },
    ],
    compatibility: { socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX' },
  }),
  item({
    id: 'mb-asus-prime-z890-p', category: 'motherboard', brand: 'ASUS', model: 'PRIME Z890-P WIFI',
    priceKZT: 130_000, modelPath: M('motherboard_x570'), colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['design3d', 'streaming', 'programming'],
    specSourceUrl: 'https://www.asus.com/motherboards-components/motherboards/prime/prime-z890-p-wifi/techspec/',
    specifications: [
      { key: 'socket', value: 'LGA1851 (Intel Z890)' },
      { key: 'formFactor', value: 'ATX' },
      { key: 'memory', value: '4 × DDR5' },
      { key: 'm2', value: '1 × PCIe 5.0 + 3 × PCIe 4.0' },
    ],
    compatibility: { socket: 'LGA1851', memoryType: 'DDR5', formFactor: 'ATX' },
  }),

  // ───────────── Memory ─────────────
  item({
    id: 'ram-kingston-beast-ddr4-16', category: 'ram', brand: 'Kingston', model: 'FURY Beast DDR4-3200 16 GB (2 × 8)',
    priceKZT: 22_000, modelPath: M('ram_rgb'), colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'universal', 'programming'],
    specSourceUrl: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr4-memory',
    specifications: [
      { key: 'capacity', value: '16 GB (2 × 8 GB)' },
      { key: 'memType', value: 'DDR4' },
      { key: 'speed', value: 3200, unit: 'mts' },
      { key: 'timings', value: 'CL16, 1.35 V' },
    ],
    compatibility: { memoryType: 'DDR4' },
  }),
  item({
    id: 'ram-kingston-beast-ddr5-16', category: 'ram', brand: 'Kingston', model: 'FURY Beast DDR5-5600 16 GB (2 × 8)',
    priceKZT: 32_000, modelPath: M('ram_rgb'), colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'universal', 'programming'],
    specSourceUrl: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory',
    specifications: [
      { key: 'capacity', value: '16 GB (2 × 8 GB)' },
      { key: 'memType', value: 'DDR5' },
      { key: 'speed', value: 5600, unit: 'mts' },
      { key: 'timings', value: 'CL36, 1.25 V' },
    ],
    compatibility: { memoryType: 'DDR5' },
  }),
  item({
    id: 'ram-kingston-beast-ddr5-32', category: 'ram', brand: 'Kingston', model: 'FURY Beast DDR5-6000 32 GB (2 × 16)',
    priceKZT: 55_000, modelPath: M('ram_rgb'), colors: ['black', 'white'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'programming', 'universal', 'streaming'],
    specSourceUrl: 'https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory',
    specifications: [
      { key: 'capacity', value: '32 GB (2 × 16 GB)' },
      { key: 'memType', value: 'DDR5' },
      { key: 'speed', value: 6000, unit: 'mts' },
      { key: 'timings', value: 'CL30, 1.4 V' },
    ],
    compatibility: { memoryType: 'DDR5' },
  }),
  item({
    id: 'ram-corsair-vengeance-rgb-32', category: 'ram', brand: 'Corsair', model: 'VENGEANCE RGB DDR5-6000 32 GB (2 × 16)',
    priceKZT: 60_000, modelPath: M('ram_rgb'), colors: ['black', 'white'], rgb: true,
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://www.corsair.com/us/en/p/memory/cmh32gx5m2e6000c36/vengeance-rgb-32gb-2x16gb-ddr5-dram-6000mt-s-cl36-memory-kit-black-cmh32gx5m2e6000c36',
    specifications: [
      { key: 'capacity', value: '32 GB (2 × 16 GB)' },
      { key: 'memType', value: 'DDR5' },
      { key: 'speed', value: 6000, unit: 'mts' },
      { key: 'timings', value: 'CL36, 1.4 V' },
    ],
    compatibility: { memoryType: 'DDR5' },
  }),
  item({
    id: 'ram-gskill-trident-z5-64', category: 'ram', brand: 'G.Skill', model: 'Trident Z5 RGB DDR5-6400 64 GB (2 × 32)',
    priceKZT: 120_000, modelPath: M('ram_rgb'), colors: ['black', 'silver'], rgb: true,
    performanceTier: 'enthusiast', recommendedUse: ['design3d', 'streaming', 'programming'],
    specSourceUrl: 'https://www.gskill.com/product/165/390/1665020865/F5-6400J3239G32GX2-TZ5RK',
    specifications: [
      { key: 'capacity', value: '64 GB (2 × 32 GB)' },
      { key: 'memType', value: 'DDR5' },
      { key: 'speed', value: 6400, unit: 'mts' },
      { key: 'timings', value: 'CL32, 1.4 V' },
    ],
    compatibility: { memoryType: 'DDR5' },
  }),

  // ───────────── Graphics cards ─────────────
  item({
    id: 'gpu-asus-dual-5060ti-16', category: 'gpu', brand: 'ASUS', model: 'Dual GeForce RTX 5060 Ti 16GB',
    priceKZT: 230_000, modelPath: M('gpu_triple_fan'), modelSize: 0.229, colors: ['black', 'white'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://www.asus.com/motherboards-components/graphics-cards/dual/dual-rtx5060ti-o16g/techspec/',
    specifications: [
      { key: 'vram', value: '16 GB GDDR7' },
      { key: 'tgp', value: 180, unit: 'w' },
      { key: 'length', value: 229, unit: 'mm' },
      { key: 'psu', value: 600, unit: 'w' },
    ],
    compatibility: { lengthMm: 229, peakPowerW: 180, recommendedPsuW: 600 },
  }),
  item({
    id: 'gpu-nvidia-5070-fe', category: 'gpu', brand: 'NVIDIA', model: 'GeForce RTX 5070 Founders Edition',
    priceKZT: 300_000, modelPath: M('gpu_triple_fan'), modelSize: 0.242, colors: ['silver'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'design3d'],
    specSourceUrl: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/',
    specifications: [
      { key: 'vram', value: '12 GB GDDR7' },
      { key: 'tgp', value: 250, unit: 'w' },
      { key: 'length', value: 242, unit: 'mm' },
      { key: 'psu', value: 650, unit: 'w' },
    ],
    compatibility: { lengthMm: 242, peakPowerW: 250, recommendedPsuW: 650 },
  }),
  item({
    id: 'gpu-sapphire-9070xt-pulse', category: 'gpu', brand: 'Sapphire', model: 'PULSE Radeon RX 9070 XT 16GB',
    priceKZT: 360_000, modelPath: M('gpu_triple_fan'), modelSize: 0.32, colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming'],
    specSourceUrl: 'https://www.sapphiretech.com/en/consumer/pulse-radeon-rx-9070-xt-16g-gddr6',
    specifications: [
      { key: 'vram', value: '16 GB GDDR6' },
      { key: 'tgp', value: 304, unit: 'w' },
      { key: 'length', value: 320, unit: 'mm' },
      { key: 'psu', value: 750, unit: 'w' },
    ],
    compatibility: { lengthMm: 320, peakPowerW: 304, recommendedPsuW: 750 },
  }),
  item({
    id: 'gpu-nvidia-5080-fe', category: 'gpu', brand: 'NVIDIA', model: 'GeForce RTX 5080 Founders Edition',
    priceKZT: 580_000, modelPath: M('gpu_triple_fan'), modelSize: 0.304, colors: ['silver'],
    performanceTier: 'enthusiast', recommendedUse: ['gaming', 'design3d', 'streaming'],
    specSourceUrl: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/',
    specifications: [
      { key: 'vram', value: '16 GB GDDR7' },
      { key: 'tgp', value: 360, unit: 'w' },
      { key: 'length', value: 304, unit: 'mm' },
      { key: 'psu', value: 850, unit: 'w' },
    ],
    compatibility: { lengthMm: 304, peakPowerW: 360, recommendedPsuW: 850 },
  }),
  item({
    id: 'gpu-asus-rog-astral-5090', category: 'gpu', brand: 'ASUS', model: 'ROG Astral GeForce RTX 5090 32GB',
    priceKZT: 1_500_000, modelPath: M('gpu_triple_fan'), modelSize: 0.358, colors: ['black'],
    performanceTier: 'enthusiast', recommendedUse: ['design3d', 'gaming'],
    specSourceUrl: 'https://rog.asus.com/graphics-cards/graphics-cards/rog-astral/rog-astral-rtx5090-o32g-gaming/spec/',
    specifications: [
      { key: 'vram', value: '32 GB GDDR7' },
      { key: 'tgp', value: 575, unit: 'w' },
      { key: 'length', value: 357.6, unit: 'mm' },
      { key: 'psu', value: 1000, unit: 'w' },
    ],
    compatibility: { lengthMm: 357.6, peakPowerW: 575, recommendedPsuW: 1000 },
  }),

  // ───────────── Storage ─────────────
  item({
    id: 'ssd-kingston-nv3-1tb', category: 'ssd', brand: 'Kingston', model: 'NV3 1 TB',
    priceKZT: 35_000, modelPath: M('ssd_m2'), colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'universal', 'gaming', 'programming'],
    specSourceUrl: 'https://www.kingston.com/en/ssd/nv3-nvme-pcie-ssd',
    specifications: [
      { key: 'form', value: 'M.2 2280 NVMe (PCIe 4.0)' },
      { key: 'read', value: 6000, unit: 'mbps' },
      { key: 'write', value: 4000, unit: 'mbps' },
    ],
    compatibility: {},
  }),
  item({
    id: 'ssd-samsung-870-evo-1tb', category: 'ssd', brand: 'Samsung', model: '870 EVO 1 TB (2.5″ SATA)',
    priceKZT: 45_000, modelPath: M('ssd_m2'), colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'universal'],
    specSourceUrl: 'https://www.samsung.com/us/computing/memory-storage/solid-state-drives/870-evo-sata-2-5-ssd-1tb-mz-77e1t0b-am/',
    specifications: [
      { key: 'form', value: '2.5″ SATA 6 Gb/s' },
      { key: 'read', value: 560, unit: 'mbps' },
      { key: 'write', value: 530, unit: 'mbps' },
    ],
    compatibility: {},
  }),
  item({
    id: 'ssd-wd-sn850x-1tb', category: 'ssd', brand: 'WD_BLACK', model: 'SN850X 1 TB',
    priceKZT: 55_000, modelPath: M('ssd_m2'), colors: ['black'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'streaming', 'programming'],
    specSourceUrl: 'https://www.westerndigital.com/products/internal-drives/wd-black-sn850x-nvme-ssd',
    specifications: [
      { key: 'form', value: 'M.2 2280 NVMe (PCIe 4.0)' },
      { key: 'read', value: 7300, unit: 'mbps' },
      { key: 'write', value: 6300, unit: 'mbps' },
    ],
    compatibility: {},
  }),
  item({
    id: 'ssd-samsung-990-pro-2tb', category: 'ssd', brand: 'Samsung', model: '990 PRO 2 TB',
    priceKZT: 95_000, modelPath: M('ssd_m2'), colors: ['black'],
    performanceTier: 'enthusiast', recommendedUse: ['design3d', 'streaming', 'gaming'],
    specSourceUrl: 'https://www.samsung.com/us/computing/memory-storage/solid-state-drives/990-pro-pcie-4-0-nvme-ssd-2tb-mz-v9p2t0b-am/',
    specifications: [
      { key: 'form', value: 'M.2 2280 NVMe (PCIe 4.0)' },
      { key: 'read', value: 7450, unit: 'mbps' },
      { key: 'write', value: 6900, unit: 'mbps' },
    ],
    compatibility: {},
  }),

  // ───────────── Power supplies ─────────────
  item({
    id: 'psu-deepcool-pk550d', category: 'psu', brand: 'DeepCool', model: 'PK550D',
    priceKZT: 25_000, modelPath: M('psu'), colors: ['black'],
    performanceTier: 'entry', recommendedUse: ['study', 'universal', 'programming'],
    specSourceUrl: 'https://www.deepcool.com/products/PowerSupplyUnits/PK550D/',
    specifications: [
      { key: 'power', value: 550, unit: 'w' },
      { key: 'efficiency', value: '80 PLUS Bronze' },
      { key: 'modular', value: 'modularNo', translate: true },
    ],
    compatibility: { psuW: 550 },
  }),
  item({
    id: 'psu-bequiet-pp12m-650', category: 'psu', brand: 'be quiet!', model: 'Pure Power 12 M 650W',
    priceKZT: 45_000, modelPath: M('psu'), colors: ['black'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'programming', 'universal'],
    specSourceUrl: 'https://www.bequiet.com/en/powersupply/4018',
    specifications: [
      { key: 'power', value: 650, unit: 'w' },
      { key: 'efficiency', value: '80 PLUS Gold' },
      { key: 'standard', value: 'ATX 3.0, 12VHPWR' },
      { key: 'modular', value: 'modularFull', translate: true },
    ],
    compatibility: { psuW: 650 },
  }),
  item({
    id: 'psu-corsair-rm750e', category: 'psu', brand: 'Corsair', model: 'RM750e',
    priceKZT: 50_000, modelPath: M('psu'), colors: ['black'],
    performanceTier: 'mainstream', recommendedUse: ['gaming', 'streaming', 'universal'],
    specSourceUrl: 'https://www.corsair.com/us/en/p/psu/cp-9020262-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply-cp-9020262-na',
    specifications: [
      { key: 'power', value: 750, unit: 'w' },
      { key: 'efficiency', value: '80 PLUS Gold' },
      { key: 'standard', value: 'ATX 3.0, 12VHPWR' },
      { key: 'modular', value: 'modularFull', translate: true },
    ],
    compatibility: { psuW: 750 },
  }),
  item({
    id: 'psu-corsair-rm850x', category: 'psu', brand: 'Corsair', model: 'RM850x (2024)',
    priceKZT: 65_000, modelPath: M('psu'), colors: ['black', 'white'],
    performanceTier: 'performance', recommendedUse: ['gaming', 'design3d', 'streaming'],
    specSourceUrl: 'https://www.corsair.com/us/en/p/psu/cp-9020270-na/rmx-series-rm850x-fully-modular-low-noise-atx-power-supply-cp-9020270-na',
    specifications: [
      { key: 'power', value: 850, unit: 'w' },
      { key: 'efficiency', value: '80 PLUS Gold' },
      { key: 'standard', value: 'ATX 3.1, 12V-2×6' },
      { key: 'modular', value: 'modularFull', translate: true },
    ],
    compatibility: { psuW: 850 },
  }),
  item({
    id: 'psu-seasonic-focus-gx-1000', category: 'psu', brand: 'Seasonic', model: 'FOCUS GX-1000 ATX 3',
    priceKZT: 85_000, modelPath: M('psu'), colors: ['black', 'white'],
    performanceTier: 'enthusiast', recommendedUse: ['design3d', 'gaming'],
    specSourceUrl: 'https://seasonic.com/atx3-focus-gx/',
    specifications: [
      { key: 'power', value: 1000, unit: 'w' },
      { key: 'efficiency', value: '80 PLUS Gold' },
      { key: 'standard', value: 'ATX 3.0, 12V-2×6' },
      { key: 'modular', value: 'modularFull', translate: true },
    ],
    compatibility: { psuW: 1000 },
  }),
];

export const CATALOG_BY_ID: ReadonlyMap<string, HardwareItem> = new Map(CATALOG.map((p) => [p.id, p]));

export const productsIn = (category: HardwareCategory) => CATALOG.filter((p) => p.category === category);
