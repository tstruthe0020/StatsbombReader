import React from 'react';
import { FiltersBar, ReportBuilder } from '../components';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
        <p className="text-gray-600">
          Generate custom analysis reports combining team playstyles and referee tendencies
        </p>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* Report Builder */}
      <ReportBuilder />
    </div>
  );
};

export default ReportsPage;