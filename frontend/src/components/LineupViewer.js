import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Users, Shield, Target } from 'lucide-react';

const LineupViewer = ({ formations }) => {
  if (!formations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lineups & Formations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No lineup data available</p>
        </CardContent>
      </Card>
    );
  }

  const { home_team, away_team } = formations;

  const renderTeamLineup = (team, teamName, isHome = true) => {
    if (!team || !team.formation_detail) return null;

    const formation = team.formation || 'Unknown';
    const players = team.formation_detail || [];

    // Group players by position for better display
    const positionGroups = {
      'Goalkeeper': [],
      'Defense': [],
      'Midfield': [],
      'Attack': []
    };

    players.forEach(player => {
      const position = player.position || '';
      if (position.includes('Goalkeeper') || position === 'GK') {
        positionGroups['Goalkeeper'].push(player);
      } else if (position.includes('Back') || position.includes('Center Back') || position === 'CB' || position === 'RB' || position === 'LB') {
        positionGroups['Defense'].push(player);
      } else if (position.includes('Midfield') || position.includes('Mid') || position === 'CDM' || position === 'CM' || position === 'CAM') {
        positionGroups['Midfield'].push(player);
      } else if (position.includes('Forward') || position.includes('Wing') || position === 'ST' || position === 'RW' || position === 'LW') {
        positionGroups['Attack'].push(player);
      } else {
        // Default to midfield if unsure
        positionGroups['Midfield'].push(player);
      }
    });

    return (
      <div className={`${isHome ? 'bg-blue-50' : 'bg-red-50'} p-4 rounded-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{teamName}</h3>
          <Badge variant={isHome ? "default" : "secondary"} className="text-sm">
            Formation: {formation}
          </Badge>
        </div>

        <div className="space-y-4">
          {Object.entries(positionGroups).map(([positionGroup, groupPlayers]) => {
            if (groupPlayers.length === 0) return null;
            
            return (
              <div key={positionGroup}>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  {positionGroup === 'Goalkeeper' && <Shield className="h-4 w-4" />}
                  {positionGroup === 'Defense' && <Shield className="h-4 w-4" />}
                  {positionGroup === 'Midfield' && <Users className="h-4 w-4" />}
                  {positionGroup === 'Attack' && <Target className="h-4 w-4" />}
                  {positionGroup}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {groupPlayers.map((player, index) => (
                    <div key={index} className="bg-white p-3 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {player.player || 'Unknown Player'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {player.position || 'Unknown Position'}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{player.jersey || 'N/A'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total Players: {players.length}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lineups & Formations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderTeamLineup(home_team, 'Home Team', true)}
        <Separator />
        {renderTeamLineup(away_team, 'Away Team', false)}
      </CardContent>
    </Card>
  );
};

export default LineupViewer;