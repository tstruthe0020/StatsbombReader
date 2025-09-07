import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Search, Users, MapPin, Target, Clock, Activity, 
  TrendingUp, AlertTriangle, BarChart3, Calendar, Trophy
} from 'lucide-react';
import FoulMap from './FoulMap';
import LineupViewer from './LineupViewer';
import MatchStats from './MatchStats';
import TacticalProfile from './TacticalProfile';

const MatchViewer = () => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/competitions`);
      if (response.data && response.data.success) {
        setCompetitions(response.data.data);
        setError(null);
      } else {
        setError('Failed to load competitions');
      }
    } catch (err) {
      setError('Error connecting to server. Please check if the backend is running.');
      console.error('Error fetching competitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (competitionId, seasonId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/competitions/${competitionId}/seasons/${seasonId}/matches`);
      if (response.data && response.data.success) {
        setMatches(response.data.data);
        setError(null);
      } else {
        setError('Failed to load matches');
      }
    } catch (err) {
      setError('Error loading matches');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tactical analysis (includes lineups, formations, stats)
      const tacticalResponse = await axios.get(`${API_BASE_URL}/api/matches/${matchId}/tactical-analysis`);
      
      if (tacticalResponse.data && tacticalResponse.data.success) {
        setMatchDetails(tacticalResponse.data.data);
      } else {
        setError('Failed to load match details');
      }
    } catch (err) {
      setError('Error loading match details');
      console.error('Error fetching match details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompetitionChange = (competitionValue) => {
    const [competitionId, seasonId] = competitionValue.split('-');
    setSelectedCompetition(competitionId);
    setSelectedSeason(seasonId);
    setSelectedMatch(null);
    setMatchDetails(null);
    setMatches([]);
    fetchMatches(parseInt(competitionId), parseInt(seasonId));
  };

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    fetchMatchDetails(match.match_id);
  };

  // Filter matches based on search term
  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.home_team?.home_team_name?.toLowerCase().includes(searchLower) ||
      match.away_team?.away_team_name?.toLowerCase().includes(searchLower) ||
      match.match_date?.includes(searchTerm)
    );
  });

  // Group competitions by competition name and season
  const competitionOptions = competitions.reduce((acc, comp) => {
    const key = `${comp.competition_name} (${comp.season_name})`;
    const value = `${comp.competition_id}-${comp.season_id}`;
    if (!acc.some(item => item.value === value)) {
      acc.push({ label: key, value: value, competition: comp });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Match Viewer
          </CardTitle>
          <CardDescription>
            Search and analyze matches with detailed tactical information, lineups, and foul patterns
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Match Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competition & Season Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Competition & Season
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleCompetitionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose competition and season..." />
              </SelectTrigger>
              <SelectContent>
                {competitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Match Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by team name or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </CardContent>
        </Card>
      )}

      {/* Match List */}
      {selectedCompetition && selectedSeason && filteredMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Matches ({filteredMatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredMatches.map((match) => (
                <div
                  key={match.match_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedMatch?.match_id === match.match_id 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => handleMatchSelect(match)}
                >
                  <div className="text-sm font-semibold mb-2">
                    {match.home_team?.home_team_name || 'Home Team'} vs {match.away_team?.away_team_name || 'Away Team'}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {match.match_date} | {match.kick_off}
                  </div>
                  {match.home_score !== undefined && match.away_score !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {match.home_score} - {match.away_score}
                    </Badge>
                  )}
                  {match.stadium && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {match.stadium.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Details */}
      {selectedMatch && matchDetails && (
        <div className="space-y-6">
          {/* Match Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {matchDetails.match_info.home_team} vs {matchDetails.match_info.away_team}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {matchDetails.match_info.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {matchDetails.match_info.venue}
                </span>
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Referee:</span>
                  <span className="text-sm font-semibold text-blue-700">{matchDetails.match_info.referee}</span>
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Lineups and Formations */}
              <LineupViewer formations={matchDetails.formations} />
              
              {/* Match Statistics */}
              <MatchStats 
                homeTeam={matchDetails.match_info.home_team}
                awayTeam={matchDetails.match_info.away_team}
                homeStats={matchDetails.tactical_metrics.home_team}
                awayStats={matchDetails.tactical_metrics.away_team}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Foul Map */}
              <FoulMap 
                matchId={selectedMatch.match_id} 
                homeTeam={matchDetails.match_info.home_team}
                awayTeam={matchDetails.match_info.away_team}
              />
              
              {/* Tactical Profile */}
              <TacticalProfile 
                homeTeam={matchDetails.match_info.home_team}
                awayTeam={matchDetails.match_info.away_team}
                matchId={selectedMatch.match_id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedCompetition && selectedSeason && filteredMatches.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No matches found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or select a different competition.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchViewer;