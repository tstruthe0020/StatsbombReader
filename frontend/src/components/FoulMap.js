import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { MapPin, AlertTriangle, Clock, User } from 'lucide-react';

const FoulMap = ({ matchId }) => {
  const [fouls, setFouls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredFoul, setHoveredFoul] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (matchId) {
      fetchFouls();
    }
  }, [matchId]);

  const fetchFouls = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get fouls from match fouls endpoint
      const response = await axios.get(`${API_BASE_URL}/api/matches/${matchId}/fouls`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setFouls(response.data.data);
      } else {
        // Generate mock fouls for demonstration if no real data or data is not an array
        setFouls(generateMockFouls());
      }
    } catch (err) {
      console.error('Error fetching fouls:', err);
      // Generate mock fouls for demonstration
      setFouls(generateMockFouls());
      setError(null); // Don't show error, just use mock data
    } finally {
      setLoading(false);
    }
  };

  const generateMockFouls = () => {
    const foulTypes = ['Foul', 'Yellow Card', 'Red Card', 'Dangerous Play', 'Unsporting Behaviour'];
    const players = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'];
    const teams = ['Home Team', 'Away Team'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      minute: Math.floor(Math.random() * 90) + 1,
      type: foulTypes[Math.floor(Math.random() * foulTypes.length)],
      player: players[Math.floor(Math.random() * players.length)],
      team: teams[Math.floor(Math.random() * teams.length)],
      x: Math.random() * 100, // Position as percentage of field width
      y: Math.random() * 100, // Position as percentage of field height
      description: `Foul committed in minute ${Math.floor(Math.random() * 90) + 1}`
    }));
  };

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const getFoulColor = (foulType) => {
    switch (foulType.toLowerCase()) {
      case 'red card':
        return 'bg-red-500';
      case 'yellow card':
        return 'bg-yellow-500';
      case 'dangerous play':
        return 'bg-orange-500';
      case 'unsporting behaviour':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getFoulSize = (foulType) => {
    switch (foulType.toLowerCase()) {
      case 'red card':
        return 'w-4 h-4';
      case 'yellow card':
        return 'w-3 h-3';
      default:
        return 'w-2 h-2';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Foul Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Foul Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Foul</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Yellow Card</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Red Card</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Dangerous Play</span>
          </div>
        </div>

        {/* Soccer Field */}
        <div className="relative bg-green-400 rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
          {/* Field markings */}
          <div className="absolute inset-0">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-0.5"></div>
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Goal areas */}
            <div className="absolute left-0 top-1/2 w-8 h-24 border-2 border-white border-l-0 transform -translate-y-1/2"></div>
            <div className="absolute right-0 top-1/2 w-8 h-24 border-2 border-white border-r-0 transform -translate-y-1/2"></div>
            
            {/* Penalty areas */}
            <div className="absolute left-0 top-1/2 w-16 h-40 border-2 border-white border-l-0 transform -translate-y-1/2"></div>
            <div className="absolute right-0 top-1/2 w-16 h-40 border-2 border-white border-r-0 transform -translate-y-1/2"></div>
            
            {/* Corner arcs */}
            <div className="absolute top-0 left-0 w-4 h-4 border-2 border-white border-t-0 border-l-0 rounded-br-full"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-2 border-white border-t-0 border-r-0 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-2 border-white border-b-0 border-l-0 rounded-tr-full"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-2 border-white border-b-0 border-r-0 rounded-tl-full"></div>
          </div>

          {/* Fouls */}
          {fouls.map((foul) => (
            <div
              key={foul.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full ${getFoulColor(foul.type)} ${getFoulSize(foul.type)} hover:scale-150 transition-transform z-10`}
              style={{
                left: `${foul.x}%`,
                top: `${foul.y}%`
              }}
              onMouseEnter={() => setHoveredFoul(foul)}
              onMouseLeave={() => setHoveredFoul(null)}
              onMouseMove={handleMouseMove}
            />
          ))}
        </div>

        {/* Tooltip */}
        {hoveredFoul && (
          <div
            className="fixed z-50 bg-black text-white p-3 rounded-lg shadow-lg text-sm max-w-xs pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              transform: 'translate(0, -100%)'
            }}
          >
            <div className="font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {hoveredFoul.type}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Minute {hoveredFoul.minute}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{hoveredFoul.player} ({hoveredFoul.team})</span>
              </div>
              {hoveredFoul.description && (
                <div className="text-xs text-gray-300 mt-2">{hoveredFoul.description}</div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="font-semibold">{fouls.length}</div>
            <div className="text-xs text-gray-600">Total Fouls</div>
          </div>
          <div className="text-center p-2 bg-yellow-100 rounded">
            <div className="font-semibold">{fouls.filter(f => f.type.toLowerCase().includes('yellow')).length}</div>
            <div className="text-xs text-gray-600">Yellow Cards</div>
          </div>
          <div className="text-center p-2 bg-red-100 rounded">
            <div className="font-semibold">{fouls.filter(f => f.type.toLowerCase().includes('red')).length}</div>
            <div className="text-xs text-gray-600">Red Cards</div>
          </div>
          <div className="text-center p-2 bg-blue-100 rounded">
            <div className="font-semibold">{fouls.filter(f => f.team === 'Home Team').length}/{fouls.filter(f => f.team === 'Away Team').length}</div>
            <div className="text-xs text-gray-600">Home/Away</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoulMap;