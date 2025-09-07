import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, TrendingUp, Calendar, BarChart3, Target, Users, ChevronDown } from 'lucide-react';

const TeamBreakdown = () => {
  const [teamName, setTeamName] = useState('');
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableTeams();
  }, []);

  const fetchAvailableTeams = async () => {
    setTeamsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/tactical/teams/available`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableTeams(data.teams);
      } else {
        console.warn('Failed to load available teams:', data.error);
        setAvailableTeams([]);
      }
    } catch (err) {
      console.warn('Error fetching available teams:', err);
      setAvailableTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const searchTeam = async () => {
    if (!teamName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/tactical/team/${encodeURIComponent(teamName)}/analysis`);
      const data = await response.json();
      
      if (data.success) {
        setTeamData(data);
      } else {
        setError(data.error || 'Failed to load team breakdown');
      }
    } catch (err) {
      setError('Unable to fetch team breakdown');
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

  const getTrendIcon = (trend) => {
    if (trend > 0.1) return '📈';
    if (trend < -0.1) return '📉';
    return '➡️';
  };

  const renderRecentMatches = (matches) => {
    if (!matches || matches.length === 0) return null;

    return (
      <div className="space-y-3">
        {matches.map((match, idx) => (
          <Card key={idx} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">
                    {match.opponent} ({match.home_away === 'home' ? 'H' : 'A'})
                  </h4>
                  <p className="text-xs text-gray-500">{match.match_date}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getArchetypeColor(match.style_archetype)}`}>
                  {match.style_archetype}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Possession:</span>
                  <span className="ml-1 font-mono">{((match.possession_share || 0) * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">PPDA:</span>
                  <span className="ml-1 font-mono">{match.ppda?.toFixed(1) || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Directness:</span>
                  <span className="ml-1 font-mono">{match.directness?.toFixed(2) || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fouls:</span>
                  <span className="ml-1 font-mono">{match.fouls_committed || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderTacticalConsistency = (consistency) => {
    if (!consistency) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Archetype Consistency */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Style Consistency
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Primary Style:</span>
              <Badge className={getArchetypeColor(consistency.primary_archetype)}>
                {consistency.primary_archetype}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Consistency:</span>
              <span className="font-mono">{(consistency.archetype_consistency * 100).toFixed(0)}%</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Used in {consistency.primary_archetype_count}/{consistency.total_matches} matches
            </div>
          </div>
        </Card>

        {/* Tactical Trends */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Trends
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Possession:</span>
              <span>{getTrendIcon(consistency.trends?.possession || 0)} {((consistency.avg_possession || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Pressing:</span>
              <span>{getTrendIcon(consistency.trends?.pressing || 0)} {consistency.avg_ppda?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Directness:</span>
              <span>{getTrendIcon(consistency.trends?.directness || 0)} {consistency.avg_directness?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Avg. Performance
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Block Height:</span>
              <span className="font-mono">{consistency.avg_block_height?.toFixed(1) || 'N/A'}m</span>
            </div>
            <div className="flex justify-between">
              <span>Wing Usage:</span>
              <span className="font-mono">{((consistency.avg_wing_share || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Fouls/Game:</span>
              <span className="font-mono">{consistency.avg_fouls?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Team Selection Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Team for Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose a team from the available StatsBomb data to analyze tactical consistency and recent performance
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Select 
                value={teamName} 
                onValueChange={setTeamName}
                disabled={teamsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    teamsLoading 
                      ? "Loading teams..." 
                      : availableTeams.length > 0 
                        ? "Select a team..." 
                        : "No teams available"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableTeams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTeams.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {availableTeams.length} teams available from StatsBomb data
                </p>
              )}
            </div>
            <Button 
              onClick={searchTeam} 
              disabled={loading || !teamName || teamsLoading}
              className="px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Analyzing...' : 'Analyze Team'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Team Results */}
      {teamData && (
        <div className="space-y-6">
          {/* Team Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {teamData.team_name} - Tactical Analysis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Analysis based on {teamData.total_matches} matches 
                {teamData.date_range && ` • ${teamData.date_range.start} to ${teamData.date_range.end}`}
              </p>
            </CardHeader>
          </Card>

          {/* Tactical Consistency Overview */}
          {teamData.consistency && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Tactical Consistency Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderTacticalConsistency(teamData.consistency)}
              </CardContent>
            </Card>
          )}

          {/* Recent Matches */}
          {teamData.recent_matches && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Last {teamData.recent_matches.length} Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRecentMatches(teamData.recent_matches)}
              </CardContent>
            </Card>
          )}

          {/* Tactical Adaptability */}
          {teamData.adaptability && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tactical Adaptability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Home vs Away</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Home Style:</span>
                        <Badge className={getArchetypeColor(teamData.adaptability.home_style)}>
                          {teamData.adaptability.home_style || 'Varied'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Away Style:</span>
                        <Badge className={getArchetypeColor(teamData.adaptability.away_style)}>
                          {teamData.adaptability.away_style || 'Varied'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Adaptability Score:</span>
                        <span className="font-mono">{(teamData.adaptability.adaptability_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Style Variations</h4>
                    <div className="space-y-1">
                      {Object.entries(teamData.adaptability.style_distribution || {}).map(([style, count]) => (
                        <div key={style} className="flex justify-between text-sm">
                          <span>{style}:</span>
                          <span>{count} matches</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamBreakdown;