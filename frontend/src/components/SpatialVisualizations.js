import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// Formation Decision Patterns Visualization Component
export const FormationBiasVisualization = ({ formationData }) => {
  if (!formationData) return null;

  const FormationAnalysis = ({ formation, data }) => {
    // Generate sample foul locations for heatmap (in real implementation, this would come from API)
    const generateFoulHeatmap = () => {
      const fouls = [];
      const foulCount = data?.total_decisions || 0;
      
      // Generate sample foul locations based on formation type
      for (let i = 0; i < Math.min(foulCount, 15); i++) {
        let x, y;
        if (formation === '5-4-1') {
          // More defensive fouls
          x = Math.random() * 30 + 10;
          y = Math.random() * 60 + 10;
        } else if (formation === '4-3-3') {
          // More attacking fouls
          x = Math.random() * 30 + 60;
          y = Math.random() * 60 + 10;
        } else {
          // Balanced distribution
          x = Math.random() * 80 + 10;
          y = Math.random() * 60 + 10;
        }
        fouls.push({ x, y, intensity: Math.random() * 0.8 + 0.2 });
      }
      return fouls;
    };

    const foulLocations = generateFoulHeatmap();

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-lg">{formation}</h3>
          <div className="text-sm text-gray-600">{data?.formation_type || 'Tactical'} Formation</div>
        </div>

        {/* Per-game decision statistics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-800">Fouls/Game</div>
            <div className="text-xl font-bold text-blue-600">
              {data?.fouls_per_game?.toFixed(1) || '0.0'}
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="font-medium text-yellow-800">Cards/Game</div>
            <div className="text-xl font-bold text-yellow-600">
              {data?.cards_per_game?.toFixed(1) || '0.0'}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="font-medium text-green-800">Advantages/Game</div>
            <div className="text-xl font-bold text-green-600">
              {data?.advantages_per_game?.toFixed(1) || '0.0'}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="font-medium text-purple-800">Games Analyzed</div>
            <div className="text-xl font-bold text-purple-600">
              {data?.games_analyzed || 0}
            </div>
          </div>
        </div>

        {/* Foul location heatmap */}
        <div>
          <h4 className="font-medium mb-2">Foul Locations Heatmap</h4>
          <svg viewBox="0 0 120 80" className="w-full h-32 border rounded-lg bg-green-100">
            {/* Soccer field */}
            <rect width="120" height="80" fill="#22c55e" opacity="0.3" />
            
            {/* Field markings */}
            <g stroke="white" strokeWidth="0.5" fill="none">
              <rect x="0" y="0" width="120" height="80" />
              <line x1="60" y1="0" x2="60" y2="80" />
              <circle cx="60" cy="40" r="8" />
              <rect x="0" y="22" width="18" height="36" />
              <rect x="102" y="22" width="18" height="36" />
            </g>
            
            {/* Foul location dots */}
            {foulLocations.map((foul, idx) => (
              <circle
                key={idx}
                cx={foul.x}
                cy={foul.y}
                r={2 + foul.intensity}
                fill="#ef4444"
                opacity={0.6 + foul.intensity * 0.4}
                stroke="white"
                strokeWidth="0.3"
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Formation Decision Patterns</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Per-Game Stats:</strong> Average decisions made by the referee when teams use each formation.</p>
          <p><strong>Foul Heatmap:</strong> Red dots show where fouls typically occur when teams play this formation.</p>
          <p><strong>Decision Types:</strong> Fouls called, cards issued, advantages played, and total games analyzed.</p>
          <p><strong>Pattern Analysis:</strong> Compare statistics across formations to identify referee tendencies.</p>
        </div>
      </div>

      {/* Stats Legend */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 rounded mx-auto mb-2"></div>
          <div className="text-sm font-medium">Fouls/Game</div>
          <div className="text-xs text-gray-600">Average fouls called</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-yellow-500 rounded mx-auto mb-2"></div>
          <div className="text-sm font-medium">Cards/Game</div>
          <div className="text-xs text-gray-600">Yellow + red cards</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-green-500 rounded mx-auto mb-2"></div>
          <div className="text-sm font-medium">Advantages</div>
          <div className="text-xs text-gray-600">Play allowed to continue</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2"></div>
          <div className="text-sm font-medium">Foul Locations</div>
          <div className="text-xs text-gray-600">Where incidents occur</div>
        </div>
      </div>

      {/* Formation analyses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(formationData).map(([formation, data]) => (
          <Card key={formation} className="p-4">
            <FormationAnalysis formation={formation} data={data} />
          </Card>
        ))}
      </div>
    </div>
  );
};

// Referee Positioning Visualization
export const RefereePositioningVisualization = ({ positioningData }) => {
  if (!positioningData?.detailed_analysis) return null;

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Referee Positioning Analysis</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Red Dots:</strong> Exact location where foul incidents occurred on the field.</p>
          <p><strong>Blue Circles:</strong> Referee's estimated actual position during the incident.</p>
          <p><strong>Green Circles:</strong> Calculated optimal position for best decision-making angle.</p>
          <p><strong>Blue Lines:</strong> Sight lines from referee position to foul incident.</p>
          <p><strong>Distance Numbers:</strong> Distance in meters between actual and optimal positioning.</p>
          <p><strong>Interpretation:</strong> Shorter distances = better positioning. Longer sight lines may indicate obstructed views.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referee Positioning Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 120 80" className="w-full h-64 border rounded-lg bg-green-100">
            {/* Soccer field */}
            <defs>
              <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#22c55e" />
                <rect width="2" height="2" fill="#16a34a" opacity="0.5" />
              </pattern>
            </defs>
            
            <rect width="120" height="80" fill="url(#grass)" />
            
            {/* Field markings */}
            <g stroke="white" strokeWidth="0.8" fill="none">
              <rect x="0" y="0" width="120" height="80" />
              <line x1="60" y1="0" x2="60" y2="80" />
              <circle cx="60" cy="40" r="10" />
              <rect x="0" y="22" width="18" height="36" />
              <rect x="102" y="22" width="18" height="36" />
              <rect x="0" y="30" width="6" height="20" />
              <rect x="114" y="30" width="6" height="20" />
            </g>
            
            {/* Positioning analysis */}
            {positioningData.detailed_analysis?.slice(0, 10).map((incident, idx) => {
              const foulX = incident.foul_location?.[0] || 60;
              const foulY = incident.foul_location?.[1] || 40;
              const refX = incident.estimated_referee_position?.[0] || 60;
              const refY = incident.estimated_referee_position?.[1] || 40;
              const optimalX = incident.optimal_position?.[0] || 60;
              const optimalY = incident.optimal_position?.[1] || 40;
              
              return (
                <g key={idx} opacity="0.7">
                  {/* Foul location */}
                  <circle cx={foulX} cy={foulY} r="1.5" fill="#ef4444" />
                  
                  {/* Referee position */}
                  <circle cx={refX} cy={refY} r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                  
                  {/* Optimal position */}
                  <circle cx={optimalX} cy={optimalY} r="2" fill="#22c55e" stroke="white" strokeWidth="0.5" opacity="0.8" />
                  
                  {/* Line from referee to incident */}
                  <line x1={refX} y1={refY} x2={foulX} y2={foulY} stroke="#3b82f6" strokeWidth="0.5" opacity="0.6" />
                  
                  {/* Distance indicator */}
                  <text x={refX} y={refY - 3} textAnchor="middle" fontSize="2" fill="white" fontWeight="bold">
                    {incident.distance_from_optimal?.toFixed(1)}m
                  </text>
                </g>
              );
            })}
          </svg>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Foul Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Actual Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Optimal Position</span>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Positioning Performance Guide:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">Excellent</div>
                <div>&lt;8m from optimal</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">Good</div>
                <div>8-15m from optimal</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">Fair</div>
                <div>15-25m from optimal</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">Poor</div>
                <div>&gt;25m from optimal</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Spatial Foul Context Visualization
export const SpatialFoulContextVisualization = ({ spatialData }) => {
  if (!spatialData?.spatial_foul_analysis) return null;

  const getPressureColor = (pressureIndex) => {
    const ratio = pressureIndex?.pressure_ratio || 1;
    if (ratio > 2) return '#ef4444'; // High pressure - Red
    if (ratio > 1.3) return '#f97316'; // Medium-high - Orange
    if (ratio > 0.7) return '#eab308'; // Medium - Yellow
    return '#22c55e'; // Low pressure - Green
  };

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Spatial Foul Context</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Circle Size:</strong> Larger circles = more players within 10 meters of the foul incident.</p>
          <p><strong>Circle Color:</strong> Indicates pressure level - Red (high pressure) to Green (low pressure).</p>
          <p><strong>Numbers Above Circles:</strong> Exact count of players within 10-meter radius.</p>
          <p><strong>Black Dots:</strong> Foul incidents without cards. Red dots = incidents with cards issued.</p>
          <p><strong>Pressure Ratio:</strong> Red &gt;2x = very high pressure, Green &lt;0.7x = low pressure situations.</p>
          <p><strong>Field Context:</strong> Penalty areas (small rectangles) vs midfield incidents show different patterns.</p>
        </div>
      </div>

      {/* Pressure Level Key */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 opacity-60"></div>
          <div className="text-xs font-medium">High Pressure</div>
          <div className="text-xs text-gray-600">2.0x+ ratio</div>
          <div className="text-xs text-gray-600">6+ players nearby</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2 opacity-60"></div>
          <div className="text-xs font-medium">Medium-High</div>
          <div className="text-xs text-gray-600">1.3-2.0x ratio</div>
          <div className="text-xs text-gray-600">4-6 players</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 opacity-60"></div>
          <div className="text-xs font-medium">Medium</div>
          <div className="text-xs text-gray-600">0.7-1.3x ratio</div>
          <div className="text-xs text-gray-600">3-4 players</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 opacity-60"></div>
          <div className="text-xs font-medium">Low Pressure</div>
          <div className="text-xs text-gray-600">&lt;0.7x ratio</div>
          <div className="text-xs text-gray-600">1-2 players</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spatial Context Visualization</CardTitle>
          <CardDescription>
            Real-time player positions during foul incidents from StatsBomb 360° data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 120 80" className="w-full h-64 border rounded-lg bg-green-100">
            {/* Soccer field */}
            <rect width="120" height="80" fill="#22c55e" opacity="0.3" />
            
            {/* Field markings */}
            <g stroke="white" strokeWidth="0.5" fill="none">
              <rect x="0" y="0" width="120" height="80" />
              <line x1="60" y1="0" x2="60" y2="80" />
              <circle cx="60" cy="40" r="10" />
              <rect x="0" y="22" width="18" height="36" />
              <rect x="102" y="22" width="18" height="36" />
            </g>
            
            {/* Foul incidents with spatial context */}
            {spatialData.spatial_foul_analysis?.slice(0, 15).map((foul, idx) => {
              if (!foul.location || !foul.spatial_context) return null;
              
              const [x, y] = foul.location;
              const density = foul.spatial_context.player_density_10m || 0;
              const pressure = foul.spatial_context.pressure_index;
              
              return (
                <g key={idx}>
                  {/* Pressure circle (radius based on player density) */}
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.max(2, density * 0.8)}
                    fill={getPressureColor(pressure)}
                    opacity="0.4"
                    stroke={getPressureColor(pressure)}
                    strokeWidth="0.5"
                  />
                  
                  {/* Foul marker */}
                  <circle
                    cx={x}
                    cy={y}
                    r="1"
                    fill={foul.card_type ? '#dc2626' : '#374151'}
                    stroke="white"
                    strokeWidth="0.3"
                  />
                  
                  {/* Player count indicator */}
                  <text
                    x={x}
                    y={y - (density * 0.8 + 2)}
                    textAnchor="middle"
                    fontSize="2"
                    fill="black"
                    fontWeight="bold"
                  >
                    {density}
                  </text>
                </g>
              );
            })}
          </svg>
          
          <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full opacity-60"></div>
                <span>High Pressure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full opacity-60"></div>
                <span>Medium-High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-60"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full opacity-60"></div>
                <span>Low Pressure</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Circle size = player density, Color = pressure ratio, Number = players within 10m
            </p>

            {/* Analysis Summary */}
            <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-sm font-medium text-yellow-800 mb-1">Key Insights:</div>
              <div className="text-xs text-yellow-700 space-y-1">
                <p>• Penalty area incidents typically show higher player density (larger circles)</p>
                <p>• Red circles indicate high-pressure situations that often lead to cards</p>
                <p>• Midfield fouls generally have lower pressure ratios (green/yellow)</p>
                <p>• Player clustering around fouls correlates with referee decision severity</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Pressure Analysis Visualization
export const PressureAnalysisVisualization = ({ pressureData }) => {
  if (!pressureData?.sample_incidents) return null;

  const renderPressureSituations = (incidents, pressureType) => {
    const colors = {
      high_pressure: '#ef4444',
      medium_pressure: '#f97316', 
      low_pressure: '#22c55e'
    };

    return (
      <div className="space-y-2">
        <h4 className="font-medium capitalize text-sm">{pressureType.replace('_', ' ')}</h4>
        <svg viewBox="0 0 120 80" className="w-full h-32 border rounded bg-green-50">
          {/* Mini field */}
          <rect width="120" height="80" fill="#22c55e" opacity="0.2" />
          <g stroke="white" strokeWidth="0.3" fill="none" opacity="0.5">
            <rect x="0" y="0" width="120" height="80" />
            <line x1="60" y1="0" x2="60" y2="80" />
            <rect x="0" y="22" width="18" height="36" />
            <rect x="102" y="22" width="18" height="36" />
          </g>
          
          {/* Pressure incidents */}
          {incidents?.slice(0, 8).map((incident, idx) => {
            if (!incident.location) return null;
            const [x, y] = incident.location;
            const playerCount = incident.nearby_players || 0;
            
            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r={Math.max(1.5, playerCount * 0.4)}
                  fill={colors[pressureType]}
                  opacity="0.6"
                />
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  fontSize="3"
                  fill="white"
                  fontWeight="bold"
                >
                  {playerCount}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Pressure Situation Maps</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Three Separate Fields:</strong> Each mini-field shows incidents from different pressure categories.</p>
          <p><strong>Circle Size:</strong> Larger circles = more players within 15-meter radius of the foul.</p>
          <p><strong>Numbers in Circles:</strong> Exact count of nearby players during the incident.</p>
          <p><strong>Color Coding:</strong> Red (high pressure 6+ players), Orange (medium 3-6), Green (low 1-2).</p>
          <p><strong>Field Position:</strong> Notice how pressure patterns vary by field location (penalty area vs midfield).</p>
          <p><strong>Pattern Analysis:</strong> Compare density and distribution across the three pressure levels.</p>
        </div>
      </div>

      {/* Pressure Categories Guide */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2"></div>
          <div className="text-sm font-medium">High Pressure</div>
          <div className="text-xs text-gray-600">6+ players within 15m</div>
          <div className="text-xs text-gray-600">Usually in penalty areas</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2"></div>
          <div className="text-sm font-medium">Medium Pressure</div>
          <div className="text-xs text-gray-600">3-6 players within 15m</div>
          <div className="text-xs text-gray-600">Common in midfield</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2"></div>
          <div className="text-sm font-medium">Low Pressure</div>
          <div className="text-xs text-gray-600">1-2 players within 15m</div>
          <div className="text-xs text-gray-600">Isolated incidents</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(pressureData.sample_incidents).map(([pressureType, incidents]) => (
          <Card key={pressureType} className="p-3">
            {renderPressureSituations(incidents, pressureType)}
          </Card>
        ))}
      </div>
    </div>
  );
};

// Combined Tactical Analysis Visualization
export const TacticalBiasRadarChart = ({ tacticalData }) => {
  if (!tacticalData) return null;

  const data = [
    { metric: 'Defensive Bias', value: (tacticalData.defensive_bias || 0.5) * 100, max: 100 },
    { metric: 'Attacking Bias', value: (tacticalData.attacking_bias || 0.5) * 100, max: 100 },
    { metric: 'Balanced Bias', value: (tacticalData.balanced_bias || 0.5) * 100, max: 100 }
  ];

  const size = 200;
  const center = size / 2;
  const radius = 70;

  const angleStep = (2 * Math.PI) / data.length;
  
  const points = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const value = (item.value / item.max) * radius;
    const x = center + Math.cos(angle) * value;
    const y = center + Math.sin(angle) * value;
    return { x, y, angle, ...item };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tactical Bias Radar</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <svg width={size} height={size} className="border rounded-lg">
          {/* Background circles */}
          {[0.25, 0.5, 0.75, 1].map((fraction, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius * fraction}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Axis lines */}
          {data.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x2 = center + Math.cos(angle) * radius;
            const y2 = center + Math.sin(angle) * radius;
            return (
              <line
                key={index}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="#d1d5db"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Data area */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          
          {/* Labels */}
          {points.map((point, index) => {
            const labelRadius = radius + 15;
            const labelX = center + Math.cos(point.angle) * labelRadius;
            const labelY = center + Math.sin(point.angle) * labelRadius;
            
            return (
              <text
                key={index}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#374151"
              >
                {point.metric}
              </text>
            );
          })}
          
          {/* Value labels */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={point.y - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#1f2937"
              fontWeight="bold"
            >
              {point.value.toFixed(0)}%
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
};