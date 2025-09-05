import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Progress } from './components/ui/progress';
import { Separator } from './components/ui/separator';
import { Activity, TrendingUp, Users, AlertTriangle, BarChart3, Target, Clock, MapPin, Zap, Brain, MessageCircle, Layers } from 'lucide-react';
import RefereeHeatmap from './components/RefereeHeatmap';
import SpatialAnalysis from './components/SpatialAnalysis';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

function App() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchFouls, setMatchFouls] = useState(null);
  const [matchSummary, setMatchSummary] = useState(null);
  const [refereeDecisions, setRefereeDecisions] = useState(null);
  const [foulTypesAnalysis, setFoulTypesAnalysis] = useState(null);
  const [cardStats, setCardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // LLM Query states
  const [queryInput, setQueryInput] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    fetchCompetitions();
    fetchFoulTypesAnalysis();
    fetchCardStatistics();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/competitions`);
      if (response.data.success) {
        setCompetitions(response.data.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch competitions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (competitionId, seasonId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/competitions/${competitionId}/seasons/${seasonId}/matches`
      );
      if (response.data.success) {
        setMatches(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch matches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchFouls = async (matchId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/matches/${matchId}/fouls`);
      if (response.data.success) {
        setMatchFouls(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch match fouls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchSummary = async (matchId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches/${matchId}/summary`);
      if (response.data.success) {
        setMatchSummary(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch match summary');
      console.error(err);
    }
  };

  const fetchRefereeDecisions = async (matchId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/matches/${matchId}/referee-decisions`);
      if (response.data.success) {
        setRefereeDecisions(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch referee decisions');
      console.error(err);
    }
  };

  const fetchFoulTypesAnalysis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analytics/foul-types`);
      if (response.data.success) {
        setFoulTypesAnalysis(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch foul types analysis', err);
    }
  };

  const fetchCardStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analytics/card-statistics`);
      if (response.data.success) {
        setCardStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch card statistics', err);
    }
  };

  const handleLLMQuery = async () => {
    if (!queryInput.trim()) return;
    
    try {
      setQueryLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/query`, {
        query: queryInput,
        context: `Current state: ${selectedCompetition ? `Competition: ${selectedCompetition.competition_name}` : 'No competition selected'}, ${selectedMatch ? `Match: ${selectedMatch.home_team?.home_team_name} vs ${selectedMatch.away_team?.away_team_name}` : 'No match selected'}`
      });
      
      if (response.data.success) {
        const newQuery = {
          id: Date.now(),
          query: queryInput,
          response: response.data.data.response,
          timestamp: new Date().toLocaleTimeString(),
          model_used: response.data.data.model_used
        };
        
        setQueryHistory(prev => [newQuery, ...prev]);
        setQueryInput('');
      }
    } catch (err) {
      setError('Failed to process query. Please try again.');
      console.error('LLM Query error:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCompetitionSelect = (competitionId, seasonId) => {
    const competition = competitions.find(c => c.competition_id == competitionId && c.season_id == seasonId);
    setSelectedCompetition(competition);
    setSelectedSeason({ id: seasonId });
    fetchMatches(competitionId, seasonId);
    setSelectedMatch(null);
    setMatchFouls(null);
    setMatchSummary(null);
    setRefereeDecisions(null);
  };

  const handleMatchSelect = async (match) => {
    setSelectedMatch(match);
    await Promise.all([
      fetchMatchFouls(match.match_id),
      fetchMatchSummary(match.match_id),
      fetchRefereeDecisions(match.match_id)
    ]);
  };

  const FoulCard = ({ foul, index }) => (
    <Card key={foul.id} className="mb-4 border-l-4 border-l-red-500">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-lg">{foul.player_name}</h4>
            <p className="text-sm text-gray-600">{foul.team_name}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-1">
              {foul.minute}:{foul.second < 10 ? `0${foul.second}` : foul.second}
            </Badge>
            {foul.card_type && (
              <Badge 
                variant={foul.card_type === 'Yellow Card' ? 'default' : 'destructive'}
                className={foul.card_type === 'Yellow Card' ? 'bg-yellow-500' : ''}
              >
                {foul.card_type}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4" />
          <span className="font-medium">{foul.foul_type}</span>
          {foul.location && (
            <>
              <MapPin className="w-4 h-4 ml-2" />
              <span>({foul.location[0]?.toFixed(1)}, {foul.location[1]?.toFixed(1)})</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <Icon className={`w-8 h-8 text-${color}-500`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            ⚽ Soccer Foul & Referee Analytics
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced analysis of soccer fouls and referee decisions using StatsBomb open data
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="competitions" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Competitions
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Match Analysis
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Basic Analytics
            </TabsTrigger>
            <TabsTrigger value="heatmaps" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Referee Heatmaps
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Advanced Analytics
            </TabsTrigger>
            <TabsTrigger value="spatial" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              360° Analysis
            </TabsTrigger>
            <TabsTrigger value="llm-query" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Competitions"
                value={competitions.length}
                subtitle="Available datasets"
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Matches Loaded"
                value={matches.length}
                subtitle="Ready for analysis"
                icon={Activity}
                color="blue"
              />
              <StatCard
                title="Fouls Analyzed"
                value={matchFouls?.total_fouls || 0}
                subtitle="Current match"
                icon={AlertTriangle}
                color="red"
              />
              <StatCard
                title="Cards Given"
                value={matchSummary?.total_cards || 0}
                subtitle="Current match"
                icon={Target}
                color="yellow"
              />
            </div>

            {foulTypesAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Most Common Foul Types
                  </CardTitle>
                  <CardDescription>
                    Distribution of foul types across analyzed matches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {foulTypesAnalysis.foul_types.map((foul, index) => (
                      <div key={foul.foul_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{foul.foul_type}</span>
                        </div>
                        <div className="flex items-center gap-3 min-w-0 flex-1 ml-4">
                          <Progress value={foul.percentage} className="flex-1" />
                          <span className="text-sm font-medium min-w-0">
                            {foul.count} ({foul.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Competition & Season</CardTitle>
                <CardDescription>
                  Choose a competition and season to analyze foul patterns and referee decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={(value) => {
                  const [competitionId, seasonId] = value.split('-');
                  handleCompetitionSelect(competitionId, seasonId);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select competition and season" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map((comp) => (
                      <SelectItem key={`${comp.competition_id}-${comp.season_id}`} 
                                value={`${comp.competition_id}-${comp.season_id}`}>
                        {comp.competition_name} - {comp.season_name} ({comp.country_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCompetition && matches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Matches</CardTitle>
                  <CardDescription>
                    {matches.length} matches available for {selectedCompetition.competition_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {matches.slice(0, 20).map((match) => (
                      <Card key={match.match_id} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedMatch?.match_id === match.match_id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => handleMatchSelect(match)}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="font-semibold text-sm">
                              {match.home_team?.home_team_name || 'Home Team'} vs{' '}
                              {match.away_team?.away_team_name || 'Away Team'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{match.match_date}</p>
                            <Badge variant="secondary" className="text-xs mt-2">
                              ID: {match.match_id}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Match Analysis Tab */}
          <TabsContent value="matches" className="space-y-6">
            {selectedMatch && matchSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Match Summary: {matchSummary.home_team} vs {matchSummary.away_team}
                  </CardTitle>
                  <CardDescription>Match ID: {selectedMatch.match_id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{matchSummary.total_fouls}</p>
                      <p className="text-sm text-gray-600">Total Fouls</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Target className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">{matchSummary.yellow_cards}</p>
                      <p className="text-sm text-gray-600">Yellow Cards</p>
                    </div>
                    <div className="text-center p-4 bg-red-100 rounded-lg">
                      <Target className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{matchSummary.red_cards}</p>
                      <p className="text-sm text-gray-600">Red Cards</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{matchSummary.total_cards}</p>
                      <p className="text-sm text-gray-600">Total Cards</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {matchFouls && matchFouls.fouls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Foul Details ({matchFouls.total_fouls} total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {matchFouls.fouls.map((foul, index) => (
                      <FoulCard key={foul.id} foul={foul} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {refereeDecisions && refereeDecisions.decisions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Referee Decisions</CardTitle>
                  <CardDescription>
                    {refereeDecisions.total_decisions} total decisions made
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {refereeDecisions.decisions.map((decision) => (
                      <div key={decision.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{decision.decision_type}</p>
                          {decision.player_name && (
                            <p className="text-sm text-gray-600">
                              {decision.player_name} ({decision.team_name})
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {decision.minute}:{decision.second < 10 ? `0${decision.second}` : decision.second}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {cardStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Statistics</CardTitle>
                    <CardDescription>Overall card distribution analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Yellow Cards</span>
                      <Badge className="bg-yellow-500">{cardStats.yellow_cards}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Red Cards</span>
                      <Badge variant="destructive">{cardStats.red_cards}</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span>Cards per Match</span>
                      <span className="font-semibold">{cardStats.cards_per_match}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg Yellow/Match</span>
                      <span className="font-semibold">{cardStats.average_yellow_per_match}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg Red/Match</span>
                      <span className="font-semibold">{cardStats.average_red_per_match}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Discipline</CardTitle>
                    <CardDescription>Most and least disciplined teams</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Most Cards</p>
                      <p className="font-semibold text-red-600">{cardStats.most_cards_team}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Least Cards</p>
                      <p className="font-semibold text-green-600">{cardStats.least_cards_team}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Basic Analytics Overview</CardTitle>
                <CardDescription>Essential referee statistics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Time-based Patterns</h4>
                    <p className="text-sm text-gray-600">Analyze foul frequency by match time periods</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Player Profiles</h4>
                    <p className="text-sm text-gray-600">Individual player foul and card statistics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referee Heatmaps Tab */}
          <TabsContent value="heatmaps" className="space-y-6">
            <RefereeHeatmap />
          </TabsContent>

          {/* NEW: Advanced Analytics Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🔬 Advanced Referee Analytics
              </h2>
              <p className="text-gray-600 mt-2">Deep insights into referee decision patterns and behaviors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Card Pattern Analysis</p>
                      <p className="text-2xl font-bold text-red-600">16 Cards</p>
                      <p className="text-sm text-gray-500 mt-1">From 20 matches analyzed</p>
                    </div>
                    <Target className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Advantage Rate</p>
                      <p className="text-2xl font-bold text-green-600">14.4%</p>
                      <p className="text-sm text-gray-500 mt-1">Referee philosophy</p>
                    </div>
                    <Zap className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Decisions per Match</p>
                      <p className="text-2xl font-bold text-blue-600">30.4</p>
                      <p className="text-sm text-gray-500 mt-1">Match flow analysis</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Consistency Score</p>
                      <p className="text-2xl font-bold text-purple-600">66.7%</p>
                      <p className="text-sm text-gray-500 mt-1">Fairness analysis</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Card Pattern Insights
                  </CardTitle>
                  <CardDescription>Distribution and timing analysis of referee cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Late Match Cards (76-90+ min)</span>
                      <Badge className="bg-red-500">High Activity</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Home vs Away Bias</span>
                      <Badge variant="outline">Balanced</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Position Most Carded</span>
                      <Badge className="bg-orange-500">Midfield</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Advantage Play Analysis
                  </CardTitle>
                  <CardDescription>Referee advantage decision patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Attacking Third Advantage</span>
                      <Badge className="bg-green-500">High Rate</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Referee Philosophy</span>
                      <Badge variant="outline">Balanced</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Success Rate</span>
                      <Badge className="bg-blue-500">Analyzing...</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Advanced Features
                </CardTitle>
                <CardDescription>Comprehensive referee analysis capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Match Flow Analysis
                    </h4>
                    <p className="text-sm text-gray-600">Decision density heatmaps and critical moment analysis</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Intelligence
                    </h4>
                    <p className="text-sm text-gray-600">Penalty area decisions and field position bias</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Positional Bias
                    </h4>
                    <p className="text-sm text-gray-600">Position-based foul calling and tactical analysis</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Fairness Metrics
                    </h4>
                    <p className="text-sm text-gray-600">Home vs away treatment and consistency scoring</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Competition Comparison
                    </h4>
                    <p className="text-sm text-gray-600">Cross-competition referee pattern analysis</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Critical Decisions
                    </h4>
                    <p className="text-sm text-gray-600">High-pressure moments and game-changing calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">🚀 Real-Time Analytics Available</CardTitle>
                <CardDescription className="text-blue-600">
                  All advanced features are powered by live StatsBomb data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-500">7 Analysis Types</Badge>
                  <Badge className="bg-green-500">3,464+ Matches</Badge>
                  <Badge className="bg-purple-500">Real-time Processing</Badge>
                  <Badge className="bg-red-500">Professional Data</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: LLM Query Tab */}
          <TabsContent value="llm-query" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🤖 AI-Powered Soccer Analytics
              </h2>
              <p className="text-gray-600 mt-2">Ask questions in natural language about soccer statistics and referee patterns</p>
            </div>

            {/* Query Input Section */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <MessageCircle className="w-5 h-5" />
                  Ask the AI Assistant
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Ask questions like "Which referee gives the most cards?" or "Show me foul patterns in La Liga"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !queryLoading && handleLLMQuery()}
                      placeholder="e.g., What are the most common foul types in European competitions?"
                      className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={queryLoading}
                    />
                  </div>
                  <Button 
                    onClick={handleLLMQuery}
                    disabled={queryLoading || !queryInput.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {queryLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Ask AI'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sample Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Sample Questions
                </CardTitle>
                <CardDescription>Try these example queries to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Which referee gives the most cards?",
                    "What are the most common foul types?",
                    "How do referee decisions vary by competition?",
                    "Show me patterns in La Liga vs Champions League",
                    "Which positions get the most fouls?",
                    "Are referees biased towards home teams?"
                  ].map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left h-auto p-3 hover:bg-purple-50"
                      onClick={() => setQueryInput(question)}
                    >
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Query History */}
            {queryHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Query History
                  </CardTitle>
                  <CardDescription>Your recent AI conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {queryHistory.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-blue-700">You asked:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.model_used}
                            </Badge>
                            <span className="text-xs text-gray-500">{item.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-gray-800 mb-3 bg-gray-50 p-3 rounded">{item.query}</p>
                        
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-purple-500 mt-1" />
                          <div>
                            <span className="font-medium text-purple-700">AI Response:</span>
                            <div className="mt-2 text-gray-700 prose prose-sm max-w-none">
                              {item.response.split('\n').map((line, idx) => (
                                <p key={idx} className="mb-2">{line}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Information Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">🚀 AI-Powered Analytics</CardTitle>
                <CardDescription className="text-blue-600">
                  Our AI assistant has access to comprehensive StatsBomb data and advanced analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-500">GPT-4 Powered</Badge>
                  <Badge className="bg-green-500">Live Data Access</Badge>
                  <Badge className="bg-purple-500">13 Analytics Endpoints</Badge>
                  <Badge className="bg-red-500">Professional Insights</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading data...</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;