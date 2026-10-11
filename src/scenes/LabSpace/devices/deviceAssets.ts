/** Catalog product model of each lab device that has one (V2-2a/b files). */
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
};

/** Product files a set of devices uses, for prefetching. */
export const deviceProducts = (ids: readonly string[]) => ids.map((id) => PRODUCT[id]).filter(Boolean);


/** Devices without a 3D model yet (the viewer then shows the text only). */
const NO_MODEL = new Set(['modem', 'wifi_adapter', 'access_point', 'nas']);
export const hasDeviceModel = (id: string) => !NO_MODEL.has(id);
