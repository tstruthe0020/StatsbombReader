import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Brain, TrendingUp, Target, Activity, Zap, Settings } from 'lucide-react';

const TacticalProfile = ({ homeTeam, awayTeam, matchId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Tactical Profiles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Home Team Profile */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-800">{homeTeam}</h3>
              <Badge variant="default">Home</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Playstyle</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div>Possession: <span className="font-medium">Coming Soon</span></div>
                  <div>Pressing: <span className="font-medium">Coming Soon</span></div>
                  <div>Tempo: <span className="font-medium">Coming Soon</span></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Attacking</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div>Width: <span className="font-medium">Coming Soon</span></div>
                  <div>Directness: <span className="font-medium">Coming Soon</span></div>
                  <div>Creativity: <span className="font-medium">Coming Soon</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Away Team Profile */}
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-red-800">{awayTeam}</h3>
              <Badge variant="secondary">Away</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Playstyle</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div>Possession: <span className="font-medium">Coming Soon</span></div>
                  <div>Pressing: <span className="font-medium">Coming Soon</span></div>
                  <div>Tempo: <span className="font-medium">Coming Soon</span></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Attacking</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div>Width: <span className="font-medium">Coming Soon</span></div>
                  <div>Directness: <span className="font-medium">Coming Soon</span></div>
                  <div>Creativity: <span className="font-medium">Coming Soon</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">Tactical Comparison</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Advanced tactical analysis will be available here, including:
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>• Team pressing intensity and patterns</li>
                <li>• Possession-based metrics and directness</li>
                <li>• Attacking width and channel usage</li>
                <li>• Defensive organization and transitions</li>
                <li>• Set piece effectiveness</li>
              </ul>
              
              <Button variant="outline" size="sm" disabled className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure Analysis
              </Button>
            </div>
          </div>

          {/* Quick Stats Preview */}
          <div className="border-t pt-4">
            <div className="text-xs text-gray-500 mb-2">Match ID: {matchId}</div>
            <div className="text-xs text-gray-400">
              This section will integrate with the referee-playstyle-discipline analytics module 
              to provide detailed tactical insights and team behavior patterns.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TacticalProfile;