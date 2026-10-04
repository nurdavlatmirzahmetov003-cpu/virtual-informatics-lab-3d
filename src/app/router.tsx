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
const PcAssemblyPage = lazy(() => import('@/pages/Labs/PcAssemblyPage'));
const NetworkLabPage = lazy(() => import('@/pages/Labs/NetworkLab/NetworkLabPage'));
const AlgorithmLabPage = lazy(() => import('@/pages/Labs/AlgorithmLab/AlgorithmLabPage'));
const LogicLabPage = lazy(() => import('@/pages/Labs/LogicLab/LogicLabPage'));
const ExperimentsPage = lazy(() => import('@/pages/Labs/ExperimentsPage'));
const AssignmentsPage = lazy(() => import('@/pages/Labs/AssignmentsPage'));

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'labs', element: <LabsPage /> },
      { path: 'labs/assembly', element: <PcAssemblyPage /> },
      { path: 'labs/network', element: <NetworkLabPage /> },
      { path: 'labs/algorithms', element: <AlgorithmLabPage /> },
      { path: 'labs/logic', element: <LogicLabPage /> },
      { path: 'labs/experiments', element: <ExperimentsPage /> },
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'explorer', element: <ExplorerPage /> },
      { path: 'studio', element: <SetupStudioPage /> },
      { path: 'studio/summary', element: <SetupSummaryPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'credits', element: <CreditsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
