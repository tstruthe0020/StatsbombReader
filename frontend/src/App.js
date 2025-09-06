import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Trophy, Play
} from 'lucide-react';
import MatchViewer from './components/MatchViewer';
import TacticalAnalysis from './components/TacticalAnalysis';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('match-viewer');

  const renderContent = () => {
    switch (activeTab) {
      case 'match-viewer':
        return <MatchViewer />;
      case 'tactical-analysis':
        return <TacticalAnalysis />;
      default:
        return <MatchViewer />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Soccer Analytics Platform</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span>Advanced Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('match-viewer')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'match-viewer'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Match Viewer
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tactical-analysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'tactical-analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tactical Analysis
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;