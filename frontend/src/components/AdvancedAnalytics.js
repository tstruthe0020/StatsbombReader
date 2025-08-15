import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock, 
  Scale, 
  Target,
  Zap,
  Home,
  Award,
  Activity
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const AdvancedAnalytics = () => {
  const [cardPatterns, setCardPatterns] = useState(null);
  const [advantagePatterns, setAdvantagePatterns] = useState(null);
  const [matchFlow, setMatchFlow] = useState(null);
  const [positionalBias, setPositionalBias] = useState(null);
  const [fairnessAnalysis, setFairnessAnalysis] = useState(null);
  const [locationIntelligence, setLocationIntelligence] = useState(null);
  const [competitionComparison, setCompetitionComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { url: '/api/analytics/cards/patterns', setter: setCardPatterns },
        { url: '/api/analytics/advantage/patterns', setter: setAdvantagePatterns },
        { url: '/api/analytics/match-flow/timing', setter: setMatchFlow },
        { url: '/api/analytics/positional/bias', setter: setPositionalBias },
        { url: '/api/analytics/consistency/fairness', setter: setFairnessAnalysis },
        { url: '/api/analytics/location/intelligence', setter: setLocationIntelligence },
        { url: '/api/analytics/competition/comparison', setter: setCompetitionComparison }
      ];

      const promises = endpoints.map(async ({ url, setter }) => {
        try {
          const response = await axios.get(`${API_BASE_URL}${url}`);
          if (response.data.success) {
            setter(response.data.data);
          }
        } catch (error) {
          console.error(`Failed to load ${url}:`, error);
        }
      });

      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardContent className="pm-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <Icon className={`w-8 h-8 text-${color}-500`} />
        </div>
      </CardContent>
    </Card>
  );

  const TimeDistributionChart = ({ data }) => (
    <div className="space-y-3">
      {Object.entries(data).map(([period, count]) => (
        <div key={period} className="flex items-center justify-between">
          <span className="text-sm font-medium">{period}</span>
          <div className="flex items-center gap-3 flex-1 ml-4">
            <Progress value={(count / Math.max(...Object.values(data))) * 100} className="flex-1" />
            <span className="text-sm font-semibold min-w-0">{count}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading advanced analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🔬 Advanced Referee Analytics
        </h2>
        <p className="text-gray-600 mt-2">Deep insights into referee decision patterns and behaviors</p>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 bg-white shadow-sm">
          <TabsTrigger value="cards" className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="advantage" className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Advantage
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="fairness" className="flex items-center gap-1">
            <Scale className="w-4 h-4" />
            Fairness
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="competitions" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            Competitions
          </TabsTrigger>
        </TabsList>

        {/* Card Patterns Analysis */}
        <TabsContent value="cards" className="space-y-6">
          {cardPatterns && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Cards"
                  value={cardPatterns.summary.total_cards}
                  subtitle={`${cardPatterns.summary.cards_per_match} per match`}
                  icon={Award}
                  color="red"
                />
                <StatCard
                  title="Yellow Cards"
                  value={cardPatterns.summary.yellow_cards}
                  subtitle={`${Math.round((cardPatterns.summary.yellow_cards / cardPatterns.summary.total_cards) * 100)}% of total`}
                  icon={Target}
                  color="yellow"
                />
                <StatCard
                  title="Red Cards"
                  value={cardPatterns.summary.red_cards}
                  subtitle={`${Math.round((cardPatterns.summary.red_cards / cardPatterns.summary.total_cards) * 100)}% of total`}
                  icon={Target}
                  color="red"
                />
                <StatCard
                  title="Matches Analyzed"
                  value={cardPatterns.summary.matches_analyzed}
                  subtitle="Sample size"
                  icon={Activity}
                  color="blue"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Card Distribution by Time
                    </CardTitle>
                    <CardDescription>When referees typically give cards during matches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TimeDistributionChart data={cardPatterns.time_distribution} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Home vs Away Bias
                    </CardTitle>
                    <CardDescription>Card distribution between home and away teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Home Team Cards</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cardPatterns.home_away_bias.home_cards}</Badge>
                          <span className="text-sm text-gray-600">
                            ({cardPatterns.home_away_bias.home_percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Away Team Cards</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cardPatterns.home_away_bias.away_cards}</Badge>
                          <span className="text-sm text-gray-600">
                            ({cardPatterns.home_away_bias.away_percentage}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={cardPatterns.home_away_bias.home_percentage} 
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {Math.abs(cardPatterns.home_away_bias.home_percentage - 50) > 10 
                          ? `${cardPatterns.home_away_bias.home_percentage > 50 ? 'Home' : 'Away'} team bias detected`
                          : 'Balanced card distribution'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Position Analysis
                  </CardTitle>
                  <CardDescription>Which positions receive the most cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(cardPatterns.position_analysis).slice(0, 8).map(([position, stats]) => (
                      <div key={position} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{position}</p>
                          <p className="text-sm text-gray-600">
                            {stats.yellow}Y, {stats.red}R
                          </p>
                        </div>
                        <Badge className="bg-red-500">{stats.total}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Advantage Play Analysis */}
        <TabsContent value="advantage" className="space-y-6">
          {advantagePatterns && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Fouls"
                  value={advantagePatterns.summary.total_fouls}
                  subtitle="Analyzed incidents"
                  icon={Target}
                  color="blue"
                />
                <StatCard
                  title="Advantages Played"
                  value={advantagePatterns.summary.advantages_played}
                  subtitle="Times advantage was given"
                  icon={Zap}
                  color="green"
                />
                <StatCard
                  title="Advantage Rate"
                  value={`${advantagePatterns.summary.advantage_rate_percentage}%`}
                  subtitle="Percentage of fouls"
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="Philosophy"
                  value={advantagePatterns.referee_philosophy.lenient ? "Lenient" : 
                         advantagePatterns.referee_philosophy.strict ? "Strict" : "Balanced"}
                  subtitle={`${advantagePatterns.referee_philosophy.philosophy_score}% rate`}
                  icon={Scale}
                  color="indigo"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location-Based Advantage
                    </CardTitle>
                    <CardDescription>Where referees play advantage most often</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(advantagePatterns.location_analysis).map(([zone, count]) => (
                        <div key={zone} className="flex items-center justify-between">
                          <span className="font-medium">{zone}</span>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={(count / Math.max(...Object.values(advantagePatterns.location_analysis))) * 100} 
                              className="w-24"
                            />
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Time-Based Patterns
                    </CardTitle>
                    <CardDescription>Advantage decisions by match period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(advantagePatterns.time_patterns).map(([period, count]) => (
                        <div key={period} className="flex items-center justify-between">
                          <span className="font-medium">{period}</span>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={(count / Math.max(...Object.values(advantagePatterns.time_patterns))) * 100}
                              className="w-32"
                            />
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Match Flow & Timing */}
        <TabsContent value="timing" className="space-y-6">
          {matchFlow && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Decisions"
                  value={matchFlow.summary.total_decisions}
                  subtitle="Referee interventions"
                  icon={Activity}
                  color="blue"
                />
                <StatCard
                  title="Per Match"
                  value={matchFlow.summary.decisions_per_match}
                  subtitle="Average decisions"
                  icon={BarChart3}
                  color="green"
                />
                <StatCard
                  title="Peak Periods"
                  value={matchFlow.rhythm_analysis.high_activity_periods}
                  subtitle="High activity intervals"
                  icon={TrendingUp}
                  color="red"
                />
                <StatCard
                  title="Quiet Periods"
                  value={matchFlow.rhythm_analysis.low_activity_periods}
                  subtitle="Low activity intervals"
                  icon={Clock}
                  color="gray"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Critical Moments Analysis</CardTitle>
                  <CardDescription>Referee activity during high-pressure periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {matchFlow.critical_moments.first_half_critical}
                      </p>
                      <p className="text-sm text-gray-600">First Half Critical (36-45 min)</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {matchFlow.critical_moments.second_half_critical}
                      </p>
                      <p className="text-sm text-gray-600">Second Half Critical (81-90+ min)</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {matchFlow.critical_moments.regular_time}
                      </p>
                      <p className="text-sm text-gray-600">Regular Time Decisions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Decision Periods</CardTitle>
                  <CardDescription>5-minute intervals with highest referee activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {matchFlow.peak_periods.map((period, index) => (
                      <div key={period.period} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{period.period} minutes</span>
                        </div>
                        <Badge className="bg-blue-500">{period.decisions} decisions</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Add more tab contents for other analyses... */}
        {/* This is a comprehensive starting point - we can expand the other tabs similarly */}
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;