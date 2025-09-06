/**
 * Referee Discipline Analysis Module
 * Route registration and feature flag exports
 */

import { lazy } from 'react';

// Feature flag check
export const isRefDisciplineEnabled = () => {
  // Check environment variable or feature flag
  return process.env.REACT_APP_REF_DISCIPLINE_ENABLED === 'true' || 
         window.localStorage.getItem('feature.refDiscipline') === 'true';
};

// Lazy-loaded components for code splitting
export const OverviewPage = lazy(() => import('./pages/OverviewPage'));
export const TeamsPage = lazy(() => import('./pages/TeamsPage'));
export const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage'));
export const RefereesPage = lazy(() => import('./pages/RefereesPage'));
export const RefDetailPage = lazy(() => import('./pages/RefDetailPage'));
export const LabPage = lazy(() => import('./pages/LabPage'));
export const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// Route configuration
export const refDisciplineRoutes = [
  {
    path: '/analysis/ref-discipline',
    component: OverviewPage,
    exact: true
  },
  {
    path: '/analysis/ref-discipline/teams',
    component: TeamsPage,
    exact: true
  },
  {
    path: '/analysis/ref-discipline/teams/:teamId',
    component: TeamDetailPage
  },
  {
    path: '/analysis/ref-discipline/referees',
    component: RefereesPage,
    exact: true
  },
  {
    path: '/analysis/ref-discipline/referees/:refId',
    component: RefDetailPage
  },
  {
    path: '/analysis/ref-discipline/lab',
    component: LabPage
  },
  {
    path: '/analysis/ref-discipline/reports',
    component: ReportsPage
  }
];

// Module exports
export * from './state';
export * from './hooks';
export * from './components';
export * from './types';