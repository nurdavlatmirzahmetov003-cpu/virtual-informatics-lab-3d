import type { ComponentType } from 'react';
import type { AnatomyId } from '@/data/hardware/anatomy';
import { Hdd, Microphone, NetworkCard, Printer, Webcam } from './placeholders';

/** Devices without a licensed GLB yet — [PLACEHOLDER] entries in TODO.md. */
export const PLACEHOLDER_MODELS: Partial<Record<AnatomyId, ComponentType>> = {
  microphone: Microphone,
  webcam: Webcam,
  printer: Printer,
  hdd: Hdd,
  nic: NetworkCard,
};
