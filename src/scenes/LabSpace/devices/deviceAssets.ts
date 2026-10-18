/** Product model of each lab device that has one (V2-2a/b catalog files and the 2026-10 lab devices). */
export const PRODUCT: Record<string, string> = {
  cpu: 'cpu-amd-am5',
  cooler_air: 'cool-deepcool-ak400',
  motherboard: 'mb-msi-b650-gaming-plus',
  ram: 'ram-kingston-fury-beast',
  gpu: 'gpu-nvidia-5070-fe',
  psu: 'psu-corsair-rm750e',
  case: 'case-deepcool-cc560-v2',
  ssd_sata: 'ssd-samsung-870-evo-1tb',
  ssd_nvme: 'ssd-samsung-990-pro-2tb',
  monitor: 'mon-asus-xg27acs',
  keyboard: 'kb-keychron-k8-pro',
  mouse: 'mouse-logitech-g502x-plus',
  headset: 'hs-hyperx-cloud-iii',
  // lab devices (2026-10, scripts/blender/make-device-configs.py)
  thermal_paste: 'dev-thermal-paste',
  hdd_35: 'dev-hdd',
  usb_flash: 'dev-usb-flash',
  sd_card: 'dev-sd-card',
  external_drive: 'dev-external-drive',
  optical_disc: 'dev-optical-disc',
  graphics_tablet: 'dev-graphics-tablet',
  gamepad: 'dev-gamepad',
  microphone: 'dev-microphone',
  webcam: 'dev-webcam',
  printer_laser: 'dev-printer-laser',
  printer_inkjet: 'dev-printer-inkjet',
  printer_3d: 'dev-printer-3d',
  interactive_panel: 'dev-interactive-panel',
  router: 'dev-router',
  switch: 'dev-switch',
  modem: 'dev-modem',
  wifi_adapter: 'dev-wifi-adapter',
  nic: 'dev-nic',
  nas: 'dev-nas',
  server_rack: 'dev-server-rack',
  ups: 'dev-ups',
  usb_hub: 'dev-usb-hub',
  laptop: 'dev-laptop',
  all_in_one: 'dev-all-in-one',
  smartphone: 'dev-smartphone',
  tablet: 'dev-tablet',
  smartwatch: 'dev-smartwatch',
  sbc: 'dev-sbc',
};

/** Product files a set of devices uses, for prefetching. */
export const deviceProducts = (ids: readonly string[]) => ids.map((id) => PRODUCT[id]).filter(Boolean);


/**
 * Whether the hall overview may show a device's own model. The 2026-10 lab
 * device models (`dev-*`) stay out of the overview on Low / Medium (their
 * pads stay; the model loads when the zone opens), so the overview costs no
 * more there than before them (V2-12 perf rule).
 */
export const inOverview = (id: string, level: string) => level === 'high' || level === 'ultra' || !PRODUCT[id]?.startsWith('dev-');
