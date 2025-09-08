import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Search, TrendingUp, Calendar, BarChart3, Target, Users, ChevronDown, Filter } from 'lucide-react';

const TeamBreakdown = () => {
  const [teamName, setTeamName] = useState('');
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [availableCompetitions, setAvailableCompetitions] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableTeams();
    fetchAvailableCompetitions();
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

  const fetchAvailableCompetitions = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/competitions`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableCompetitions(data.data);
      }
    } catch (err) {
      console.warn('Error fetching competitions:', err);
    }
  };

  const searchTeam = async () => {
    if (!teamName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCompetitions.length > 0) {
        params.append('competition_ids', selectedCompetitions.join(','));
      }
      if (selectedSeasons.length > 0) {
        params.append('season_ids', selectedSeasons.join(','));
      }
      
      const queryString = params.toString();
      const url = `${backendUrl}/api/tactical/team/${encodeURIComponent(teamName)}/analysis${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
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

  const renderAverageTacticalProfile = (profile) => {
    if (!profile) return null;

    return (
      <div className="space-y-6">
        {/* Average Archetype */}
        <div className="text-center">
          <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${getArchetypeColor(profile.style_archetype)}`}>
            {profile.style_archetype || 'Unknown Style'}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Average tactical profile across {teamData.analysis_period.total_matches} matches
          </p>
        </div>

        {/* Tactical Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Pressing Style
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Classification:</span>
                <Badge className="bg-red-100 text-red-800">
                  {profile.axis_tags?.pressing || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Avg PPDA:</span>
                <span className="font-mono">{profile.key_metrics?.ppda || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Possession Style
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Classification:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {profile.axis_tags?.possession_directness || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Avg Possession:</span>
                <span className="font-mono">{((profile.key_metrics?.possession_share || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Directness:</span>
                <span className="font-mono">{profile.key_metrics?.directness || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Width & Transitions
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Width Usage:</span>
                <Badge className="bg-green-100 text-green-800">
                  {profile.axis_tags?.width || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Wing Share:</span>
                <span className="font-mono">{((profile.key_metrics?.wing_share || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Transitions:</span>
                <Badge className="bg-purple-100 text-purple-800">
                  {profile.axis_tags?.transition || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Key Metrics Summary */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">Average Performance Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.key_metrics?.ppda || 'N/A'}</div>
              <div className="text-gray-500">PPDA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {((profile.key_metrics?.possession_share || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-gray-500">Possession</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{profile.key_metrics?.fouls_per_game || 'N/A'}</div>
              <div className="text-gray-500">Fouls/Game</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{profile.key_metrics?.cards_per_game || 'N/A'}</div>
              <div className="text-gray-500">Cards/Game</div>
            </div>
          </div>
        </Card>

        {/* Tactical Overlays */}
        {profile.axis_tags?.overlays && profile.axis_tags.overlays.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium mb-3">Tactical Characteristics</h4>
            <div className="flex flex-wrap gap-2">
              {profile.axis_tags.overlays.map((overlay, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {overlay}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderConsistencyAnalysis = (consistency) => {
    if (!consistency) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Tactical Consistency</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Consistency Score</span>
                <span className="font-bold">{(consistency.archetype_consistency * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${consistency.archetype_consistency * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Primary style used in {Math.round(consistency.archetype_consistency * teamData.analysis_period.total_matches)} of {teamData.analysis_period.total_matches} matches
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Style Variations</h4>
          <div className="space-y-2">
            {Object.entries(consistency.archetype_distribution || {}).map(([style, count]) => (
              <div key={style} className="flex justify-between text-sm">
                <span className="truncate mr-2">{style}</span>
                <span className="font-mono">{count} matches</span>
              </div>
            ))}
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
            Team Tactical Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select a team and optionally filter by competitions/seasons to analyze average tactical approach
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Team</label>
            <select
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={teamsLoading}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                {teamsLoading 
                  ? "Loading teams..." 
                  : availableTeams.length > 0 
                    ? "Select a team..." 
                    : "No teams available"}
              </option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            {availableTeams.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {availableTeams.length} teams available from StatsBomb data
              </p>
            )}
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Filter by Competitions (Optional)
              </label>
              <select
                multiple
                value={selectedCompetitions}
                onChange={(e) => setSelectedCompetitions(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableCompetitions.map((comp) => (
                  <option key={comp.competition_id} value={comp.competition_id}>
                    {comp.competition_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Season Range (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Start season ID"
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    // This would be used for season range filtering
                  }}
                />
                <input
                  type="number"
                  placeholder="End season ID"
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    // This would be used for season range filtering
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty to analyze all available seasons</p>
            </div>
          </div>

          {/* Analysis Button */}
          <div className="flex justify-end">
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
          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{teamData.team_name} - Tactical Analysis Overview</CardTitle>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Analysis based on {teamData.analysis_period.total_matches} matches</p>
                <p>Competitions: {teamData.analysis_period.competitions.join(', ')}</p>
                <p>Seasons: {teamData.analysis_period.seasons.join(', ')}</p>
                {teamData.analysis_period.date_range.start && (
                  <p>Period: {teamData.analysis_period.date_range.start} to {teamData.analysis_period.date_range.end}</p>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Average Tactical Profile */}
          {teamData.average_tactical_profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Average Tactical Profile
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Calculated from averaged statistics across all analyzed matches
                </p>
              </CardHeader>
              <CardContent>
                {renderAverageTacticalProfile(teamData.average_tactical_profile)}
              </CardContent>
            </Card>
          )}

          {/* Consistency Analysis */}
          {teamData.consistency_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tactical Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderConsistencyAnalysis(teamData.consistency_analysis)}
              </CardContent>
            </Card>
          )}

          {/* Recent Matches */}
          {teamData.recent_matches && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderRecentMatches(teamData.recent_matches)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamBreakdown;