/**
 * V4 §4.4: the robots' economy — coins, the wardrobe and training. Pure and
 * shared by the browser and the server (server/robots.ts), like the XP rules
 * it builds on (services/game/xp.ts), and the base Section 9's achievements
 * will share.
 *
 *   coins earned   START + XP / 4 + 2 per robot tip heard (each tip once)
 *   coins spent    the items bought (once each, any robot may wear them)
 *                  + the training of every robot to its level
 *   balance        earned − spent; nothing is bought on credit
 *
 * Only what was bought is stored (the save); what was earned is always
 * recomputed from the attempts, so a save cannot claim coins it never had.
 * Robot levels 1–5: level 2 unlocks the wave, 4 the dance, 5 a skill (a
 * charge lasts longer in the yard); items have a minimum robot level.
 */
import { ROBOT_IDS, isRobotId, type RobotId } from '@/data/robots/roster';
import { TIP_IDS } from '@/data/robots/tips';

export const WEAR_SLOTS = ['hat', 'shirt', 'face', 'neck', 'back', 'badge'] as const;
export type WardrobeSlot = (typeof WEAR_SLOTS)[number];

export interface Item {
  id: string;
  slot: WardrobeSlot;
  price: number;
  /** The robot level that can wear it. */
  level: number;
  /** Shirts: the colour they paint the robot's shirt. */
  color?: string;
}

export const ITEMS: readonly Item[] = [
  { id: 'cap', slot: 'hat', price: 30, level: 1 },
  { id: 'headphones', slot: 'hat', price: 45, level: 1 },
  { id: 'kalpak', slot: 'hat', price: 60, level: 2 },
  { id: 'gradcap', slot: 'hat', price: 80, level: 3 },
  { id: 'crown', slot: 'hat', price: 150, level: 4 },
  { id: 'shirt_blue', slot: 'shirt', price: 20, level: 1, color: '#5f7bff' },
  { id: 'shirt_violet', slot: 'shirt', price: 20, level: 1, color: '#a95cf5' },
  { id: 'shirt_cyan', slot: 'shirt', price: 20, level: 1, color: '#22d3ee' },
  { id: 'shirt_nauryz', slot: 'shirt', price: 35, level: 2, color: '#22c55e' },
  { id: 'shirt_autumn', slot: 'shirt', price: 35, level: 2, color: '#f97316' },
  { id: 'shirt_winter', slot: 'shirt', price: 35, level: 3, color: '#93c5fd' },
  { id: 'glasses', slot: 'face', price: 20, level: 1 },
  { id: 'scarf', slot: 'neck', price: 30, level: 1 },
  { id: 'backpack', slot: 'back', price: 40, level: 2 },
  { id: 'badge', slot: 'badge', price: 15, level: 1 },
];
export type ItemId = string;
export const itemById = (id: string) => ITEMS.find((i) => i.id === id);

export const MAX_LEVEL = 5;
export const ECONOMY = { start: 50, xpPerCoin: 4, perTip: 2 } as const;
/** Coins to train a robot from `level` to the next one. */
export const trainCost = (level: number) => (level >= MAX_LEVEL ? Infinity : 40 * level);
/** Everything spent to get a robot from level 1 to `level`. */
export const trainedCost = (level: number) => {
  let sum = 0;
  for (let l = 1; l < Math.min(level, MAX_LEVEL); l++) sum += trainCost(l);
  return sum;
};
/** What a level unlocks. */
export const UNLOCKS: Record<number, readonly ('wave' | 'items' | 'dance' | 'skill')[]> = { 2: ['wave', 'items'], 3: ['items'], 4: ['dance', 'items'], 5: ['skill'] };
export const ANIM_LEVEL = { idle: 1, work: 1, wave: 2, dance: 4 } as const;
export type RobotAnim = keyof typeof ANIM_LEVEL;
export const SKILL_LEVEL = 5;

export interface RobotSave {
  v: 1;
  owned: ItemId[];
  wear: Partial<Record<RobotId, Partial<Record<WardrobeSlot, ItemId>>>>;
  levels: Partial<Record<RobotId, number>>;
  /** Tips heard (each counts once). */
  tips: string[];
  updatedAt: number;
}

export const emptySave = (): RobotSave => ({ v: 1, owned: [], wear: {}, levels: {}, tips: [], updatedAt: 0 });
export const levelOfRobot = (s: RobotSave, id: RobotId) => Math.max(1, Math.min(MAX_LEVEL, s.levels[id] ?? 1));

export const coinsEarned = (xpTotal: number, save: Pick<RobotSave, 'tips'>) => ECONOMY.start + Math.floor(Math.max(0, xpTotal) / ECONOMY.xpPerCoin) + save.tips.length * ECONOMY.perTip;
export const coinsSpent = (save: RobotSave) => save.owned.reduce((n, id) => n + (itemById(id)?.price ?? 0), 0) + ROBOT_IDS.reduce((n, id) => n + trainedCost(levelOfRobot(save, id)), 0);
export const balance = (xpTotal: number, save: RobotSave) => coinsEarned(xpTotal, save) - coinsSpent(save);

/** Which slots a robot's body can wear (the robot kit has an anchor for each; scripts/robots.test.mjs keeps them in step). */
export const WEARABLE: Record<RobotId, readonly WardrobeSlot[]> = {
  guide: WEAR_SLOTS,
  cleaner: ['hat', 'shirt', 'face', 'back', 'badge'],
  cargo: WEAR_SLOTS,
  presenter: WEAR_SLOTS,
  assembler: WEAR_SLOTS,
  teacher: ['hat', 'shirt', 'neck', 'back', 'badge'],
  guard: WEAR_SLOTS,
  inspector: WEAR_SLOTS,
  librarian: WEAR_SLOTS,
  coach: WEAR_SLOTS,
};

export type WearCheck = 'ok' | 'notOwned' | 'level' | 'slot' | 'cannot';
export function canWear(save: RobotSave, robot: RobotId, itemId: ItemId): WearCheck {
  const item = itemById(itemId);
  if (!item) return 'slot';
  if (!WEARABLE[robot].includes(item.slot)) return 'cannot';
  if (!save.owned.includes(itemId)) return 'notOwned';
  if (levelOfRobot(save, robot) < item.level) return 'level';
  return 'ok';
}

/** A save as it may be stored: known ids only, levels 1..5, worn items owned, allowed and in their own slot. */
export function normalizeSave(input: unknown): RobotSave {
  const s = (input ?? {}) as Partial<RobotSave>;
  const out = emptySave();
  out.owned = [...new Set(Array.isArray(s.owned) ? s.owned.filter((id): id is string => typeof id === 'string' && !!itemById(id)) : [])];
  if (s.levels && typeof s.levels === 'object') {
    for (const [id, l] of Object.entries(s.levels)) if (isRobotId(id) && Number.isInteger(l) && (l as number) > 1) out.levels[id] = Math.min(MAX_LEVEL, l as number);
  }
  out.tips = [...new Set(Array.isArray(s.tips) ? s.tips.filter((id): id is string => typeof id === 'string' && TIP_IDS.has(id)) : [])];
  if (s.wear && typeof s.wear === 'object') {
    for (const [id, slots] of Object.entries(s.wear)) {
      if (!isRobotId(id) || !slots || typeof slots !== 'object') continue;
      for (const [slot, item] of Object.entries(slots)) {
        const it = typeof item === 'string' ? itemById(item) : undefined;
        if (!it || it.slot !== slot || canWear(out, id, it.id) !== 'ok') continue;
        (out.wear[id] ??= {})[it.slot] = it.id;
      }
    }
  }
  out.updatedAt = Number.isFinite(s.updatedAt) ? Number(s.updatedAt) : 0;
  return out;
}

export type BuyResult = { ok: true; save: RobotSave } | { ok: false; reason: 'owned' | 'coins' | 'unknown' };

export function buy(save: RobotSave, xpTotal: number, itemId: ItemId): BuyResult {
  const item = itemById(itemId);
  if (!item) return { ok: false, reason: 'unknown' };
  if (save.owned.includes(itemId)) return { ok: false, reason: 'owned' };
  if (balance(xpTotal, save) < item.price) return { ok: false, reason: 'coins' };
  return { ok: true, save: { ...save, owned: [...save.owned, itemId] } };
}

export type TrainResult = { ok: true; save: RobotSave; level: number } | { ok: false; reason: 'max' | 'coins' };

export function train(save: RobotSave, xpTotal: number, robot: RobotId): TrainResult {
  const level = levelOfRobot(save, robot);
  if (level >= MAX_LEVEL) return { ok: false, reason: 'max' };
  if (balance(xpTotal, save) < trainCost(level)) return { ok: false, reason: 'coins' };
  return { ok: true, level: level + 1, save: { ...save, levels: { ...save.levels, [robot]: level + 1 } } };
}

/** Puts an item on (or takes the slot's item off with null). Unchanged when it may not be worn. */
export function wear(save: RobotSave, robot: RobotId, slot: WardrobeSlot, itemId: ItemId | null): RobotSave {
  const current = { ...(save.wear[robot] ?? {}) };
  if (itemId === null) delete current[slot];
  else {
    if (itemById(itemId)?.slot !== slot || canWear(save, robot, itemId) !== 'ok') return save;
    current[slot] = itemId;
  }
  return { ...save, wear: { ...save.wear, [robot]: current } };
}

export const heardTip = (save: RobotSave, tipId: string): RobotSave => (save.tips.includes(tipId) || !TIP_IDS.has(tipId) ? save : { ...save, tips: [...save.tips, tipId] });

/** The server's check of a save a browser sends: valid, and never more spent than earned. */
export function checkSave(input: unknown, xpTotal: number): { ok: true; save: RobotSave } | { ok: false; reason: 'overspent' } {
  const save = normalizeSave(input);
  return balance(xpTotal, save) < 0 ? { ok: false, reason: 'overspent' } : { ok: true, save };
}
