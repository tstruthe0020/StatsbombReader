import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, TrendingUp, BarChart, Target, Shield, ArrowRight } from 'lucide-react';

const MatchBreakdown = () => {
  const [matchId, setMatchId] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchMatch = async () => {
    if (!matchId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/tactical/match/${matchId}/detailed`);
      const data = await response.json();
      
      if (data.success) {
        setMatchData(data);
      } else {
        setError(data.error || 'Failed to load match breakdown');
      }
    } catch (err) {
      setError('Unable to fetch match breakdown');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category, value, thresholds) => {
    // Return color based on which threshold range the value falls into
    if (!thresholds || !thresholds[category]) return 'bg-gray-100 text-gray-700';
    
    const categoryThresholds = thresholds[category];
    for (const [level, criteria] of Object.entries(categoryThresholds)) {
      const key = Object.keys(criteria)[0];
      const range = criteria[key];
      if (value >= range[0] && value <= range[1]) {
        return {
          'very_high': 'bg-red-100 text-red-800',
          'high': 'bg-orange-100 text-orange-800',
          'mid': 'bg-yellow-100 text-yellow-800',
          'low': 'bg-green-100 text-green-800',
          'possession_based': 'bg-blue-100 text-blue-800',
          'balanced': 'bg-purple-100 text-purple-800',
          'direct': 'bg-pink-100 text-pink-800'
        }[level] || 'bg-gray-100 text-gray-700';
      }
    }
    return 'bg-gray-100 text-gray-700';
  };

  const renderTeamBreakdown = (team, thresholds) => {
    if (!team) return null;

    const stats = team.detailed_stats || {};
    const categorization = team.categorization_breakdown || {};

    return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{team.team}</h3>
            <p className="text-sm text-gray-600">{team.home_away === 'home' ? 'Home' : 'Away'}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            team.style_archetype?.includes('High-Press') ? 'bg-red-100 text-red-800' :
            team.style_archetype?.includes('Low-Block') ? 'bg-blue-100 text-blue-800' :
            team.style_archetype?.includes('Possession') ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-700'
          }`}>
            {team.style_archetype || 'Unknown Style'}
          </div>
        </div>

        {/* Categorization Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pressing Analysis */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="font-medium">Pressing Intensity</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>PPDA:</span>
                <span className="font-mono">{stats.ppda?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Att. Third Def%:</span>
                <span className="font-mono">{((stats.def_share_att_third || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <Badge className={getCategoryColor('pressing', stats.ppda, thresholds)}>
                  {categorization.pressing || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Block Height Analysis */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Defensive Block</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Block Height:</span>
                <span className="font-mono">{stats.block_height_x?.toFixed(1) || 'N/A'}m</span>
              </div>
              <div className="flex justify-between">
                <span>Def. Third%:</span>
                <span className="font-mono">{((stats.def_share_def_third || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <Badge className={getCategoryColor('block', stats.block_height_x, thresholds)}>
                  {categorization.block || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Possession Style */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="h-4 w-4 text-green-500" />
              <span className="font-medium">Possession Style</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Possession%:</span>
                <span className="font-mono">{((stats.possession_share || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Directness:</span>
                <span className="font-mono">{stats.directness?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="mt-2">
                <Badge className={getCategoryColor('possession_directness', stats.possession_share, thresholds)}>
                  {categorization.possession_directness || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Width Usage */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Width Usage</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Wing Share:</span>
                <span className="font-mono">{((stats.wing_share || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Cross Share:</span>
                <span className="font-mono">{((stats.cross_share || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <Badge className={getCategoryColor('width', stats.wing_share, thresholds)}>
                  {categorization.width || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Transition Play */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Transitions</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Counter Rate:</span>
                <span className="font-mono">{((stats.counter_rate || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Long Pass%:</span>
                <span className="font-mono">{((stats.long_pass_share || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <Badge className={getCategoryColor('transition', stats.counter_rate, thresholds)}>
                  {categorization.transition || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Additional Metrics */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Additional Stats</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Fouls:</span>
                <span className="font-mono">{stats.fouls_committed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Cards:</span>
                <span className="font-mono">{(stats.yellows || 0) + (stats.reds || 0)}</span>
              </div>
              <div className="mt-2">
                {(categorization.overlays || []).map((overlay, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs mr-1">
                    {overlay}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter Match ID (e.g., 18243)"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchMatch()}
        />
        <Button onClick={searchMatch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Analyzing...' : 'Analyze Match'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Match Results */}
      {matchData && (
        <div className="space-y-6">
          {/* Match Header */}
          <Card>
            <CardHeader>
              <CardTitle>
                Match {matchData.match_id}: {matchData.match_info?.home_team} vs {matchData.match_info?.away_team}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {matchData.match_info?.match_date} • Referee: {matchData.match_info?.referee_name || 'Unknown'}
              </p>
            </CardHeader>
          </Card>

          {/* Tactical Contrast Summary */}
          {matchData.tactical_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tactical Matchup Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Style Comparison</h4>
                    <div className="space-y-1">
                      {matchData.tactical_summary.styles_comparison?.map((style, idx) => (
                        <div key={idx} className="text-sm">
                          {idx === 0 ? '🏠 Home: ' : '🛣️  Away: '}{style}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Tactical Contrast</h4>
                    <p className="text-sm text-gray-600">
                      {matchData.tactical_summary.tactical_contrast?.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Breakdowns */}
          {matchData.teams?.map((team, idx) => (
            <Card key={idx} className={idx === 0 ? 'border-blue-200' : 'border-red-200'}>
              <CardHeader>
                <CardTitle className={idx === 0 ? 'text-blue-800' : 'text-red-800'}>
                  {team.team} - Detailed Tactical Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderTeamBreakdown(team, matchData.categorization_thresholds)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchBreakdown;