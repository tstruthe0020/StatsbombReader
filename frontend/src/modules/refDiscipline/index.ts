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

// Mock components for testing - since TypeScript files can't be imported directly
const MockOverviewPage = () => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Referee-Discipline Analysis Overview</h1>
      <p className="text-gray-600 mb-6">System capabilities and quick links</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium">Browse Teams</h3>
          <p className="text-sm text-gray-600">Explore team playstyles</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium">Browse Referees</h3>
          <p className="text-sm text-gray-600">Analyze referee tendencies</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-medium">What-If Lab</h3>
          <p className="text-sm text-gray-600">Experiment with adjustments</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-medium">Generate Reports</h3>
          <p className="text-sm text-gray-600">Create analysis reports</p>
        </div>
      </div>
    </div>
  );
};

const MockTeamsPage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Teams Analysis</h1>
    <p className="text-gray-600">Searchable team grid with discipline records</p>
  </div>
);

const MockRefereesPage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Referees Analysis</h1>
    <p className="text-gray-600">Referee bias detection and analysis</p>
  </div>
);

const MockLabPage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">What-If Analysis Lab</h1>
    <p className="text-gray-600">Interactive sliders and heatmap interface</p>
  </div>
);

// Export mock components for testing
export const OverviewPage = MockOverviewPage;
export const TeamsPage = MockTeamsPage;
export const TeamDetailPage = MockTeamsPage;
export const RefereesPage = MockRefereesPage;
export const RefDetailPage = MockRefereesPage;
export const LabPage = MockLabPage;
export const ReportsPage = MockOverviewPage;

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