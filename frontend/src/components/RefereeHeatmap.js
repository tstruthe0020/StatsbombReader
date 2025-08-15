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

  useEffect(() => {
    fetchReferees();
  }, []);

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
      const response = await axios.get(`${API_BASE_URL}/api/analytics/referees/${refereeId}/heatmap`);
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

  const getHeatColor = (foulCount, maxFouls) => {
    const intensity = foulCount / maxFouls;
    if (intensity > 0.8) return 'rgba(220, 38, 38, 0.8)'; // Red - High activity
    if (intensity > 0.6) return 'rgba(245, 101, 101, 0.7)'; // Light red
    if (intensity > 0.4) return 'rgba(251, 146, 60, 0.6)'; // Orange
    if (intensity > 0.2) return 'rgba(250, 204, 21, 0.5)'; // Yellow
    return 'rgba(34, 197, 94, 0.3)'; // Green - Low activity
  };

  const SoccerField = ({ heatmapZones }) => {
    const maxFouls = Math.max(...heatmapZones.map(zone => zone.foul_count));
    
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
                fill={getHeatColor(zone.foul_count, maxFouls)}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.2"
              />
              <text
                x={zone.x}
                y={zone.y + 1}
                textAnchor="middle"
                fontSize="3"
                fill="white"
                fontWeight="bold"
                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
              >
                {zone.foul_count}
              </text>
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
          <p className="text-xs font-semibold mb-2">Fouls per Zone</p>
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-400 opacity-60 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-400 opacity-60 rounded"></div>
              <span>Med</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 opacity-80 rounded"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Referee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Referee Foul Heatmap Analysis
          </CardTitle>
          <CardDescription>
            Visualize where referees typically award fouls across the soccer field
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{heatmapData.total_fouls}</p>
                  <p className="text-sm text-gray-600">Total Fouls</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(heatmapData.statistics.avg_fouls_per_zone)}
                  </p>
                  <p className="text-sm text-gray-600">Avg per Zone</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">
                    {heatmapData.statistics.most_active_zones[0]?.foul_count || 0}
                  </p>
                  <p className="text-sm text-gray-600">Hottest Zone</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <User className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {(heatmapData.statistics.strictness_rating * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-600">Strictness</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Field Heatmap - Foul Distribution</CardTitle>
              <CardDescription>
                Each zone shows the number of fouls awarded. Warmer colors indicate higher foul frequency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SoccerField heatmapZones={heatmapData.heatmap_zones} />
            </CardContent>
          </Card>

          {/* Most Active Zones */}
          <Card>
            <CardHeader>
              <CardTitle>Most Active Zones</CardTitle>
              <CardDescription>
                Areas where {heatmapData.referee_name} awards fouls most frequently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatmapData.statistics.most_active_zones.slice(0, 6).map((zone, index) => (
                  <div key={zone.zone_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-semibold">Zone ({Math.round(zone.x)}, {Math.round(zone.y)})</p>
                        <p className="text-sm text-gray-600">Field coordinates</p>
                      </div>
                    </div>
                    <Badge className="bg-red-500 text-white">
                      {zone.foul_count} fouls
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RefereeHeatmap;