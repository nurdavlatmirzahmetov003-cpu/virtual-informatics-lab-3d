/**
 * Admin panel (V2-10): users, live activity (V2-12), feedback and the contact inbox (0.36),
 * schools and classes, learning content texts,
 * security (audit log, login attempts, IP blocks), site settings, backups
 * and system health — as tabs (`?tab=`). The server checks the admin role
 * on every request; every change lands in the audit log.
 */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, DatabaseBackup, Languages, MessageSquareHeart, Radio, School, ShieldAlert, SlidersHorizontal, Users } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { RequireRole } from '../Auth/RequireRole';
import { UsersTab } from './UsersTab';
import { SchoolsTab } from './SchoolsTab';
import { ContentTab } from './ContentTab';
import { SecurityTab } from './SecurityTab';
import { SettingsTab } from './SettingsTab';
import { BackupsTab } from './BackupsTab';
import { HealthTab } from './HealthTab';
import { LiveTab } from './LiveTab';
import { FeedbackTab } from './FeedbackTab';
import cls from '../Classroom/Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const TABS = [
  { id: 'users', icon: Users },
  { id: 'live', icon: Radio },
  { id: 'feedback', icon: MessageSquareHeart },
  { id: 'schools', icon: School },
  { id: 'content', icon: Languages },
  { id: 'security', icon: ShieldAlert },
  { id: 'settings', icon: SlidersHorizontal },
  { id: 'backups', icon: DatabaseBackup },
  { id: 'health', icon: Activity },
] as const;
type TabId = (typeof TABS)[number]['id'];
const isTab = (v: string | null): v is TabId => TABS.some((x) => x.id === v);

function Panel() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab: TabId = isTab(params.get('tab')) ? (params.get('tab') as TabId) : 'users';
  useDocumentTitle(`${t(`admin.tabs.${tab}`)} — ${t('admin.title')}`);
  const go = useCallback((next: TabId) => setParams({ tab: next }), [setParams]);

  return (
    <div className={cls.page}>
      <header className={cls.classHead}>
        <div className={cls.classTitle}>
          <div>
            <span className={auth.eyebrow}>{t('auth.roles.admin')}</span>
            <h1>{t('admin.title')}</h1>
            <p className={cls.muted}>{t('admin.subtitle')}</p>
          </div>
        </div>
        <nav className={cls.tabs} role="tablist" aria-label={t('admin.title')}>
          {TABS.map(({ id, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={cls.tab} onClick={() => go(id)}>
              <Icon size={16} aria-hidden="true" />
              {t(`admin.tabs.${id}`)}
            </button>
          ))}
        </nav>
      </header>
      <div role="tabpanel" className={cls.tabPanel}>
        {tab === 'users' && <UsersTab />}
        {tab === 'live' && <LiveTab />}
        {tab === 'feedback' && <FeedbackTab />}
        {tab === 'schools' && <SchoolsTab />}
        {tab === 'content' && <ContentTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'backups' && <BackupsTab />}
        {tab === 'health' && <HealthTab />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireRole roles={['admin']}>
      <Panel />
    </RequireRole>
  );
}
