import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

// Every page is its own chunk: a lab's scene code loads only when visited.
const HomePage = lazy(() => import('@/pages/Home/HomePage'));
const LabsPage = lazy(() => import('@/pages/Labs/LabsPage'));
const SetupStudioPage = lazy(() => import('@/pages/SetupStudio/SetupStudioPage'));
const SetupSummaryPage = lazy(() => import('@/pages/SetupStudio/SetupSummaryPage'));
const ProgressPage = lazy(() => import('@/pages/Progress/ProgressPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFoundPage'));
const CreditsPage = lazy(() => import('@/pages/Credits/CreditsPage'));
const ExplorerPage = lazy(() => import('@/pages/Explorer/ExplorerPage'));
const AssemblyLabPage = lazy(() => import('@/pages/Labs/AssemblyLab/AssemblyLabPage'));
const ConnectLabPage = lazy(() => import('@/pages/Labs/ConnectLab/ConnectLabPage'));
const SystemSimPage = lazy(() => import('@/pages/Labs/SystemSim/SystemSimPage'));
const NetworkLabPage = lazy(() => import('@/pages/Labs/NetworkLab/NetworkLabPage'));
const AlgorithmLabPage = lazy(() => import('@/pages/Labs/AlgorithmLab/AlgorithmLabPage'));
const LogicLabPage = lazy(() => import('@/pages/Labs/LogicLab/LogicLabPage'));
const ExperimentLabPage = lazy(() => import('@/pages/Labs/ExperimentLab/ExperimentLabPage'));
const TasksPage = lazy(() => import('@/pages/Tasks/TasksPage'));
const LabPage = lazy(() => import('@/pages/Lab/LabPage'));
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const TeacherHome = lazy(() => import('@/pages/Classroom/TeacherHome'));
const ClassPage = lazy(() => import('@/pages/Classroom/ClassPage'));
const StudentHome = lazy(() => import('@/pages/Classroom/StudentHome'));
const JoinPage = lazy(() => import('@/pages/Classroom/JoinPage'));
const AdminPage = lazy(() => import('@/pages/Auth/AdminPage'));

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'lab', element: <LabPage /> },
      { path: 'labs', element: <LabsPage /> },
      { path: 'labs/assembly', element: <AssemblyLabPage /> },
      { path: 'labs/network', element: <NetworkLabPage /> },
      { path: 'labs/connect', element: <ConnectLabPage /> },
      { path: 'labs/sim', element: <SystemSimPage /> },
      { path: 'labs/algorithms', element: <AlgorithmLabPage /> },
      { path: 'labs/logic', element: <LogicLabPage /> },
      { path: 'labs/experiments', element: <ExperimentLabPage /> },
      { path: 'assignments', element: <TasksPage /> },
      { path: 'explorer', element: <ExplorerPage /> },
      { path: 'studio', element: <SetupStudioPage /> },
      { path: 'studio/summary', element: <SetupSummaryPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'credits', element: <CreditsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'teacher', element: <TeacherHome /> },
      { path: 'teacher/class/:id', element: <ClassPage /> },
      { path: 'student', element: <StudentHome /> },
      { path: 'join', element: <JoinPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
