import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { FiltersBar } from '../components';
import { useFilters } from '../state';
import { useTeamsList, useRefereesList } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Target, BarChart3, Brain, FileText, Zap } from 'lucide-react';

const OverviewPage: React.FC = () => {
  const filters = useFilters();
  const navigate = useNavigate();
  
  const { data: teams } = useTeamsList(filters.season);
  const { data: referees } = useRefereesList(filters.season);

  const stats = {
    teams: teams?.length || 0,
    referees: referees?.length || 0,
    matches: teams?.reduce((sum, team) => sum + team.matches, 0) || 0,
    avgFoulsPerMatch: teams?.length ? 
      teams.reduce((sum, team) => sum + team.discipline.fouls_per_90, 0) / teams.length : 0
  };

  const quickLinks = [
    {
      title: 'Browse Teams',
      description: 'Explore team playstyles and discipline records',
      icon: Users,
      href: '/analysis/ref-discipline/teams',
      color: 'blue'
    },
    {
      title: 'Browse Referees',
      description: 'Analyze referee tendencies and biases',
      icon: Target,
      href: '/analysis/ref-discipline/referees',
      color: 'green'
    },
    {
      title: 'What-If Lab',
      description: 'Experiment with playstyle adjustments',
      icon: Brain,
      href: '/analysis/ref-discipline/lab',
      color: 'purple'
    },
    {
      title: 'Generate Reports',
      description: 'Create custom analysis reports',
      icon: FileText,
      href: '/analysis/ref-discipline/reports',
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Referee-Discipline Analysis
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Understand how team playstyles affect disciplinary outcomes by referee, 
          with spatial zone analysis and predictive modeling.
        </p>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-900">{stats.teams}</div>
            <div className="text-sm text-blue-700">Teams Analyzed</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-900">{stats.referees}</div>
            <div className="text-sm text-green-700">Referees Tracked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-900">{stats.matches}</div>
            <div className="text-sm text-purple-700">Total Matches</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-900">
              {stats.avgFoulsPerMatch.toFixed(1)}
            </div>
            <div className="text-sm text-red-700">Avg Fouls/90</div>
          </CardContent>
        </Card>
      </div>

      {/* System Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>System Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Playstyle Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  Pressing intensity (PPDA) measurement
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Possession patterns and directness metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  Channel usage and wing play analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  Transition and counter-attack patterns
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Discipline Modeling</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Spatial zone-wise foul distribution ({filters.grid} grid)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  Card frequency and severity analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  Referee bias detection and quantification
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full" />
                  Predictive modeling with confidence intervals
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Card
              key={link.href}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${getColorClasses(link.color)}`}
              onClick={() => navigate(link.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{link.title}</h3>
                    <p className="text-sm opacity-90 mb-4">{link.description}</p>
                    <Button variant="outline" size="sm" className="bg-white/50">
                      Get Started →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Season Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader>
          <CardTitle>Season {filters.season} Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filters.grid}
              </div>
              <div className="text-sm text-gray-600">Spatial Grid Resolution</div>
              <div className="text-xs text-gray-500 mt-1">
                {filters.grid === '5x3' ? '15 zones total' : '24 zones total'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 capitalize">
                {filters.exposure.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-600">Exposure Metric</div>
              <div className="text-xs text-gray-500 mt-1">
                Normalizes foul rates
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 capitalize">
                {filters.gameState}
              </div>
              <div className="text-sm text-gray-600">Game State Filter</div>
              <div className="text-xs text-gray-500 mt-1">
                {filters.gameState === 'all' ? 'All situations' : `When ${filters.gameState}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPage;