import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Users } from 'lucide-react';

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

  // Function to get player positions based on formation
  const getFormationPositions = (formation, players) => {
    if (!formation || !players || players.length === 0) return {};

    console.log(`Formation: ${formation}, Players count: ${players.length}`);
    console.log('Players:', players.map(p => ({ name: p.player, position: p.position })));

    // Position mappings for different formations
    const formationLayouts = {
      '4-3-3': {
        goalkeeper: [{ x: 50, y: 90 }],
        defense: [{ x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 }],
        midfield: [{ x: 25, y: 55 }, { x: 50, y: 55 }, { x: 75, y: 55 }],
        attack: [{ x: 20, y: 25 }, { x: 50, y: 20 }, { x: 80, y: 25 }]
      },
      '4-2-3-1': {
        goalkeeper: [{ x: 50, y: 90 }],
        defense: [{ x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 }],
        midfield: [{ x: 35, y: 60 }, { x: 65, y: 60 }, { x: 25, y: 40 }, { x: 50, y: 40 }, { x: 75, y: 40 }],
        attack: [{ x: 50, y: 20 }]
      },
      '3-5-2': {
        goalkeeper: [{ x: 50, y: 90 }],
        defense: [{ x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 }],
        midfield: [{ x: 15, y: 55 }, { x: 35, y: 55 }, { x: 50, y: 55 }, { x: 65, y: 55 }, { x: 85, y: 55 }],
        attack: [{ x: 40, y: 25 }, { x: 60, y: 25 }]
      },
      '4-4-2': {
        goalkeeper: [{ x: 50, y: 90 }],
        defense: [{ x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 }],
        midfield: [{ x: 20, y: 55 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 55 }],
        attack: [{ x: 40, y: 25 }, { x: 60, y: 25 }]
      },
      '3-4-3': {
        goalkeeper: [{ x: 50, y: 90 }],
        defense: [{ x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 }],
        midfield: [{ x: 20, y: 55 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 55 }],
        attack: [{ x: 25, y: 25 }, { x: 50, y: 20 }, { x: 75, y: 25 }]
      }
    };

    const layout = formationLayouts[formation] || formationLayouts['4-3-3'];
    const positionedPlayers = {};

    // More comprehensive position grouping
    const groupedPlayers = {
      goalkeeper: [],
      defense: [],
      midfield: [],
      attack: []
    };

    players.forEach(player => {
      const position = (player.position || '').toLowerCase();
      
      // Goalkeeper detection
      if (position.includes('goalkeeper') || position === 'gk' || position.includes('keeper')) {
        groupedPlayers.goalkeeper.push(player);
      }
      // Defense detection (more comprehensive)
      else if (
        position.includes('back') || 
        position.includes('defender') || 
        position.includes('defence') ||
        position === 'cb' || position === 'rb' || position === 'lb' ||
        position === 'rcb' || position === 'lcb' ||
        position === 'rwb' || position === 'lwb'
      ) {
        groupedPlayers.defense.push(player);
      }
      // Attack detection (more comprehensive)
      else if (
        position.includes('forward') || 
        position.includes('striker') ||
        position.includes('wing') ||
        position === 'st' || position === 'cf' ||
        position === 'rw' || position === 'lw' ||
        position === 'rf' || position === 'lf'
      ) {
        groupedPlayers.attack.push(player);
      }
      // Midfield detection (more comprehensive) 
      else if (
        position.includes('midfield') || 
        position.includes('mid') ||
        position === 'cdm' || position === 'cm' || position === 'cam' ||
        position === 'dm' || position === 'am' ||
        position === 'rm' || position === 'lm' ||
        position.includes('defensive midfield') ||
        position.includes('attacking midfield') ||
        position.includes('center midfield') ||
        position.includes('centre midfield')
      ) {
        groupedPlayers.midfield.push(player);
      }
      // Default: assign unknown positions to midfield
      else {
        console.log(`Unknown position "${player.position}" for player ${player.player}, assigning to midfield`);
        groupedPlayers.midfield.push(player);
      }
    });

    console.log('Grouped players:', {
      goalkeeper: groupedPlayers.goalkeeper.length,
      defense: groupedPlayers.defense.length,
      midfield: groupedPlayers.midfield.length,
      attack: groupedPlayers.attack.length
    });

    // Smart assignment with overflow handling
    let unassignedPlayers = [];

    Object.keys(layout).forEach(positionGroup => {
      const positions = layout[positionGroup];
      const playersInGroup = groupedPlayers[positionGroup] || [];
      
      // Assign players to available positions
      positions.forEach((pos, index) => {
        if (playersInGroup[index]) {
          if (!positionedPlayers[positionGroup]) positionedPlayers[positionGroup] = [];
          positionedPlayers[positionGroup].push({
            ...playersInGroup[index],
            x: pos.x,
            y: pos.y
          });
        }
      });

      // Collect overflow players
      if (playersInGroup.length > positions.length) {
        unassignedPlayers.push(...playersInGroup.slice(positions.length));
      }
    });

    // Handle unassigned players by placing them in midfield area
    if (unassignedPlayers.length > 0) {
      console.log(`${unassignedPlayers.length} unassigned players, placing in midfield`);
      
      if (!positionedPlayers.midfield) positionedPlayers.midfield = [];
      
      // Create additional midfield positions for overflow players
      const extraPositions = [
        { x: 30, y: 65 }, { x: 70, y: 65 }, // Additional defensive mid positions
        { x: 40, y: 35 }, { x: 60, y: 35 }, // Additional attacking mid positions
        { x: 50, y: 50 }, // Central position
      ];

      unassignedPlayers.forEach((player, index) => {
        const pos = extraPositions[index % extraPositions.length];
        positionedPlayers.midfield.push({
          ...player,
          x: pos.x,
          y: pos.y
        });
      });
    }

    // Final count check
    const totalPositioned = Object.values(positionedPlayers).reduce((sum, group) => sum + group.length, 0);
    console.log(`Total players positioned: ${totalPositioned} out of ${players.length}`);

    return positionedPlayers;
  };

  const renderFormation = (team, teamName, isHome = true) => {
    if (!team || !team.formation_detail) return null;

    const formation = team.formation || 'Unknown';
    const players = team.formation_detail || [];
    const positionedPlayers = getFormationPositions(formation, players);

    return (
      <div className={`${isHome ? 'bg-blue-50' : 'bg-red-50'} p-4 rounded-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{teamName}</h3>
          <Badge variant={isHome ? "default" : "secondary"} className="text-sm">
            Formation: {formation}
          </Badge>
        </div>

        <div className="relative bg-green-400 rounded-lg" style={{ aspectRatio: '3/4', height: '500px' }}>
          {/* Field markings */}
          <div className="absolute inset-0">
            {/* Center line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white transform -translate-y-0.5"></div>
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Goal areas */}
            <div className="absolute left-1/2 bottom-0 w-20 h-8 border-2 border-white border-b-0 transform -translate-x-1/2"></div>
            <div className="absolute left-1/2 top-0 w-20 h-8 border-2 border-white border-t-0 transform -translate-x-1/2"></div>
            
            {/* Penalty areas */}
            <div className="absolute left-1/2 bottom-0 w-40 h-16 border-2 border-white border-b-0 transform -translate-x-1/2"></div>
            <div className="absolute left-1/2 top-0 w-40 h-16 border-2 border-white border-t-0 transform -translate-x-1/2"></div>
          </div>

          {/* Players */}
          {Object.entries(positionedPlayers).map(([positionGroup, groupPlayers]) =>
            groupPlayers.map((player, index) => (
              <div
                key={`${positionGroup}-${index}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                  isHome ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  {player.jersey || '?'}
                </div>
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-800 bg-white/95 px-2 py-1 rounded shadow-sm whitespace-nowrap max-w-24 truncate">
                  {player.player ? (
                    player.player.length > 12 
                      ? player.player.split(' ').slice(-1)[0] // Show last name if too long
                      : player.player.split(' ').slice(0, 2).join(' ') // Show first two names
                  ) : 'Unknown'}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Total Players: {players.length}
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
        {renderFormation(home_team, 'Home Team', true)}
        <Separator />
        {renderFormation(away_team, 'Away Team', false)}
      </CardContent>
    </Card>
  );
};

export default LineupViewer;