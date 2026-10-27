/**
 * V4 §7: the secondary pages, grouped — one list for the side menu and the
 * footer, so a page added here shows up in both.
 */
import type { LucideIcon } from 'lucide-react';
import { Award, Gamepad2, Mail, MessageSquareText, Route, Scale, ScanEye, ShieldCheck } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

export interface SiteLink {
  to: string;
  label: TranslationKey;
  icon: LucideIcon;
}

export interface SiteLinkGroup {
  id: 'learning' | 'help' | 'about';
  title: TranslationKey;
  links: readonly SiteLink[];
}

export const SITE_LINK_GROUPS: readonly SiteLinkGroup[] = [
  {
    id: 'learning',
    title: 'menu.learning',
    links: [
      { to: '/path', label: 'nav.path', icon: Route },
      { to: '/certificate', label: 'footer.certificate', icon: Award },
      { to: '/games', label: 'footer.games', icon: Gamepad2 },
      { to: '/identify', label: 'nav.identify', icon: ScanEye },
    ],
  },
  {
    id: 'help',
    title: 'menu.help',
    links: [
      { to: '/feedback#contact', label: 'footer.contact', icon: Mail },
      { to: '/feedback', label: 'footer.feedback', icon: MessageSquareText },
    ],
  },
  {
    id: 'about',
    title: 'menu.about',
    links: [
      { to: '/credits', label: 'footer.credits', icon: Scale },
      { to: '/privacy', label: 'footer.privacy', icon: ShieldCheck },
    ],
  },
];
