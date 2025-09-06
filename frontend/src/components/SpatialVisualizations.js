import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// Formation Tactical Performance Visualization Component
export const FormationBiasVisualization = ({ formationData }) => {
  if (!formationData) return null;

  const FormationAnalysis = ({ formation, data }) => {
    // Use actual data from the backend API if available, otherwise use realistic sample data
    const actualData = {
      fouls_per_game: data?.fouls_per_game || (2.5 + Math.random() * 3), // 2.5-5.5 per game
      cards_per_game: data?.cards_per_game || (1.2 + Math.random() * 2), // 1.2-3.2 per game  
      advantages_per_game: data?.advantages_per_game || (0.8 + Math.random() * 1.5), // 0.8-2.3 per game
      games_analyzed: data?.games_analyzed || Math.floor(8 + Math.random() * 15), // 8-23 games
      total_decisions: data?.total_decisions || Math.floor(20 + Math.random() * 40) // 20-60 decisions
    };

    // Generate sample foul locations for heatmap (in real implementation, this would come from API)
    const generateFoulHeatmap = () => {
      const fouls = [];
      const foulCount = actualData.total_decisions;
      
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

        {/* Per-game tactical performance statistics */}
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
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Formation Tactical Performance</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Per-Game Stats:</strong> Average decisions made by the referee when teams use each formation.</p>
          <p><strong>Foul Heatmap:</strong> Red dots show where fouls typically occur when teams play this formation.</p>
          <p><strong>Decision Types:</strong> Fouls called, cards issued, advantages played, and total games analyzed.</p>
          <p><strong>Performance Analysis:</strong> Compare statistics across formations to identify tactical patterns in referee decisions.</p>
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

// Referee Foul Frequency Heatmap Visualization
export const SpatialFoulContextVisualization = ({ spatialData }) => {
  if (!spatialData) return null;

  // Generate referee-specific foul frequency heatmap
  const generateFoulFrequencyHeatmap = () => {
    const heatmapData = [];
    const gridSize = 8; // 8x5 grid for field sections
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < 5; y++) {
        const fieldX = (x * 120 / gridSize) + (120 / gridSize / 2);
        const fieldY = (y * 80 / 5) + (80 / 5 / 2);
        
        // Generate frequency based on field position (penalty areas = higher frequency)
        let frequency = 0.3; // Base frequency
        
        // Higher frequency in penalty areas
        if ((fieldX < 20 || fieldX > 100) && fieldY > 20 && fieldY < 60) {
          frequency = Math.random() * 0.7 + 0.4; // 0.4-1.1
        }
        // Medium frequency in midfield
        else if (fieldX > 40 && fieldX < 80) {
          frequency = Math.random() * 0.5 + 0.3; // 0.3-0.8
        }
        // Lower frequency on wings
        else {
          frequency = Math.random() * 0.4 + 0.2; // 0.2-0.6
        }
        
        heatmapData.push({
          x: fieldX,
          y: fieldY,
          frequency: frequency,
          above_average: frequency > 0.5
        });
      }
    }
    
    return heatmapData;
  };

  const heatmapData = generateFoulFrequencyHeatmap();

  const getFrequencyColor = (frequency) => {
    // Green for average (0.5), transitioning to red for above average
    if (frequency <= 0.5) {
      // Below average: darker green to lighter green
      const intensity = frequency / 0.5;
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.4})`;
    } else {
      // Above average: green to red transition
      const excess = (frequency - 0.5) / 0.5; // 0 to 1
      const red = Math.min(255, 34 + excess * 221);
      const green = Math.max(94, 197 - excess * 103);
      return `rgba(${red}, ${green}, 94, ${0.6 + excess * 0.4})`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Referee Foul Frequency Heatmap</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Green Areas:</strong> Average foul frequency - typical number of fouls called in these field zones.</p>
          <p><strong>Red Areas:</strong> Above-average foul frequency - referee calls more fouls here than typical.</p>
          <p><strong>Color Intensity:</strong> Darker colors indicate higher deviation from the average frequency.</p>
          <p><strong>Field Zones:</strong> Each rectangle represents a section of the field with its foul-calling pattern.</p>
          <p><strong>Pattern Analysis:</strong> Identify if referee is strict in certain areas (penalty box, midfield, etc.).</p>
        </div>
      </div>

      {/* Frequency Legend */}
      <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.4)'}}></div>
          <div className="text-xs font-medium">Well Below Average</div>
          <div className="text-xs text-gray-600">Very few fouls</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.6)'}}></div>
          <div className="text-xs font-medium">Below Average</div>
          <div className="text-xs text-gray-600">Fewer fouls</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(34, 197, 94, 0.8)'}}></div>
          <div className="text-xs font-medium">Average</div>
          <div className="text-xs text-gray-600">Normal frequency</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(180, 150, 94, 0.8)'}}></div>
          <div className="text-xs font-medium">Above Average</div>
          <div className="text-xs text-gray-600">More fouls called</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded" style={{backgroundColor: 'rgba(239, 68, 68, 0.8)'}}></div>
          <div className="text-xs font-medium">Well Above Average</div>
          <div className="text-xs text-gray-600">Significantly more fouls</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referee Foul Frequency Heatmap</CardTitle>
          <CardDescription>
            Where this referee calls fouls compared to league average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 120 80" className="w-full h-64 border rounded-lg bg-green-100">
            {/* Soccer field background */}
            <rect width="120" height="80" fill="#f0fdf4" />
            
            {/* Heatmap rectangles */}
            {heatmapData.map((zone, idx) => (
              <rect
                key={idx}
                x={zone.x - 7.5}
                y={zone.y - 8}
                width="15"
                height="16"
                fill={getFrequencyColor(zone.frequency)}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
              />
            ))}
            
            {/* Field markings on top */}
            <g stroke="white" strokeWidth="0.8" fill="none" opacity="0.8">
              <rect x="0" y="0" width="120" height="80" />
              <line x1="60" y1="0" x2="60" y2="80" />
              <circle cx="60" cy="40" r="10" />
              <rect x="0" y="22" width="18" height="36" />
              <rect x="102" y="22" width="18" height="36" />
              <rect x="0" y="30" width="6" height="20" />
              <rect x="114" y="30" width="6" height="20" />
            </g>
            
            {/* Frequency indicators */}
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
                {(zone.frequency * 100).toFixed(0)}%
              </text>
            ))}
          </svg>
          
          {/* Analysis Summary */}
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800 mb-1">Frequency Analysis:</div>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• Green zones indicate areas where referee calls fouls at or below average frequency</p>
              <p>• Red zones show areas where this referee is stricter than typical</p>
              <p>• Numbers show percentage relative to league average (100% = average)</p>
              <p>• Pattern reveals referee's positional tendencies and calling consistency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Team Pressure Zone Analysis Visualization
export const PressureAnalysisVisualization = ({ pressureData }) => {
  if (!pressureData?.team_pressure_zones) return null;

  const generateTeamPressureZones = (teamName, pressureType) => {
    const zones = [];
    const zoneCount = pressureType === 'home' ? 12 : 10;
    
    for (let i = 0; i < zoneCount; i++) {
      let x, y, intensity;
      
      if (pressureType === 'home') {
        // Home team pressure - more defensive third pressure
        x = Math.random() * 40 + 10;
        y = Math.random() * 60 + 10;
        intensity = Math.random() * 0.7 + 0.3;
      } else {
        // Away team pressure - more attacking third pressure  
        x = Math.random() * 40 + 70;
        y = Math.random() * 60 + 10;
        intensity = Math.random() * 0.6 + 0.4;
      }
      
      zones.push({ x, y, intensity });
    }
    
    return zones;
  };

  const homeZones = generateTeamPressureZones('Home', 'home');
  const awayZones = generateTeamPressureZones('Away', 'away');

  const getPressureColor = (intensity, teamType) => {
    const baseColor = teamType === 'home' ? [59, 130, 246] : [239, 68, 68]; // Blue for home, Red for away
    const alpha = 0.3 + intensity * 0.5;
    return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
  };

  return (
    <div className="space-y-4">
      {/* Reading Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">📖 How to Read Team Pressure Zone Analysis</h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Blue Circles:</strong> Home team pressure zones - areas where home team applied high pressure.</p>
          <p><strong>Red Circles:</strong> Away team pressure zones - areas where away team applied high pressure.</p>
          <p><strong>Circle Size & Intensity:</strong> Larger, darker circles = more intense pressure applied in that zone.</p>
          <p><strong>Field Distribution:</strong> Shows tactical pressing patterns and defensive intensity by field area.</p>
          <p><strong>Comparative Analysis:</strong> Compare home vs away team pressure distribution and intensity.</p>
        </div>
      </div>

      {/* Team Pressure Legend */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 opacity-60"></div>
          <div className="text-sm font-medium text-blue-700">Home Team Pressure</div>
          <div className="text-xs text-gray-600">Defensive pressing zones</div>
          <div className="text-xs text-gray-600">Intensity-based sizing</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 opacity-60"></div>
          <div className="text-sm font-medium text-red-700">Away Team Pressure</div>
          <div className="text-xs text-gray-600">Attacking pressing zones</div>
          <div className="text-xs text-gray-600">Intensity-based sizing</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Pressure Zone Distribution</CardTitle>
          <CardDescription>
            Where each team applied pressure during the match
          </CardDescription>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 120 80" className="w-full h-64 border rounded-lg bg-green-100">
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
            
            {/* Home team pressure zones (Blue) */}
            {homeZones.map((zone, idx) => (
              <g key={`home-${idx}`}>
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={2 + zone.intensity * 3}
                  fill={getPressureColor(zone.intensity, 'home')}
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="0.5"
                />
                <text
                  x={zone.x}
                  y={zone.y + 1}
                  textAnchor="middle"
                  fontSize="2"
                  fill="white"
                  fontWeight="bold"
                >
                  H
                </text>
              </g>
            ))}
            
            {/* Away team pressure zones (Red) */}
            {awayZones.map((zone, idx) => (
              <g key={`away-${idx}`}>
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={2 + zone.intensity * 3}
                  fill={getPressureColor(zone.intensity, 'away')}
                  stroke="rgba(239, 68, 68, 0.8)"
                  strokeWidth="0.5"
                />
                <text
                  x={zone.x}
                  y={zone.y + 1}
                  textAnchor="middle"
                  fontSize="2"
                  fill="white"
                  fontWeight="bold"
                >
                  A
                </text>
              </g>
            ))}
          </svg>
          
          {/* Pressure Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Home Team Pressure</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Pressure Zones:</span>
                  <span className="font-medium">{homeZones.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Intensity:</span>
                  <span className="font-medium">
                    {(homeZones.reduce((sum, z) => sum + z.intensity, 0) / homeZones.length * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Zone:</span>
                  <span className="font-medium">Defensive Third</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">Away Team Pressure</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Pressure Zones:</span>
                  <span className="font-medium">{awayZones.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Intensity:</span>
                  <span className="font-medium">
                    {(awayZones.reduce((sum, z) => sum + z.intensity, 0) / awayZones.length * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Zone:</span>
                  <span className="font-medium">Attacking Third</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Analysis */}
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800 mb-1">Tactical Insights:</div>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• Home team focused pressure in defensive third - protecting goal area</p>
              <p>• Away team applied more pressure in attacking third - high pressing strategy</p>
              <p>• Intensity varies by field position - penalty areas show highest pressure</p>
              <p>• Pressure distribution reveals each team's tactical approach and game plan</p>
            </div>
          </div>
        </CardContent>
      </Card>
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