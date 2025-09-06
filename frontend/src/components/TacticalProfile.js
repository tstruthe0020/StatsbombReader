import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Brain, TrendingUp, Target, Activity, Zap, Settings, Shield, ArrowUp, ArrowRight } from 'lucide-react';

const TacticalProfile = ({ homeTeam, awayTeam, matchId }) => {
  const [tacticalData, setTacticalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (matchId) {
      fetchTacticalData();
    }
  }, [matchId]);

  const fetchTacticalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/style/match/${matchId}`);
      const data = await response.json();
      
      if (data.success) {
        setTacticalData(data);
      } else {
        // Check if it's a data processing issue vs system error
        if (data.error && data.error.includes('not available')) {
          setError('Tactical archetype computation in progress... This may take a moment for complex matches.');
        } else {
          setError(data.error || 'Failed to load tactical data');
        }
      }
    } catch (err) {
      console.warn('Tactical data request failed:', err);
      setError('Unable to compute tactical archetypes - please try again');
    } finally {
      setLoading(false);
    }
  };

  const getArchetypeColor = (archetype) => {
    if (!archetype) return 'bg-gray-100 text-gray-700';
    
    if (archetype.includes('High-Press')) return 'bg-red-100 text-red-800';
    if (archetype.includes('Low-Block')) return 'bg-blue-100 text-blue-800';
    if (archetype.includes('Possession')) return 'bg-green-100 text-green-800';
    if (archetype.includes('Counter')) return 'bg-orange-100 text-orange-800';
    if (archetype.includes('Direct')) return 'bg-purple-100 text-purple-800';
    
    return 'bg-gray-100 text-gray-700';
  };

  const renderTeamProfile = (teamData, isHome) => {
    const colors = isHome ? 
      { bg: 'bg-blue-50', header: 'text-blue-800', icon: 'text-blue-600' } :
      { bg: 'bg-red-50', header: 'text-red-800', icon: 'text-red-600' };

    if (!teamData) {
      return (
        <div className={`p-4 ${colors.bg} rounded-lg`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${colors.header}`}>
              {isHome ? homeTeam : awayTeam}
            </h3>
            <Badge variant={isHome ? "default" : "secondary"}>
              {isHome ? "Home" : "Away"}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {loading ? "Loading tactical profile..." : "Tactical data not available"}
          </div>
        </div>
      );
    }

    const { axis_tags, match_metrics } = teamData;

    return (
      <div className={`p-4 ${colors.bg} rounded-lg`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${colors.header}`}>{teamData.team}</h3>
          <Badge variant={isHome ? "default" : "secondary"}>
            {isHome ? "Home" : "Away"}
          </Badge>
        </div>

        {/* Tactical Archetype */}
        <div className="mb-4">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getArchetypeColor(teamData.style_archetype)}`}>
            {teamData.style_archetype || 'Unknown Style'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${colors.icon}`} />
              <span className="font-medium">Tactical Approach</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-3 w-3 text-gray-400" />
                <span>Pressing: <span className="font-medium">{axis_tags?.pressing || 'N/A'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-gray-400" />
                <span>Block: <span className="font-medium">{axis_tags?.block || 'N/A'}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span>Transition: <span className="font-medium">{axis_tags?.transition || 'N/A'}</span></span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${colors.icon}`} />
              <span className="font-medium">Build-up Style</span>
            </div>
            <div className="ml-6 space-y-1">
              <div>Possession: <span className="font-medium">{axis_tags?.possession_directness || 'N/A'}</span></div>
              <div>Width: <span className="font-medium">{axis_tags?.width || 'N/A'}</span></div>
              <div>Directness: <span className="font-medium">{match_metrics?.directness || 'N/A'}</span></div>
            </div>
          </div>
        </div>

        {/* Match Metrics */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium">{match_metrics?.possession_share ? `${(match_metrics.possession_share * 100).toFixed(1)}%` : 'N/A'}</div>
              <div className="text-gray-500">Possession</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{match_metrics?.ppda || 'N/A'}</div>
              <div className="text-gray-500">PPDA</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{match_metrics?.fouls_committed || 'N/A'}</div>
              <div className="text-gray-500">Fouls</div>
            </div>
          </div>
        </div>

        {/* Overlays */}
        {axis_tags?.overlays && axis_tags.overlays.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">Tactical Overlays:</div>
            <div className="flex flex-wrap gap-1">
              {axis_tags.overlays.map((overlay, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {overlay}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const homeTeamData = tacticalData?.teams?.find(team => team.home_away === 'home');
  const awayTeamData = tacticalData?.teams?.find(team => team.home_away === 'away');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Tactical Profiles & Archetypes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Team Profiles */}
          {renderTeamProfile(homeTeamData, true)}
          {renderTeamProfile(awayTeamData, false)}

          {/* Tactical Comparison */}
          {tacticalData?.tactical_summary && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700">Tactical Comparison</span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Style Matchup:</div>
                  <div className="text-sm text-gray-600">
                    {tacticalData.tactical_summary.styles_comparison.join(' vs ')}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700 mb-1">Tactical Contrast:</div>
                  <div className="text-gray-600">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                      tacticalData.tactical_summary.tactical_contrast.contrast_level === 'high' ? 'bg-red-100 text-red-700' :
                      tacticalData.tactical_summary.tactical_contrast.contrast_level === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {tacticalData.tactical_summary.tactical_contrast.contrast_level.toUpperCase()} CONTRAST
                    </span>
                    {tacticalData.tactical_summary.tactical_contrast.description}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border-t pt-4">
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-yellow-700 mb-2">{error}</p>
                <p className="text-xs text-yellow-600">
                  Tactical archetype data requires running the dataset builder with StatsBomb data.
                  Basic match information is still available in other sections.
                </p>
              </div>
            </div>
          )}

          {/* Match Info */}
          <div className="border-t pt-4">
            <div className="text-xs text-gray-500 mb-2">
              Match ID: {matchId}
              {tacticalData?.match_info?.referee_name && (
                <span> • Referee: {tacticalData.match_info.referee_name}</span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Tactical archetypes are derived from StatsBomb playstyle features including pressing intensity, 
              possession patterns, width usage, and transition play.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TacticalProfile;