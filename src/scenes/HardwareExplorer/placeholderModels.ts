import { createElement, type ComponentType } from 'react';
import type { AnatomyId } from '@/data/hardware/anatomy';
import { Product } from '@/scenes/LabSpace/zones/common';

/** Anatomy items whose model is a lab device product (2026-10 downloads) rather than a catalog GLB. */
const product = (id: string): ComponentType => {
  const Model = () => createElement(Product, { product: id });
  Model.displayName = `Product(${id})`;
  return Model;
};

export const PLACEHOLDER_MODELS: Partial<Record<AnatomyId, ComponentType>> = {
  microphone: product('dev-microphone'),
  webcam: product('dev-webcam'),
  printer: product('dev-printer-inkjet'),
  hdd: product('dev-hdd'),
  nic: product('dev-nic'),
};
