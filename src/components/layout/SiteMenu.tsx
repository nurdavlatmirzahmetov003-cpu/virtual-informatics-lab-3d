/**
 * V4 §7: the side menu. A button at the right end of the top bar opens a
 * drawer from the right with the secondary pages (grouped, with icons) and
 * the site settings: language, theme, quality, accessibility and the account.
 * On small screens the top bar shows only this button, so it stays clean.
 *
 * A modal dialog: Esc, a click on the backdrop or a swipe to the right
 * closes it; Tab stays inside while it is open; the focus returns to the
 * button. The slide follows the motion tokens, so reduced motion and the
 * «calm» option make it instant.
 */
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { homeOf } from '@/pages/Auth/roles';
import { useAuthStore } from '@/store/authStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { QualitySelect } from '@/components/ui/QualitySelect';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { A11yOptions } from '@/components/ui/A11yMenu';
import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/config/brand';
import { SITE_LINK_GROUPS } from './siteLinks';
import controls from '@/components/ui/Controls.module.css';
import styles from './SiteMenu.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** a swipe this far to the right (px) closes the drawer */
const SWIPE_CLOSE = 70;

export function SiteMenu() {
  const t = useT();
  const location = useLocation();
  const here = location.pathname + location.hash;
  // the page the menu was opened on: a new page (a link inside it, or the browser's back button) closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === here;
  const setOpen = (v: boolean) => setOpenOn(v ? here : null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpenOn(null);
        button.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keys, true);
    return () => {
      document.removeEventListener('keydown', keys, true);
      root.style.overflow = overflow;
    };
  }, [open]);

  // swipe to close: the drawer follows the finger to the right, and goes past the threshold or springs back
  const swipe = useRef<{ x: number; y: number; id: number; dx: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse') return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dx: 0 };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId || !panel.current) return;
    const dx = e.clientX - s.x;
    if (Math.abs(e.clientY - s.y) > Math.abs(dx) && s.dx === 0) {
      swipe.current = null; // a vertical scroll, not a swipe
      return;
    }
    s.dx = Math.max(0, dx);
    panel.current.style.transition = 'none';
    panel.current.style.transform = `translateX(${s.dx}px)`;
  };
  const onPointerEnd = () => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || !panel.current) return;
    panel.current.style.transition = '';
    panel.current.style.transform = '';
    if (s.dx > SWIPE_CLOSE) close();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className={`${controls.iconButton} ${styles.burger}`}
        aria-label={t('menu.open')}
        title={t('menu.open')}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-site-menu-button=""
        onClick={() => setOpen(true)}
      >
        <Menu size={18} aria-hidden="true" />
      </button>
      {createPortal(
        <div className={styles.layer} data-open={open || undefined} data-chrome="menu" inert={!open}>
          <div className={styles.backdrop} onClick={() => close()} aria-hidden="true" />
          <div
            ref={panel}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-site-menu=""
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <div className={styles.head}>
              <span className={styles.brand}>
                <BrandMark size={26} /> {BRAND.name}
              </span>
              <h2 id={titleId} className="visually-hidden">
                {t('menu.title')}
              </h2>
              <button ref={closeButton} type="button" className={controls.iconButton} aria-label={t('menu.close')} title={t('menu.close')} onClick={() => close()}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.body}>
              <MenuAccount onDone={() => close(false)} />

              {SITE_LINK_GROUPS.map((g) => (
                <nav key={g.id} className={styles.group} aria-labelledby={`${titleId}-${g.id}`}>
                  <h3 id={`${titleId}-${g.id}`} className={styles.groupTitle}>
                    {t(g.title)}
                  </h3>
                  <ul>
                    {g.links.map(({ to, label, icon: Icon }) => (
                      <li key={to}>
                        <Link to={to} className={styles.link} aria-current={here === to ? 'page' : undefined} onClick={() => close(false)}>
                          <span className={styles.icon}>
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          {t(label)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}

              <section className={styles.group} aria-labelledby={`${titleId}-settings`}>
                <h3 id={`${titleId}-settings`} className={styles.groupTitle}>
                  {t('menu.settings')}
                </h3>
                <div className={styles.row}>
                  <span>{t('settings.language')}</span>
                  <LanguageSwitcher />
                </div>
                <div className={styles.row}>
                  <span>{t('settings.theme')}</span>
                  <ThemeToggle />
                </div>
                <div className={styles.row}>
                  <span>{t('settings.quality')}</span>
                  <QualitySelect />
                </div>
                <div className={styles.a11y}>
                  <p className={styles.subTitle}>{t('a11y.title')}</p>
                  <A11yOptions />
                </div>
              </section>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Sign in for guests; the name, the user's home page and sign out otherwise. Nothing while the server is offline. */
function MenuAccount({ onDone }: { onDone: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const serverOnline = useAuthStore((s) => s.serverOnline);
  const signOut = useAuthStore((s) => s.signOut);

  if (status === 'loading' || (!user && serverOnline === false)) return null;
  if (!user) {
    return (
      <Link to="/login" className={styles.signIn} onClick={onDone}>
        <LogIn size={18} aria-hidden="true" /> {t('auth.signIn')}
      </Link>
    );
  }
  return (
    <section className={styles.user} aria-label={t('menu.account')}>
      <span className={styles.icon}>
        <UserRound size={18} aria-hidden="true" />
      </span>
      <span className={styles.userText}>
        <strong>{user.displayName}</strong>
        <small>
          {user.login} · {t(`auth.roles.${user.role}`)}
        </small>
      </span>
      <Link to={homeOf(user.role)} className={styles.userLink} onClick={onDone}>
        {t('auth.myPage')}
      </Link>
      <button
        type="button"
        className={styles.userLink}
        onClick={async () => {
          onDone();
          await signOut();
          navigate('/');
        }}
      >
        <LogOut size={15} aria-hidden="true" /> {t('auth.signOut')}
      </button>
    </section>
  );
}
