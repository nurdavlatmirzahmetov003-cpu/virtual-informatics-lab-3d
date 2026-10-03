import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

// Every page is its own chunk: a lab's scene code loads only when visited.
const HomePage = lazy(() => import('@/pages/Home/HomePage'));
const LabsPage = lazy(() => import('@/pages/Labs/LabsPage'));
const SetupStudioPage = lazy(() => import('@/pages/SetupStudio/SetupStudioPage'));
const ProgressPage = lazy(() => import('@/pages/Progress/ProgressPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFoundPage'));
const CreditsPage = lazy(() => import('@/pages/Credits/CreditsPage'));

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'labs', element: <LabsPage /> },
      { path: 'studio', element: <SetupStudioPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'credits', element: <CreditsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
