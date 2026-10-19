import type { DeskSurface, Finish } from '@/data/studio/options';
import { resolveBuild, type Build, type ResolvedBuild } from '@/lib/studio/build';
import { recommendBuild } from '@/lib/studio/recommend';
import { BITLAB_AERO } from '@/data/hardware/house';

/**
 * The setups the home hero cycles through (0.37 "living lab"): each look is a
 * complete desk of real catalog products in one style. The white one comes
 * first and is the still frame for reduced motion. Models are chosen light
 * (few draw calls each, see scripts/hero.test.mjs) so the cycle costs no FPS.
 */
export interface HeroLook {
  id: 'white' | 'black' | 'rgb';
  build: ResolvedBuild;
  finish: Finish;
  desk: DeskSurface;
}

/** Internals of the showcase gaming build: every look has the same parts inside, so no part is hidden. */
const INSIDE = recommendBuild('gaming', 1_200_000, 'black');
const inside: Build = { cpu: INSIDE.cpu, motherboard: INSIDE.motherboard, ram: INSIDE.ram, gpu: INSIDE.gpu, cooling: INSIDE.cooling, psu: INSIDE.psu, ssd: INSIDE.ssd };

const look = (id: HeroLook['id'], desk: DeskSurface, finish: Omit<Finish, 'rgbCustom' | 'desk'>, devices: Build): HeroLook => ({
  id,
  desk,
  finish: { ...finish, desk, rgbCustom: '#38d6f5' },
  build: { ...resolveBuild({ ...inside, ...devices }), ...(id === 'white' ? { case: BITLAB_AERO } : {}) },
});

export const HERO_LOOKS: readonly HeroLook[] = [
  look('white', 'white', { case: 'white', rgb: 'white', peripherals: 'white' }, {
    monitor: 'mon-asus-xg27acs',
    keyboard: 'kb-logitech-pro-x-tkl',
    mouse: 'mouse-logitech-superlight2',
    headset: 'hs-hyperx-cloud-iii',
    speakers: 'spk-creative-pebble-v3',
  }),
  look('black', 'darkWood', { case: 'black', rgb: 'off', peripherals: 'black' }, {
    case: 'case-fractal-north',
    monitor: 'mon-lg-27gr93u',
    keyboard: 'kb-keychron-k8-pro',
    mouse: 'mouse-logitech-g305',
    headset: 'hs-razer-blackshark-v2-pro',
    speakers: 'spk-logitech-z407',
  }),
  look('rgb', 'black', { case: 'black', rgb: 'purple', peripherals: 'black' }, {
    case: 'case-nzxt-h5-flow-2024',
    monitor: 'mon-asus-xg27aqmr',
    keyboard: 'kb-razer-huntsman-v3-pro-tkl',
    mouse: 'mouse-razer-viper-v3-pro',
    headset: 'hs-logitech-pro-x2',
    speakers: 'spk-edifier-r1280db',
  }),
];

