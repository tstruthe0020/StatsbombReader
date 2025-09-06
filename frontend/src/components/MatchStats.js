import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  BarChart3, Target, Activity, AlertTriangle, 
  Clock, TrendingUp, Users, Zap 
} from 'lucide-react';

const MatchStats = ({ homeTeam, awayTeam, homeStats, awayStats }) => {
  if (!homeStats || !awayStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Match Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to render stat comparison
  const StatComparison = ({ label, homeValue, awayValue, icon: Icon, unit = '', isPercentage = false, flipColors = false }) => {
    const total = parseFloat(homeValue) + parseFloat(awayValue);
    const homePercent = total > 0 ? (parseFloat(homeValue) / total) * 100 : 50;
    const awayPercent = 100 - homePercent;

    // For stats where lower is better (like fouls), flip the color logic
    const homeIsWinning = flipColors ? homeValue < awayValue : homeValue > awayValue;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className={`font-semibold ${homeIsWinning ? 'text-blue-600' : 'text-gray-700'}`}>
            {homeValue}{unit}
          </div>
          <div className={`font-semibold ${!homeIsWinning ? 'text-red-600' : 'text-gray-700'}`}>
            {awayValue}{unit}
          </div>
        </div>

        {!isPercentage && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${homeIsWinning ? 'bg-blue-500' : 'bg-blue-300'}`}
                style={{ width: `${homePercent}%` }}
              />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${!homeIsWinning ? 'bg-red-500' : 'bg-red-300'}`}
                style={{ width: `${awayPercent}%`, marginLeft: 'auto' }}
              />
            </div>
          </div>
        )}

        {isPercentage && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${homeValue}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const statsConfig = [
    {
      label: 'Possession',
      homeValue: homeStats.possession || 0,
      awayValue: awayStats.possession || 0,
      icon: Users,
      unit: '%',
      isPercentage: true
    },
    {
      label: 'Passes',
      homeValue: homeStats.passes || 0,
      awayValue: awayStats.passes || 0,
      icon: Activity
    },
    {
      label: 'Pass Accuracy',
      homeValue: homeStats.pass_accuracy || 0,
      awayValue: awayStats.pass_accuracy || 0,
      icon: Target,
      unit: '%'
    },
    {
      label: 'Shots',
      homeValue: homeStats.shots || 0,
      awayValue: awayStats.shots || 0,
      icon: Target
    },
    {
      label: 'Shots on Target',
      homeValue: homeStats.shots_on_target || 0,
      awayValue: awayStats.shots_on_target || 0,
      icon: Target
    },
    {
      label: 'Corners',
      homeValue: homeStats.corners || 0,
      awayValue: awayStats.corners || 0,
      icon: TrendingUp
    },
    {
      label: 'Fouls Committed',
      homeValue: homeStats.fouls_committed || 0,
      awayValue: awayStats.fouls_committed || 0,
      icon: AlertTriangle,
      flipColors: true
    },
    {
      label: 'Yellow Cards',
      homeValue: homeStats.yellow_cards || 0,
      awayValue: awayStats.yellow_cards || 0,
      icon: Clock,
      flipColors: true
    },
    {
      label: 'Red Cards',
      homeValue: homeStats.red_cards || 0,
      awayValue: awayStats.red_cards || 0,
      icon: AlertTriangle,
      flipColors: true
    },
    {
      label: 'Attacks',
      homeValue: homeStats.attacks || 0,
      awayValue: awayStats.attacks || 0,
      icon: Zap
    },
    {
      label: 'Dangerous Attacks',
      homeValue: homeStats.dangerous_attacks || 0,
      awayValue: awayStats.dangerous_attacks || 0,
      icon: Zap
    },
    {
      label: 'Offsides',
      homeValue: homeStats.offsides || 0,
      awayValue: awayStats.offsides || 0,
      icon: AlertTriangle,
      flipColors: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Match Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Team Headers */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <Badge variant="default" className="mb-2">Home</Badge>
            <h3 className="font-semibold text-blue-600">{homeTeam}</h3>
          </div>
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">Away</Badge>
            <h3 className="font-semibold text-red-600">{awayTeam}</h3>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Statistics */}
        <div className="space-y-6">
          {statsConfig.map((stat, index) => (
            <StatComparison
              key={index}
              label={stat.label}
              homeValue={stat.homeValue}
              awayValue={stat.awayValue}
              icon={stat.icon}
              unit={stat.unit}
              isPercentage={stat.isPercentage}
              flipColors={stat.flipColors}
            />
          ))}
        </div>

        {/* Summary Section */}
        <Separator className="my-6" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="font-semibold text-blue-600">{homeTeam}</div>
            <div className="text-xs text-gray-600 mt-1">
              {homeStats.shots || 0} shots, {homeStats.fouls_committed || 0} fouls
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="font-semibold text-red-600">{awayTeam}</div>
            <div className="text-xs text-gray-600 mt-1">
              {awayStats.shots || 0} shots, {awayStats.fouls_committed || 0} fouls
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchStats;