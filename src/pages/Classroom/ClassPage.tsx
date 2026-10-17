/**
 * One class, for its teacher (V2-9): journal (scores and grading), students,
 * assignments, announcements, messages and statistics, as tabs (`?tab=`).
 * The class detail loads once and reloads after every change.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, ClipboardList, Megaphone, MessagesSquare, QrCode as QrIcon, Swords, Table2, Users } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { teacherApi, type ClassDetail, type Credential } from '@/services/classroom/api';
import { RequireRole } from '../Auth/RequireRole';
import { CredentialSheet } from './CredentialSheet';
import { JoinInfo } from './JoinInfo';
import { JournalTab } from './JournalTab';
import { StudentsTab } from './StudentsTab';
import { AssignmentsTab } from './AssignmentsTab';
import { AnnouncementsTab } from './AnnouncementsTab';
import { MessagesTab } from './MessagesTab';
import { StatsTab } from './StatsTab';
import { ContestsTab } from './ContestsTab';
import { Modal } from './parts';
import { useErrorText } from './hooks';
import styles from './Classroom.module.css';
import auth from '../Auth/Auth.module.css';

const TABS = [
  { id: 'journal', icon: Table2 },
  { id: 'students', icon: Users },
  { id: 'assignments', icon: ClipboardList },
  { id: 'announcements', icon: Megaphone },
  { id: 'messages', icon: MessagesSquare },
  { id: 'stats', icon: BarChart3 },
  { id: 'contests', icon: Swords },
] as const;
export type TabId = (typeof TABS)[number]['id'];
const isTab = (v: string | null): v is TabId => TABS.some((x) => x.id === v);

export interface TabProps {
  detail: ClassDetail;
  reload: () => void;
  /** Opens another tab (with extra query params, e.g. the messages of one student). */
  go: (tab: TabId, extra?: Record<string, string>) => void;
  /** Shows freshly generated logins and passwords above the tabs. */
  showCredentials: (c: Credential[]) => void;
}

function ClassView() {
  const t = useT();
  const errorText = useErrorText();
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab: TabId = isTab(params.get('tab')) ? (params.get('tab') as TabId) : 'journal';
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  useDocumentTitle(detail?.class.name ?? t('classroom.teacher.title'));

  const reload = useCallback(() => {
    teacherApi
      .detail(id)
      .then((d) => {
        setDetail(d);
        setError(null);
      })
      .catch((e) => setError(errorText(e)));
  }, [id, errorText]);
  useEffect(reload, [reload]);

  const go = useCallback((next: TabId, extra: Record<string, string> = {}) => setParams({ tab: next, ...extra }), [setParams]);
  const closeJoin = useCallback(() => setJoinOpen(false), []);

  if (error && !detail) {
    return (
      <div className={auth.page}>
        <div className={auth.card}>
          <p className={auth.error} role="alert">
            {error}
          </p>
          <Link to="/teacher" className={auth.secondary}>
            <ArrowLeft size={16} aria-hidden="true" /> {t('classroom.class.back')}
          </Link>
        </div>
      </div>
    );
  }
  if (!detail) return <div className={styles.page} aria-busy="true" />;

  const unread = Object.values(detail.unread).reduce((a, b) => a + b, 0);
  const tabProps: TabProps = { detail, reload, go, showCredentials: setCredentials };

  return (
    <div className={styles.page}>
      <header className={styles.classHead}>
        <Link to="/teacher" className={styles.back}>
          <ArrowLeft size={15} aria-hidden="true" /> {t('classroom.class.back')}
        </Link>
        <div className={styles.classTitle}>
          <div>
            <span className={auth.eyebrow}>{t('classroom.class.eyebrow')}</span>
            <h1>{detail.class.name}</h1>
            <p className={styles.muted}>
              {t('classroom.teacher.studentsN', { n: detail.students.length })} · {t('classroom.teacher.assignmentsN', { n: detail.assignments.length })}
            </p>
          </div>
          <button type="button" className={styles.codeButton} onClick={() => setJoinOpen(true)}>
            <QrIcon size={18} aria-hidden="true" />
            <span>
              <small>{t('classroom.class.code')}</small>
              <b>{detail.class.joinCode}</b>
            </span>
          </button>
        </div>
        <nav className={styles.tabs} role="tablist" aria-label={t('classroom.class.tabs')}>
          {TABS.map(({ id: tabId, icon: Icon }) => (
            <button key={tabId} type="button" role="tab" aria-selected={tab === tabId} className={styles.tab} onClick={() => go(tabId)}>
              <Icon size={16} aria-hidden="true" />
              {t(`classroom.tabs.${tabId}`)}
              {tabId === 'messages' && unread > 0 && <span className={styles.badge}>{unread}</span>}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p className={auth.error} role="alert">
          {error}
        </p>
      )}
      {credentials && <CredentialSheet className={detail.class.name} credentials={credentials} onClose={() => setCredentials(null)} />}

      <div role="tabpanel" className={styles.tabPanel}>
        {tab === 'journal' && <JournalTab {...tabProps} />}
        {tab === 'students' && <StudentsTab {...tabProps} />}
        {tab === 'assignments' && <AssignmentsTab {...tabProps} />}
        {tab === 'announcements' && <AnnouncementsTab {...tabProps} />}
        {tab === 'messages' && <MessagesTab {...tabProps} />}
        {tab === 'stats' && <StatsTab {...tabProps} />}
        {tab === 'contests' && <ContestsTab {...tabProps} />}
      </div>

      {joinOpen && (
        <Modal title={t('classroom.join.title')} onClose={closeJoin}>
          <JoinInfo detail={detail} reload={reload} />
        </Modal>
      )}
    </div>
  );
}

export default function ClassPage() {
  return (
    <RequireRole roles={['teacher', 'admin']}>
      <ClassView />
    </RequireRole>
  );
}
