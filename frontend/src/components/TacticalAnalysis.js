import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react';
import MatchBreakdown from './MatchBreakdown';
import TeamBreakdown from './TeamBreakdown';

const TacticalAnalysis = () => {
  const [activeTab, setActiveTab] = useState('match');

  const renderContent = () => {
    switch (activeTab) {
      case 'match':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Match Tactical Breakdown
              </CardTitle>
              <p className="text-sm text-gray-600">
                Detailed analysis of tactical approaches, categorization statistics, and archetype derivation for specific matches
              </p>
            </CardHeader>
            <CardContent>
              <MatchBreakdown />
            </CardContent>
          </Card>
        );
      case 'team':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Tactical Analysis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Analyze team tactical consistency, evolution, and performance across recent matches
              </p>
            </CardHeader>
            <CardContent>
              <TeamBreakdown />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Tactical Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Detailed breakdowns of tactical approaches, categorization models, and team analysis
          </p>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('match')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'match'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Match Breakdown
              </div>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Breakdown
              </div>
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TacticalAnalysis;