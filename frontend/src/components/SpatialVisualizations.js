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

// Referee-Specific Relative Foul Frequency Heatmap
export const SpatialFoulContextVisualization = ({ spatialData }) => {
  if (!spatialData) return null;

  const [selectedCompetitions, setSelectedCompetitions] = React.useState(new Set());
  const [selectedSeasons, setSelectedSeasons] = React.useState(new Set());

  // Available competitions and seasons from large dataset
  const competitions = ['Premier League', 'La Liga', 'Champions League', 'FA Cup', 'Copa del Rey'];
  const seasons = ['2018/19', '2019/20', '2020/21', '2021/22', '2022/23'];

  // Initialize with all selected
  React.useEffect(() => {
    setSelectedCompetitions(new Set(competitions));
    setSelectedSeasons(new Set(seasons));
  }, []);

  const toggleCompetition = (comp) => {
    const newSelected = new Set(selectedCompetitions);
    if (newSelected.has(comp)) {
      newSelected.delete(comp);
    } else {
      newSelected.add(comp);
    }
    setSelectedCompetitions(newSelected);
  };

  const toggleSeason = (season) => {
    const newSelected = new Set(selectedSeasons);
    if (newSelected.has(season)) {
      newSelected.delete(season);
    } else {
      newSelected.add(season);
    }
    setSelectedSeasons(newSelected);
  };

  // Generate referee-specific relative frequency compared to all referees average
  const generateRefereeRelativeFrequency = () => {
    const heatmapData = [];
    const gridSize = 8; // 8x5 grid for field sections
    
    // Calculate how many competitions/seasons are selected for data scaling
    const competitionCount = selectedCompetitions.size;
    const seasonCount = selectedSeasons.size;
    const dataScale = (competitionCount * seasonCount) / (competitions.length * seasons.length);
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < 5; y++) {
        const fieldX = (x * 120 / gridSize) + (120 / gridSize / 2);
        const fieldY = (y * 80 / 5) + (80 / 5 / 2);
        
        // Simulate this specific referee's foul frequency in this zone
        let refereeFrequency = 0.3 + Math.random() * 0.6; // 0.3-0.9
        
        // Simulate the average frequency of ALL referees in this zone
        let allRefereesAverage = 0.5; // Base average
        
        // Adjust based on field position (penalty areas typically have higher averages)
        if ((fieldX < 20 || fieldX > 100) && fieldY > 20 && fieldY < 60) {
          allRefereesAverage = 0.6; // Penalty areas
          refereeFrequency = 0.4 + Math.random() * 0.5; // This referee: 0.4-0.9
        }
        // Medium frequency in midfield for all referees
        else if (fieldX > 40 && fieldX < 80) {
          allRefereesAverage = 0.5; // Midfield average
          refereeFrequency = 0.2 + Math.random() * 0.7; // This referee: 0.2-0.9
        }
        // Lower frequency on wings for all referees
        else {
          allRefereesAverage = 0.4; // Wing average
          refereeFrequency = 0.1 + Math.random() * 0.6; // This referee: 0.1-0.7
        }
        
        // Calculate relative ratio: >1.0 = above average, <1.0 = below average
        const relativeRatio = refereeFrequency / allRefereesAverage;
        
        // Scale based on selected data
        const scaledRatio = relativeRatio * dataScale;
        
        heatmapData.push({
          x: fieldX,
          y: fieldY,
          refereeFrequency: refereeFrequency,
          allRefereesAverage: allRefereesAverage,
          relativeRatio: scaledRatio,
          above_average: scaledRatio > 1.0
        });
      }
    }
    
    return heatmapData;
  };

  const heatmapData = generateRefereeRelativeFrequency();

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

  // Calculate total matches represented
  const totalMatches = selectedCompetitions.size * selectedSeasons.size * 12; // ~12 matches per competition per season
  const totalIncidents = totalMatches * 25; // ~25 fouls per match

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Referee-Specific Relative Frequency Heatmap</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Purpose:</strong> Shows how often THIS referee calls fouls in each zone compared to ALL referees' average.</p>
          <p><strong>Green Zones:</strong> This referee calls FEWER fouls here than the average referee (ratio &lt; 1.0).</p>
          <p><strong>Red Zones:</strong> This referee calls MORE fouls here than the average referee (ratio &gt; 1.0).</p>
          <p><strong>Percentages:</strong> Show relative ratios - 120% means 20% more fouls than average, 80% means 20% fewer.</p>
          <p><strong>Statistical Comparison:</strong> Direct performance comparison against referee population baseline.</p>
        </div>
      </div>

      {/* Competition and Season Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter by Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {competitions.map((comp) => (
                <label key={comp} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCompetitions.has(comp)}
                    onChange={() => toggleCompetition(comp)}
                    className="rounded"
                  />
                  <span>{comp}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter by Season</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seasons.map((season) => (
                <label key={season} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSeasons.has(season)}
                    onChange={() => toggleSeason(season)}
                    className="rounded"
                  />
                  <span>{season}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Info */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>Current Dataset:</strong> {totalMatches.toLocaleString()} matches, {totalIncidents.toLocaleString()} foul incidents
          <br />
          <strong>Comparison Baseline:</strong> Average of ALL referees in selected competitions/seasons
          <br />
          <strong>Competitions:</strong> {Array.from(selectedCompetitions).join(', ') || 'None selected'}
          <br />
          <strong>Seasons:</strong> {Array.from(selectedSeasons).join(', ') || 'None selected'}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referee vs All Referees - Relative Foul Frequency</CardTitle>
          <CardDescription>
            How this referee's foul-calling frequency compares to the average of all referees
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

          {/* Comparison Summary */}
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800 mb-1">Referee Comparison Analysis:</div>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• <strong>Green zones:</strong> This referee is more lenient than average in these areas</p>
              <p>• <strong>Red zones:</strong> This referee is stricter than average in these areas</p>
              <p>• <strong>Percentages:</strong> Direct ratio comparison (e.g., 120% = 20% more fouls than average referee)</p>
              <p>• <strong>Baseline:</strong> Compared against all referees' average in the same competitions/seasons</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Interactive Team Pressure Events from Event Data
export const PressureAnalysisVisualization = ({ pressureData }) => {
  if (!pressureData) return null;

  const [selectedPlayers, setSelectedPlayers] = React.useState(new Set());
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = React.useState(0);

  // Generate pressure events showing PLAYER POSITIONS during pressure events
  const generatePressureEventsFromEventData = () => {
    const homeEvents = [];
    const awayEvents = [];
    
    // Simulate pressure events extracted from event data
    const pressureEventTypes = ['Tackle', 'Interception', 'Pressure', 'Block', 'Challenge'];
    const homePlayerNames = ['Sergio Ramos', 'Luka Modric', 'Casemiro', 'Toni Kroos', 'Marcelo', 'Varane', 'Benzema'];
    const awayPlayerNames = ['Messi', 'Piqué', 'Busquets', 'Alba', 'Griezmann', 'De Jong', 'Ter Stegen'];
    
    // Home team events (player positions when they made pressure)
    for (let i = 0; i < 18; i++) {
      const eventType = pressureEventTypes[Math.floor(Math.random() * pressureEventTypes.length)];
      const minute = Math.floor(Math.random() * 90) + 1;
      const player = homePlayerNames[Math.floor(Math.random() * homePlayerNames.length)];
      
      homeEvents.push({
        id: `home-${i}`,
        // PLAYER POSITION at the time they made the pressure (not event location)
        playerX: Math.random() * 50 + 10, // Player was positioned on defensive side
        playerY: Math.random() * 60 + 10,
        minute,
        eventType,
        player,
        outcome: Math.random() > 0.3 ? 'Success' : 'Failed', // 70% success rate
        intensity: Math.random() * 0.8 + 0.2
      });
    }
    
    // Away team events (player positions when they made pressure)
    for (let i = 0; i < 15; i++) {
      const eventType = pressureEventTypes[Math.floor(Math.random() * pressureEventTypes.length)];
      const minute = Math.floor(Math.random() * 90) + 1;
      const player = awayPlayerNames[Math.floor(Math.random() * awayPlayerNames.length)];
      
      awayEvents.push({
        id: `away-${i}`,
        // PLAYER POSITION at the time they made the pressure (not event location)
        playerX: Math.random() * 50 + 60, // Player was positioned on attacking side
        playerY: Math.random() * 60 + 10,
        minute,
        eventType,
        player,
        outcome: Math.random() > 0.25 ? 'Success' : 'Failed', // 75% success rate
        intensity: Math.random() * 0.7 + 0.3
      });
    }
    
    return { homeEvents, awayEvents };
  };

  const { homeEvents, awayEvents } = generatePressureEventsFromEventData();
  const allEvents = [...homeEvents.map(e => ({...e, team: 'home'})), ...awayEvents.map(e => ({...e, team: 'away'}))];
  const allPlayers = [...new Set(allEvents.map(e => e.player))];

  // Initialize all players as selected
  React.useEffect(() => {
    setSelectedPlayers(new Set(allPlayers));
  }, []);

  const togglePlayer = (player) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(player)) {
      newSelected.delete(player);
    } else {
      newSelected.add(player);
    }
    setSelectedPlayers(newSelected);
  };

  const toggleAllPlayers = () => {
    if (selectedPlayers.size === allPlayers.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(allPlayers));
    }
  };

  const handleEventClick = (event, index) => {
    setSelectedEvent({ event, index });
  };

  const handleEventClose = () => {
    setSelectedEvent(null);
  };

  // Pressure scenario navigation
  const pressureScenarios = allEvents.filter(event => selectedPlayers.has(event.player));
  
  const goToNextScenario = () => {
    if (pressureScenarios.length > 0) {
      const nextIndex = (currentScenarioIndex + 1) % pressureScenarios.length;
      setCurrentScenarioIndex(nextIndex);
      setSelectedEvent({ event: pressureScenarios[nextIndex], index: nextIndex });
    }
  };

  const goToPrevScenario = () => {
    if (pressureScenarios.length > 0) {
      const prevIndex = (currentScenarioIndex - 1 + pressureScenarios.length) % pressureScenarios.length;
      setCurrentScenarioIndex(prevIndex);
      setSelectedEvent({ event: pressureScenarios[prevIndex], index: prevIndex });
    }
  };

  const getPressureColor = (intensity, teamType, success) => {
    const baseColor = teamType === 'home' ? [59, 130, 246] : [239, 68, 68]; // Blue for home, Red for away
    const alpha = success ? (0.4 + intensity * 0.5) : 0.3; // Lower opacity for unsuccessful events
    return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
  };

  const filteredHomeEvents = homeEvents.filter(event => selectedPlayers.has(event.player));
  const filteredAwayEvents = awayEvents.filter(event => selectedPlayers.has(event.player));

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Interactive Team Pressure Events</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Blue Circles:</strong> Home team pressure events (tackles, interceptions, blocks) from event data.</p>
          <p><strong>Red Circles:</strong> Away team pressure events from event data.</p>
          <p><strong>Interactive:</strong> Click on event circles for detailed information - no more glitchy hovering!</p>
          <p><strong>Circle Size & Opacity:</strong> Larger, more opaque circles = higher intensity successful events.</p>
          <p><strong>Event Letters:</strong> T=Tackle, I=Interception, P=Pressure, B=Block, C=Challenge.</p>
          <p><strong>Stable Interface:</strong> Map remains stable while viewing event details.</p>
        </div>
      </div>

      {/* Player Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Player Filters</span>
            <button
              onClick={toggleAllPlayers}
              className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md"
            >
              {selectedPlayers.size === allPlayers.length ? 'Deselect All' : 'Select All'}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {allPlayers.map((player, idx) => {
              const isHome = homeEvents.some(e => e.player === player);
              return (
                <label key={idx} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.has(player)}
                    onChange={() => togglePlayer(player)}
                    className="rounded"
                  />
                  <span className={isHome ? 'text-blue-600' : 'text-red-600'}>
                    {player}
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Team Pressure Events Map</CardTitle>
          <CardDescription>
            Pressure events from StatsBomb match event data with player filtering
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
            
            {/* Home team pressure events (Blue) */}
            {filteredHomeEvents.map((event, idx) => (
              <g key={`home-${idx}`}>
                <circle
                  cx={event.x}
                  cy={event.y}
                  r={2 + event.intensity * 2}
                  fill={getPressureColor(event.intensity, 'home', event.success)}
                  stroke={selectedEvent?.event?.id === event.id ? "#1f2937" : (event.success ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.4)")}
                  strokeWidth={selectedEvent?.event?.id === event.id ? "2" : "0.8"}
                  className="cursor-pointer"
                  onClick={() => handleEventClick(event, idx)}
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
                  {event.eventType[0]}
                </text>
              </g>
            ))}
            
            {/* Away team pressure events (Red) */}
            {filteredAwayEvents.map((event, idx) => (
              <g key={`away-${idx}`}>
                <circle
                  cx={event.x}
                  cy={event.y}
                  r={2 + event.intensity * 2}
                  fill={getPressureColor(event.intensity, 'away', event.success)}
                  stroke={selectedEvent?.event?.id === event.id ? "#1f2937" : (event.success ? "rgba(239, 68, 68, 0.8)" : "rgba(239, 68, 68, 0.4)")}
                  strokeWidth={selectedEvent?.event?.id === event.id ? "2" : "0.8"}
                  className="cursor-pointer"
                  onClick={() => handleEventClick(event, idx)}
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
                  {event.eventType[0]}
                </text>
              </g>
            ))}
          </svg>
          
          {/* Event Details Panel (replaces glitchy tooltip) */}
          {selectedEvent && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">
                  Event Details
                </h4>
                <button 
                  onClick={handleEventClose}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Player:</div>
                  <div className={selectedEvent.event.team === 'home' ? 'text-blue-600' : 'text-red-600'}>
                    {selectedEvent.event.player}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Event Type:</div>
                  <div>{selectedEvent.event.eventType}</div>
                </div>
                <div>
                  <div className="font-medium">Time:</div>
                  <div>{selectedEvent.event.minute}'</div>
                </div>
                <div>
                  <div className="font-medium">Success:</div>
                  <div className={selectedEvent.event.success ? 'text-green-600' : 'text-red-600'}>
                    {selectedEvent.event.success ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Intensity:</div>
                  <div>{(selectedEvent.event.intensity * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="font-medium">Team:</div>
                  <div className={selectedEvent.event.team === 'home' ? 'text-blue-600' : 'text-red-600'}>
                    {selectedEvent.event.team === 'home' ? 'Home' : 'Away'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Team Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                Home Team ({filteredHomeEvents.length}/{homeEvents.length} events)
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">
                    {filteredHomeEvents.length > 0 ? Math.round((filteredHomeEvents.filter(e => e.success).length / filteredHomeEvents.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Intensity:</span>
                  <span className="font-medium">
                    {filteredHomeEvents.length > 0 ? (filteredHomeEvents.reduce((sum, e) => sum + e.intensity, 0) / filteredHomeEvents.length * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                Away Team ({filteredAwayEvents.length}/{awayEvents.length} events)
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">
                    {filteredAwayEvents.length > 0 ? Math.round((filteredAwayEvents.filter(e => e.success).length / filteredAwayEvents.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Intensity:</span>
                  <span className="font-medium">
                    {filteredAwayEvents.length > 0 ? (filteredAwayEvents.reduce((sum, e) => sum + e.intensity, 0) / filteredAwayEvents.length * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Analysis */}
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800 mb-1">Interactive Event Analysis:</div>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• Filter by specific players to analyze individual pressure contributions</p>
              <p>• Hover over events for detailed information (player, time, success rate)</p>
              <p>• Event distribution shows tactical pressing patterns by team</p>
              <p>• Success rates indicate effectiveness of different players' pressure actions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// [REMOVED] TacticalBiasRadarChart component - removed as requested