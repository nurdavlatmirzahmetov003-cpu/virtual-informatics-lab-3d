/** Names for the live boards: ports, cable ends, and move messages with ids turned into words. */
import type { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { PC_SCENARIO, endsOf, type PortDef } from '@/labs/ConnectLab';
import type { Feedback } from '@/services/live/client';

export const k = (s: string) => s as TranslationKey;
type T = ReturnType<typeof useT>;

export const PC_ENDS = endsOf(PC_SCENARIO);

/** "USB-A 3" when an owner has several of a kind, "HDMI" otherwise. */
export function portLabel(t: T, p: PortDef) {
  const same = PC_SCENARIO.ports.filter((x) => x.owner === p.owner && x.kind === p.kind);
  const name = t(k(`connect.ports.${p.kind}`));
  return same.length > 1 ? `${name} ${p.id.split('_').pop()}` : name;
}

export const portName = (t: T, p: PortDef) => t('connect.portName', { owner: t(k(`connect.owners.${p.owner}`)), port: portLabel(t, p) });

/** Locale message of a move → text. */
export function feedbackText(t: T, m: NonNullable<Feedback['message']>) {
  const params: Record<string, string> = { ...m.params };
  if (params.missing) params.missing = params.missing.split(',').map((id) => t(k(`pcLab.steps.${id}.part`))).join(', ');
  if (params.where) params.where = t(k(`pcLab.steps.${params.where}.slot`));
  if (m.key.startsWith('connect.why.')) {
    const end = PC_ENDS.find((e) => e.id === params.end);
    const port = PC_SCENARIO.ports.find((p) => p.id === params.port);
    params.plug = end ? t(k(`connect.ports.${end.kind}`)) : '';
    params.port = port ? portName(t, port) : '';
  }
  return t(k(m.key), params);
}
