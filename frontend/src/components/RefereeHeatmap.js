import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Activity, MapPin, TrendingUp, User } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const RefereeHeatmap = () => {
  const [referees, setReferees] = useState([]);
  const [selectedReferee, setSelectedReferee] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('total'); // 'total' or 'per-game'

  useEffect(() => {
    fetchReferees();
  }, []);

  // Refresh heatmap data when view mode changes
  useEffect(() => {
    if (selectedReferee) {
      fetchHeatmapData(selectedReferee.id);
    }
  }, [viewMode]);

  const fetchReferees = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analytics/referees`);
      if (response.data.success) {
        setReferees(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch referees:', err);
    }
  };

  const fetchHeatmapData = async (refereeId) => {
    try {
      setLoading(true);
      const endpoint = viewMode === 'per-game' 
        ? `/api/analytics/referees/${refereeId}/heatmap/per-game`
        : `/api/analytics/referees/${refereeId}/heatmap`;
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      if (response.data.success) {
        setHeatmapData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefereeSelect = async (refereeId) => {
    const referee = referees.find(r => r.id === refereeId);
    setSelectedReferee(referee);
    await fetchHeatmapData(refereeId);
  };

  const getHeatColor = (zone) => {
    // Use the color category from the backend comparison
    switch (zone.color_category) {
      case 'above_average':
        return 'rgba(220, 38, 38, 0.8)'; // Red - Above average
      case 'below_average':
        return 'rgba(34, 197, 94, 0.8)'; // Green - Below average
      case 'average':
      default:
        return 'rgba(250, 204, 21, 0.8)'; // Yellow - Average
    }
  };

  const SoccerField = ({ heatmapZones }) => {
    return (
      <div className="relative bg-green-100 rounded-lg overflow-hidden" style={{ aspectRatio: '3/2' }}>
        {/* Soccer field background */}
        <svg
          viewBox="0 0 120 80"
          className="w-full h-full"
          style={{ background: 'linear-gradient(to bottom, #22c55e, #16a34a)' }}
        >
          {/* Field markings */}
          <g stroke="white" strokeWidth="0.5" fill="none">
            {/* Outer boundary */}
            <rect x="0" y="0" width="120" height="80" />
            
            {/* Center line */}
            <line x1="60" y1="0" x2="60" y2="80" />
            
            {/* Center circle */}
            <circle cx="60" cy="40" r="10" />
            
            {/* Left penalty area */}
            <rect x="0" y="22" width="18" height="36" />
            <rect x="0" y="30" width="6" height="20" />
            
            {/* Right penalty area */}
            <rect x="102" y="22" width="18" height="36" />
            <rect x="114" y="30" width="6" height="20" />
            
            {/* Goals */}
            <rect x="0" y="36" width="2" height="8" stroke="white" strokeWidth="1" />
            <rect x="118" y="36" width="2" height="8" stroke="white" strokeWidth="1" />
          </g>
          
          {/* Heatmap zones */}
          {heatmapZones.map((zone, index) => (
            <g key={zone.zone_id}>
              <rect
                x={zone.x - 6}
                y={zone.y - 6.67}
                width="12"
                height="13.33"
                fill={getHeatColor(zone)}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.3"
              />
              <text
                x={zone.x}
                y={zone.y - 2}
                textAnchor="middle"
                fontSize="2.5"
                fill="white"
                fontWeight="bold"
                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
              >
                {viewMode === 'per-game' ? zone.fouls_per_game : zone.foul_count}
              </text>
              <text
                x={zone.x}
                y={zone.y + 2}
                textAnchor="middle"
                fontSize="2"
                fill="white"
                fontWeight="normal"
                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
              >
                (avg: {viewMode === 'per-game' ? zone.average_fouls_per_game : zone.average_fouls})
              </text>
            </g>
          ))}
        </svg>
        
        {/* Updated Legend */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg">
          <p className="text-xs font-semibold mb-2">Compared to All Referees</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 opacity-80 rounded"></div>
              <span>Above Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 opacity-80 rounded"></div>
              <span>Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 opacity-80 rounded"></div>
              <span>Below Average</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-600">Format: count (avg: X.X)</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('total')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'total'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Total Fouls
          </button>
          <button
            onClick={() => setViewMode('per-game')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'per-game'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Fouls per Game
          </button>
        </div>
      </div>
      {/* Referee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Referee Foul Heatmap Analysis
          </CardTitle>
          <CardDescription>
            Visualize where referees award fouls compared to the average across all referees. Green zones indicate below-average foul calling, yellow shows average, and red indicates above-average calling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleRefereeSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a referee to analyze" />
            </SelectTrigger>
            <SelectContent>
              {referees.map((referee) => (
                <SelectItem key={referee.id} value={referee.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{referee.name}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className="text-xs">
                        {referee.matches} matches
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {referee.total_fouls} fouls
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Heatmap Visualization */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span>Loading heatmap data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {heatmapData && !loading && (
        <>
          {/* Referee Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {heatmapData.referee_name} - Officiating Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {viewMode === 'per-game' 
                      ? heatmapData.fouls_per_game_overall || Math.round(heatmapData.total_fouls / (heatmapData.matches_officiated || 1))
                      : heatmapData.total_fouls
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'per-game' ? 'Fouls per Game' : 'Total Fouls'}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {viewMode === 'per-game' 
                      ? heatmapData.statistics.avg_fouls_per_game_per_zone || Math.round(heatmapData.statistics.avg_fouls_per_zone / (heatmapData.matches_officiated || 1))
                      : Math.round(heatmapData.statistics.avg_fouls_per_zone)
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'per-game' ? 'Avg per Game/Zone' : 'Avg per Zone'}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">
                    {viewMode === 'per-game' 
                      ? heatmapData.statistics.most_active_zones[0]?.fouls_per_game || 0
                      : heatmapData.statistics.most_active_zones[0]?.foul_count || 0
                    }
                  </p>
                  <p className="text-sm text-gray-600">Hottest Zone</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <User className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {viewMode === 'per-game' && heatmapData.matches_officiated 
                      ? heatmapData.matches_officiated
                      : (heatmapData.statistics.strictness_rating * 100).toFixed(0) + '%'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'per-game' ? 'Matches' : 'Strictness'}
                  </p>
                </div>
              </div>

              {/* Comparison Summary */}
              {heatmapData.statistics.comparison_summary && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-xl font-bold text-red-600">
                      {heatmapData.statistics.comparison_summary.zones_above_average}
                    </div>
                    <div className="text-sm text-red-600 font-medium">Above Average</div>
                    <div className="text-xs text-gray-600">zones</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-xl font-bold text-yellow-600">
                      {heatmapData.statistics.comparison_summary.zones_at_average}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Average</div>
                    <div className="text-xs text-gray-600">zones</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xl font-bold text-green-600">
                      {heatmapData.statistics.comparison_summary.zones_below_average}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Below Average</div>
                    <div className="text-xs text-gray-600">zones</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>
                Field Heatmap - {viewMode === 'per-game' ? 'Per Game Comparison' : 'Comparison to Average'}
              </CardTitle>
              <CardDescription>
                {viewMode === 'per-game' 
                  ? 'Each zone shows this referee\'s fouls per game vs. the average per game across all referees. Red = above average, Yellow = average, Green = below average.'
                  : 'Each zone shows this referee\'s foul count vs. the average across all referees. Red = above average, Yellow = average, Green = below average.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SoccerField heatmapZones={heatmapData.heatmap_zones} />
            </CardContent>
          </Card>

          {/* Most Active Zones */}
          <Card>
            <CardHeader>
              <CardTitle>Zone Analysis</CardTitle>
              <CardDescription>
                Detailed comparison of {heatmapData.referee_name}'s foul calling vs. referee average
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatmapData.statistics.most_active_zones.slice(0, 6).map((zone, index) => {
                  const colorClass = zone.color_category === 'above_average' ? 'bg-red-50 border-red-200' :
                                   zone.color_category === 'below_average' ? 'bg-green-50 border-green-200' :
                                   'bg-yellow-50 border-yellow-200';
                  
                  const badgeClass = zone.color_category === 'above_average' ? 'bg-red-500' :
                                   zone.color_category === 'below_average' ? 'bg-green-500' :
                                   'bg-yellow-500';
                  
                  return (
                    <div key={zone.zone_id} className={`p-4 rounded-lg border ${colorClass}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          Zone #{index + 1}
                        </Badge>
                        <Badge className={`${badgeClass} text-white text-xs`}>
                          {zone.color_category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">This referee:</span>
                          <span className="font-bold">
                            {viewMode === 'per-game' 
                              ? `${zone.fouls_per_game} per game`
                              : `${zone.foul_count} fouls`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Average:</span>
                          <span>
                            {viewMode === 'per-game' 
                              ? `${zone.average_fouls_per_game} per game`
                              : `${zone.average_fouls} fouls`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Ratio:</span>
                          <span className={`font-medium ${
                            zone.comparison_ratio > 1.15 ? 'text-red-600' :
                            zone.comparison_ratio < 0.85 ? 'text-green-600' :
                            'text-yellow-600'
                          }`}>
                            {zone.comparison_ratio}x
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Position: ({Math.round(zone.x)}, {Math.round(zone.y)})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RefereeHeatmap;