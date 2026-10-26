/** Small DOM helpers for the lab demos (V4 §5.3, components/lab/TaskGuide.tsx). */

/** For demos: the element marked data-guide="name". */
export const guideEl = (name: string) => () => document.querySelector(`[data-guide="${name}"]`);

/** For demos: presses the element marked data-guide="name". */
export const pressGuide = (name: string) => () => (document.querySelector(`[data-guide="${name}"]`) as HTMLElement | null)?.click();

/** For demos: moves a range / number input to `value` the way a hand would (React sees the change). */
export function setInputValue(el: Element | null, value: number) {
  if (!(el instanceof HTMLInputElement)) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, String(value));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
