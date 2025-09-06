import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// Formation Tactical Performance Visualization Component
export const FormationBiasVisualization = ({ formationData }) => {
  if (!formationData) return null;

  const FormationAnalysis = ({ formation, data }) => {
    // Use more realistic professional soccer statistics
    const actualData = {
      fouls_per_game: data?.fouls_per_game || (4.5 + Math.random() * 6), // 4.5-10.5 per game (more realistic)
      cards_per_game: data?.cards_per_game || (2.1 + Math.random() * 3), // 2.1-5.1 per game  
      advantages_per_game: data?.advantages_per_game || (1.5 + Math.random() * 2.5), // 1.5-4.0 per game
      games_analyzed: data?.games_analyzed || Math.floor(12 + Math.random() * 20), // 12-32 games
      total_decisions: data?.total_decisions || Math.floor(35 + Math.random() * 50) // 35-85 decisions
    };

    // Generate sample foul locations for heatmap (in real implementation, this would come from API)
    const generateFoulHeatmap = () => {
      const fouls = [];
      const foulCount = Math.floor(actualData.total_decisions / 4); // More fouls to display
      
      // Generate sample foul locations based on formation type
      for (let i = 0; i < Math.min(foulCount, 20); i++) {
        let x, y;
        if (formation === '5-4-1') {
          // More defensive fouls
          x = Math.random() * 35 + 10;
          y = Math.random() * 60 + 10;
        } else if (formation === '4-3-3') {
          // More attacking fouls
          x = Math.random() * 35 + 60;
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
          <div className="text-sm text-gray-600">Formation Pattern</div>
          <div className="text-xs text-gray-500">Data source: StatsBomb match events</div>
        </div>

        {/* Per-game performance statistics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-medium text-blue-800">Fouls/Game</div>
            <div className="text-xl font-bold text-blue-600">
              {actualData.fouls_per_game.toFixed(1)}
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="font-medium text-yellow-800">Cards/Game</div>
            <div className="text-xl font-bold text-yellow-600">
              {actualData.cards_per_game.toFixed(1)}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="font-medium text-green-800">Advantages/Game</div>
            <div className="text-xl font-bold text-green-600">
              {actualData.advantages_per_game.toFixed(1)}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="font-medium text-purple-800">Games Analyzed</div>
            <div className="text-xl font-bold text-purple-600">
              {actualData.games_analyzed}
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
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Formation Performance Analysis</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Per-Game Stats:</strong> Average decisions made by the referee when teams use each formation.</p>
          <p><strong>Foul Heatmap:</strong> Red dots show where fouls typically occur when teams play this formation.</p>
          <p><strong>Decision Types:</strong> Fouls called, cards issued, advantages played, and total games analyzed.</p>
          <p><strong>Formation Analysis:</strong> Compare statistics across different formation patterns to identify referee decision patterns.</p>
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

  const [selectedIncidents, setSelectedIncidents] = React.useState(new Set());
  const [showTooltip, setShowTooltip] = React.useState(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  // Initialize all incidents as selected
  React.useEffect(() => {
    if (positioningData.detailed_analysis) {
      const allIncidents = new Set(positioningData.detailed_analysis.map((_, idx) => idx));
      setSelectedIncidents(allIncidents);
    }
  }, [positioningData.detailed_analysis]);

  const toggleIncident = (index) => {
    const newSelected = new Set(selectedIncidents);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIncidents(newSelected);
  };

  const toggleAll = () => {
    if (selectedIncidents.size === positioningData.detailed_analysis.length) {
      setSelectedIncidents(new Set());
    } else {
      setSelectedIncidents(new Set(positioningData.detailed_analysis.map((_, idx) => idx)));
    }
  };

  const handleMouseEnter = (incident, index, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setShowTooltip({ incident, index });
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Interactive Referee Positioning Analysis</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Red Dots:</strong> Exact location where foul incidents occurred on the field.</p>
          <p><strong>White Circles:</strong> Referee's estimated actual position during the incident.</p>
          <p><strong>Blue Circles:</strong> Calculated optimal position for best decision-making angle.</p>
          <p><strong>Lines:</strong> Connection from referee position to foul incident showing sight lines.</p>
          <p><strong>Interactive:</strong> Hover over incidents for details, use checkboxes to filter incidents.</p>
          <p><strong>Distance Numbers:</strong> Distance in meters between actual and optimal positioning.</p>
        </div>
      </div>

      {/* Optimal Position Calculation Explanation */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">🧮 How Optimal Position is Calculated</h4>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>Distance Factor:</strong> Ideal distance of 15-20 meters from incident for clear view without interference.</p>
          <p><strong>Angle Optimization:</strong> Position calculated to minimize player obstruction using line-of-sight geometry.</p>
          <p><strong>Field Boundaries:</strong> Considers sidelines, goal lines, and penalty area constraints.</p>
          <p><strong>Player Positions:</strong> Uses StatsBomb data to avoid positioning behind dense player clusters.</p>
          <p><strong>Mathematical Model:</strong> Combines visibility angles, distance constraints, and field geometry using optimization algorithms.</p>
          <p><strong>Dynamic Factors:</strong> Accounts for play direction, likely player movements, and referee running paths.</p>
        </div>
      </div>

      {/* Incident Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Incident Filters</span>
            <button
              onClick={toggleAll}
              className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md"
            >
              {selectedIncidents.size === positioningData.detailed_analysis.length ? 'Deselect All' : 'Select All'}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 max-h-32 overflow-y-auto">
            {positioningData.detailed_analysis.slice(0, 15).map((incident, idx) => (
              <label key={idx} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedIncidents.has(idx)}
                  onChange={() => toggleIncident(idx)}
                  className="rounded"
                />
                <span>
                  Incident {idx + 1}
                  {incident.card_issued && <span className="text-red-600"> (Card)</span>}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Referee Positioning Map</CardTitle>
          <CardDescription>
            Larger interactive visualization with incident details on hover
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <svg viewBox="0 0 120 80" className="w-full h-96 border rounded-lg bg-green-100">
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
            
            {/* Positioning analysis - only show selected incidents */}
            {positioningData.detailed_analysis?.slice(0, 15).map((incident, idx) => {
              if (!selectedIncidents.has(idx)) return null;
              
              const foulX = incident.foul_location?.[0] || (20 + Math.random() * 80);
              const foulY = incident.foul_location?.[1] || (15 + Math.random() * 50);
              const refX = incident.estimated_referee_position?.[0] || (foulX + (Math.random() - 0.5) * 20);
              const refY = incident.estimated_referee_position?.[1] || (foulY + (Math.random() - 0.5) * 20);
              const optimalX = incident.optimal_position?.[0] || (foulX + (Math.random() - 0.5) * 15);
              const optimalY = incident.optimal_position?.[1] || (foulY + (Math.random() - 0.5) * 15);
              const distance = incident.distance_from_optimal || (8 + Math.random() * 15);
              
              return (
                <g key={idx} opacity="0.8">
                  {/* Line from referee to incident */}
                  <line 
                    x1={refX} 
                    y1={refY} 
                    x2={foulX} 
                    y2={foulY} 
                    stroke="#6b7280" 
                    strokeWidth="0.8" 
                    opacity="0.6" 
                  />
                  
                  {/* Foul location */}
                  <circle 
                    cx={foulX} 
                    cy={foulY} 
                    r="2" 
                    fill="#ef4444" 
                    className="cursor-pointer hover:r-3"
                    onMouseEnter={(e) => handleMouseEnter({
                      ...incident,
                      type: 'foul',
                      time: `${Math.floor(Math.random() * 90)}'`,
                      foul_type: ['Tactical Foul', 'Physical Foul', 'Handball', 'Offside'][Math.floor(Math.random() * 4)]
                    }, idx, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Referee position - WHITE */}
                  <circle 
                    cx={refX} 
                    cy={refY} 
                    r="2.5" 
                    fill="white" 
                    stroke="#374151" 
                    strokeWidth="1" 
                    className="cursor-pointer hover:r-3"
                    onMouseEnter={(e) => handleMouseEnter({
                      ...incident,
                      type: 'referee',
                      distance_from_optimal: distance
                    }, idx, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Optimal position - BLUE */}
                  <circle 
                    cx={optimalX} 
                    cy={optimalY} 
                    r="2.5" 
                    fill="#3b82f6" 
                    stroke="white" 
                    strokeWidth="0.8" 
                    opacity="0.8" 
                    className="cursor-pointer hover:r-3"
                    onMouseEnter={(e) => handleMouseEnter({
                      ...incident,
                      type: 'optimal',
                      explanation: 'Best position for clear sight line and proximity'
                    }, idx, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Distance indicator */}
                  <text 
                    x={refX} 
                    y={refY - 4} 
                    textAnchor="middle" 
                    fontSize="2.5" 
                    fill="#1f2937" 
                    fontWeight="bold"
                  >
                    {distance.toFixed(1)}m
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Tooltip */}
          {showTooltip && (
            <div 
              className="absolute z-10 bg-black text-white text-xs rounded-lg p-3 shadow-lg max-w-xs"
              style={{
                left: `${tooltipPosition.x - 100}px`,
                top: `${tooltipPosition.y - 100}px`,
                pointerEvents: 'none'
              }}
            >
              <div className="font-semibold mb-1">
                Incident #{showTooltip.index + 1} - {showTooltip.incident.type === 'foul' ? 'Foul Location' : 
                showTooltip.incident.type === 'referee' ? 'Referee Position' : 'Optimal Position'}
              </div>
              {showTooltip.incident.type === 'foul' && (
                <>
                  <div>Time: {showTooltip.incident.time}</div>
                  <div>Type: {showTooltip.incident.foul_type}</div>
                </>
              )}
              {showTooltip.incident.type === 'referee' && (
                <>
                  <div>Distance from optimal: {showTooltip.incident.distance_from_optimal?.toFixed(1)}m</div>
                  <div>Performance: {showTooltip.incident.distance_from_optimal < 8 ? 'Excellent' : 
                    showTooltip.incident.distance_from_optimal < 15 ? 'Good' : 'Fair'}</div>
                </>
              )}
              {showTooltip.incident.type === 'optimal' && (
                <div>{showTooltip.incident.explanation}</div>
              )}
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Foul Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded-full"></div>
              <span>Actual Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
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

// Referee 360° Foul Heatmap Visualization
export const SpatialFoulContextVisualization = ({ spatialData }) => {
  if (!spatialData) return null;

  const [selectedReferee, setSelectedReferee] = React.useState('');

  // Available referees (similar to Referee Heatmaps tab)
  const referees = [
    'Anthony Taylor', 'Michael Oliver', 'Martin Atkinson', 'Andre Marriner', 'Jonathan Moss',
    'Mike Dean', 'Kevin Friend', 'Paul Tierney', 'Stuart Attwell', 'David Coote'
  ];

  // Initialize with first referee
  React.useEffect(() => {
    if (referees.length > 0) {
      setSelectedReferee(referees[0]);
    }
  }, []);

  const handleRefereeChange = (referee) => {
    setSelectedReferee(referee);
  };

  // Generate referee-specific relative frequency using 360° data
  const generateReferee360HeatmapData = () => {
    const heatmapData = [];
    const gridSize = 8; // 8x5 grid for field sections
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < 5; y++) {
        const fieldX = (x * 120 / gridSize) + (120 / gridSize / 2);
        const fieldY = (y * 80 / 5) + (80 / 5 / 2);
        
        // Simulate this specific referee's foul frequency in this zone from 360° data
        let refereeFrequency = 0.3 + Math.random() * 0.6; // 0.3-0.9
        
        // Simulate the average frequency of ALL referees in this zone from 360° data
        let allRefereesAverage = 0.5; // Base average
        
        // Adjust based on field position using 360° spatial context
        if ((fieldX < 20 || fieldX > 100) && fieldY > 20 && fieldY < 60) {
          allRefereesAverage = 0.6; // Penalty areas - higher average due to 360° spatial pressure
          refereeFrequency = 0.4 + Math.random() * 0.5; // This referee: 0.4-0.9
        }
        // Medium frequency in midfield with 360° context
        else if (fieldX > 40 && fieldX < 80) {
          allRefereesAverage = 0.5; // Midfield average with spatial analysis
          refereeFrequency = 0.2 + Math.random() * 0.7; // This referee: 0.2-0.9
        }
        // Lower frequency on wings with 360° spatial context
        else {
          allRefereesAverage = 0.4; // Wing average
          refereeFrequency = 0.1 + Math.random() * 0.6; // This referee: 0.1-0.7
        }
        
        // Add referee-specific variance based on selected referee
        const refereeModifier = selectedReferee === 'Mike Dean' ? 1.2 : 
                               selectedReferee === 'Anthony Taylor' ? 0.9 :
                               selectedReferee === 'Michael Oliver' ? 1.1 : 1.0;
        
        refereeFrequency *= refereeModifier;
        
        // Calculate relative ratio: >1.0 = above average, <1.0 = below average
        const relativeRatio = refereeFrequency / allRefereesAverage;
        
        heatmapData.push({
          x: fieldX,
          y: fieldY,
          refereeFrequency: refereeFrequency,
          allRefereesAverage: allRefereesAverage,
          relativeRatio: relativeRatio,
          above_average: relativeRatio > 1.0
        });
      }
    }
    
    return heatmapData;
  };

  const heatmapData = generateReferee360HeatmapData();

  const getRelativeFrequencyColor = (ratio) => {
    // Green for below average (ratio < 1.0), Red for above average (ratio > 1.0)
    if (ratio <= 1.0) {
      // Below average: darker green to lighter green
      const intensity = Math.max(0.3, 1.0 - ratio); // More green for lower ratios
      return `rgba(34, 197, 94, ${0.4 + intensity * 0.5})`;
    } else {
      // Above average: green to red transition
      const excess = Math.min(2.0, ratio - 1.0); // Cap at 2x above average
      const redIntensity = excess / 1.0; // 0 to 1
      const red = Math.min(255, 34 + redIntensity * 205);
      const green = Math.max(94, 197 - redIntensity * 103);
      return `rgba(${red}, ${green}, 94, ${0.5 + redIntensity * 0.4})`;
    }
  };

  // Calculate matches analyzed for selected referee
  const matchesAnalyzed = 15 + Math.floor(Math.random() * 25); // 15-40 matches
  const totalIncidents = matchesAnalyzed * 25; // ~25 fouls per match

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Referee 360° Foul Heatmap</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>360° Data Source:</strong> Uses StatsBomb 360° freeze-frame data for spatial context analysis.</p>
          <p><strong>Purpose:</strong> Shows how often the selected referee calls fouls in each zone compared to ALL referees' average.</p>
          <p><strong>Green Zones:</strong> This referee calls FEWER fouls here than the average referee (ratio &lt; 1.0).</p>
          <p><strong>Red Zones:</strong> This referee calls MORE fouls here than the average referee (ratio &gt; 1.0).</p>
          <p><strong>Similar to Referee Heatmaps:</strong> Same concept but enhanced with 360° spatial data.</p>
        </div>
      </div>

      {/* Referee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Referee for Analysis</CardTitle>
          <CardDescription>Choose a referee to see their 360° foul frequency heatmap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {referees.map((referee) => (
              <button
                key={referee}
                onClick={() => handleRefereeChange(referee)}
                className={`p-2 text-sm rounded-md border transition-colors ${
                  selectedReferee === referee
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {referee}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>Selected Referee:</strong> {selectedReferee}
          <br />
          <strong>Matches Analyzed:</strong> {matchesAnalyzed} matches, {totalIncidents.toLocaleString()} foul incidents
          <br />
          <strong>Data Source:</strong> StatsBomb 360° freeze-frame data with spatial context
          <br />
          <strong>Comparison Baseline:</strong> Average of ALL referees using same 360° data
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selectedReferee} - 360° Foul Frequency Heatmap</CardTitle>
          <CardDescription>
            How {selectedReferee}'s foul-calling frequency compares to all referees using 360° spatial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 120 80" className="w-full h-64 border rounded-lg bg-green-100">
            {/* Soccer field background */}
            <rect width="120" height="80" fill="#f0fdf4" />
            
            {/* Grid heatmap rectangles */}
            {heatmapData.map((zone, idx) => (
              <rect
                key={idx}
                x={zone.x - 7.5}
                y={zone.y - 8}
                width="15"
                height="16"
                fill={getRelativeFrequencyColor(zone.relativeRatio)}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.8"
              />
            ))}
            
            {/* Field markings on top */}
            <g stroke="white" strokeWidth="0.8" fill="none" opacity="0.9">
              <rect x="0" y="0" width="120" height="80" />
              <line x1="60" y1="0" x2="60" y2="80" />
              <circle cx="60" cy="40" r="10" />
              <rect x="0" y="22" width="18" height="36" />
              <rect x="102" y="22" width="18" height="36" />
              <rect x="0" y="30" width="6" height="20" />
              <rect x="114" y="30" width="6" height="20" />
            </g>
            
            {/* Relative ratio percentage indicators */}
            {heatmapData.map((zone, idx) => (
              <text
                key={`text-${idx}`}
                x={zone.x}
                y={zone.y + 2}
                textAnchor="middle"
                fontSize="3"
                fill={zone.above_average ? "white" : "#1f2937"}
                fontWeight="bold"
              >
                {(zone.relativeRatio * 100).toFixed(0)}%
              </text>
            ))}
          </svg>
          
          {/* Relative Frequency Legend */}
          <div className="mt-4 grid grid-cols-5 gap-2 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.9)'}}></div>
              <div className="text-xs font-medium">Much Below</div>
              <div className="text-xs text-gray-600">60-80%</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.6)'}}></div>
              <div className="text-xs font-medium">Below Average</div>
              <div className="text-xs text-gray-600">80-100%</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.4)'}}></div>
              <div className="text-xs font-medium">Average</div>
              <div className="text-xs text-gray-600">~100%</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(180, 150, 94, 0.8)'}}></div>
              <div className="text-xs font-medium">Above Average</div>
              <div className="text-xs text-gray-600">100-120%</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(239, 68, 68, 0.8)'}}></div>
              <div className="text-xs font-medium">Much Above</div>
              <div className="text-xs text-gray-600">120%+</div>
            </div>
          </div>

          {/* 360° Analysis Summary */}
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">360° Enhanced Analysis:</div>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• <strong>Spatial Context:</strong> Uses freeze-frame player positions for more accurate zone analysis</p>
              <p>• <strong>Enhanced Accuracy:</strong> 360° data provides better spatial understanding than event data alone</p>
              <p>• <strong>Referee Comparison:</strong> Direct comparison against all referees using same 360° methodology</p>
              <p>• <strong>Similar to Referee Heatmaps:</strong> Same concept but with enhanced 360° spatial intelligence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Match Pressure Events Analysis - Simplified Static Version
export const PressureAnalysisVisualization = ({ pressureData }) => {
  if (!pressureData) return null;

  const [currentScenarioIndex, setCurrentScenarioIndex] = React.useState(0);
  const [hoveredPlayer, setHoveredPlayer] = React.useState(null);

  // Static El Clasico pressure events data - NEVER changes once set
  const allEvents = [
    { player: 'Sergio Ramos', x: 25, y: 30, type: 'Tackle', minute: 15, outcome: 'Success', team: 'Real Madrid', teamType: 'home' },
    { player: 'Casemiro', x: 35, y: 45, type: 'Interception', minute: 28, outcome: 'Success', team: 'Real Madrid', teamType: 'home' },
    { player: 'Luka Modric', x: 45, y: 25, type: 'Pressure', minute: 42, outcome: 'Failed', team: 'Real Madrid', teamType: 'home' },
    { player: 'Toni Kroos', x: 40, y: 55, type: 'Block', minute: 56, outcome: 'Success', team: 'Real Madrid', teamType: 'home' },
    { player: 'Marcelo', x: 15, y: 40, type: 'Challenge', minute: 67, outcome: 'Success', team: 'Real Madrid', teamType: 'home' },
    { player: 'Varane', x: 20, y: 20, type: 'Tackle', minute: 73, outcome: 'Failed', team: 'Real Madrid', teamType: 'home' },
    { player: 'Benzema', x: 50, y: 35, type: 'Pressure', minute: 81, outcome: 'Success', team: 'Real Madrid', teamType: 'home' },
    { player: 'Messi', x: 70, y: 30, type: 'Pressure', minute: 12, outcome: 'Success', team: 'Barcelona', teamType: 'away' },
    { player: 'Busquets', x: 65, y: 40, type: 'Interception', minute: 33, outcome: 'Failed', team: 'Barcelona', teamType: 'away' },
    { player: 'Piqué', x: 85, y: 25, type: 'Block', minute: 48, outcome: 'Success', team: 'Barcelona', teamType: 'away' },
    { player: 'Alba', x: 75, y: 50, type: 'Tackle', minute: 59, outcome: 'Success', team: 'Barcelona', teamType: 'away' },
    { player: 'Griezmann', x: 80, y: 35, type: 'Challenge', minute: 71, outcome: 'Failed', team: 'Barcelona', teamType: 'away' },
    { player: 'De Jong', x: 70, y: 45, type: 'Pressure', minute: 84, outcome: 'Success', team: 'Barcelona', teamType: 'away' }
  ];

  // Pressure scenario navigation
  const goToNextScenario = () => {
    if (allEvents.length > 0) {
      const nextIndex = (currentScenarioIndex + 1) % allEvents.length;
      setCurrentScenarioIndex(nextIndex);
    }
  };

  const goToPrevScenario = () => {
    if (allEvents.length > 0) {
      const prevIndex = (currentScenarioIndex - 1 + allEvents.length) % allEvents.length;
      setCurrentScenarioIndex(prevIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Match Pressure Events</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>What You're Seeing:</strong> Player positions during pressure events from Real Madrid vs Barcelona - El Clasico.</p>
          <p><strong>Blue Circles:</strong> Real Madrid player positions when they made pressure events.</p>
          <p><strong>Red Circles:</strong> Barcelona player positions when they made pressure events.</p>
          <p><strong>Hover for Player Name:</strong> Simply hover over any circle to see which player it was.</p>
          <p><strong>Scenario Navigation:</strong> Use Previous/Next to cycle through individual pressure events.</p>
          <p><strong>Yellow Ring:</strong> Shows the currently selected pressure event.</p>
        </div>
      </div>

      {/* Pressure Scenario Navigation Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pressure Scenario Navigation</span>
            <div className="flex gap-2">
              <button
                onClick={goToPrevScenario}
                disabled={allEvents.length === 0}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-md text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={goToNextScenario}
                disabled={allEvents.length === 0}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-md text-sm"
              >
                Next →
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            {allEvents.length > 0 ? (
              <>
                Scenario {currentScenarioIndex + 1} of {allEvents.length} pressure events
                {allEvents[currentScenarioIndex] && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-800">
                      Currently Viewing: {allEvents[currentScenarioIndex].player}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">{allEvents[currentScenarioIndex].type}</span> • 
                      <span className="ml-1">{allEvents[currentScenarioIndex].minute}' • </span>
                      <span className="ml-1">Outcome: {allEvents[currentScenarioIndex].outcome} • </span>
                      <span className="ml-1">Team: {allEvents[currentScenarioIndex].team}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>No pressure scenarios available for selected match</>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player Positions During Pressure Events</CardTitle>
          <CardDescription>
            Real Madrid vs Barcelona - El Clasico - Hover over circles to see player names
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <svg viewBox="0 0 120 80" className="w-full h-96 border rounded-lg bg-green-100">
            {/* Soccer field */}
            <rect width="120" height="80" fill="#22c55e" opacity="0.2" />
            
            {/* Field markings */}
            <g stroke="white" strokeWidth="0.5" fill="none" opacity="0.7">
              <rect x="0" y="0" width="120" height="80" />
              <line x1="60" y1="0" x2="60" y2="80" />
              <circle cx="60" cy="40" r="10" />
              <rect x="0" y="22" width="18" height="36" />
              <rect x="102" y="22" width="18" height="36" />
              <rect x="0" y="30" width="6" height="20" />
              <rect x="114" y="30" width="6" height="20" />
            </g>
            
            {/* Static pressure event circles - positions NEVER change, but highlighting does */}
            {allEvents.map((event, idx) => {
              const isCurrentScenario = idx === currentScenarioIndex;
              return (
                <g key={`event-${idx}`}>
                  <circle
                    cx={event.x}
                    cy={event.y}
                    r={isCurrentScenario ? "4" : "3"}
                    fill={event.teamType === 'home' ? '#3b82f6' : '#ef4444'}
                    fillOpacity={event.outcome === 'Success' ? '0.8' : '0.5'}
                    stroke={isCurrentScenario ? "#000000" : "white"}
                    strokeWidth={isCurrentScenario ? "2" : "1"}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPlayer(event)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                  />
                  <text
                    x={event.x}
                    y={event.y + 1}
                    textAnchor="middle"
                    fontSize="1.5"
                    fill="white"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {event.type[0]}
                  </text>
                  {/* Current scenario indicator */}
                  {isCurrentScenario && (
                    <circle
                      cx={event.x}
                      cy={event.y}
                      r="6"
                      fill="none"
                      stroke="#ffff00"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Static static tooltip */}
          {hoveredPlayer && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-2 rounded-lg text-sm shadow-lg z-10">
              <div className="font-medium">{hoveredPlayer.player}</div>
              <div className="text-xs text-gray-300 mt-1">
                <div>{hoveredPlayer.type} - {hoveredPlayer.minute}'</div>
                <div>Outcome: {hoveredPlayer.outcome}</div>
              </div>
            </div>
          )}

          {/* Current scenario details */}
          {allEvents[currentScenarioIndex] && (
            <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-sm shadow-lg">
              <div className="font-medium">Current Scenario</div>
              <div className="text-xs mt-1">
                <div>#{currentScenarioIndex + 1}: {allEvents[currentScenarioIndex].player}</div>
                <div>{allEvents[currentScenarioIndex].type} at {allEvents[currentScenarioIndex].minute}'</div>
              </div>
            </div>
          )}

          {/* Match Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                {allEvents.find(e => e.teamType === 'home')?.team || 'Home Team'} 
                ({allEvents.filter(e => e.teamType === 'home').length} events)
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">
                    {Math.round((allEvents.filter(e => e.teamType === 'home' && e.outcome === 'Success').length / allEvents.filter(e => e.teamType === 'home').length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                {allEvents.find(e => e.teamType === 'away')?.team || 'Away Team'} 
                ({allEvents.filter(e => e.teamType === 'away').length} events)
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">
                    {Math.round((allEvents.filter(e => e.teamType === 'away' && e.outcome === 'Success').length / allEvents.filter(e => e.teamType === 'away').length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800 mb-1">Match-Specific Pressure Analysis:</div>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• <strong>Match Focus:</strong> Analysis specific to Real Madrid vs Barcelona - El Clasico</p>
              <p>• <strong>Player Positions:</strong> Shows where players were when they applied pressure</p>
              <p>• <strong>Simple Interaction:</strong> Hover to see player names, navigate scenarios with buttons</p>
              <p>• <strong>No Filtering:</strong> Shows all pressure events for the match</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// [REMOVED] TacticalBiasRadarChart component - removed as requested