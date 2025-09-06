import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Target, 
  Clock, 
  MapPin, 
  Zap, 
  Brain,
  Eye,
  Shield,
  Crosshair,
  Layers
} from 'lucide-react';
import {
  FormationBiasVisualization,
  RefereePositioningVisualization,
  SpatialFoulContextVisualization,
  PressureAnalysisVisualization,
  TacticalBiasRadarChart
} from './SpatialVisualizations';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

const SpatialAnalysis = () => {
  const [analysisType, setAnalysisType] = useState('formation-bias');
  const [selectedMatch, setSelectedMatch] = useState('3788741');
  const [selectedReferee, setSelectedReferee] = useState('ref_001');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  const analysisTypes = [
    { 
      id: 'formation-bias', 
      label: 'Formation Tactical Performance', 
      icon: Shield,
      description: 'Per-game decisions & foul locations by formation'
    },
    { 
      id: 'referee-positioning', 
      label: 'Interactive Referee Positioning', 
      icon: Crosshair,
      description: 'Detailed positioning analysis with filtering'
    },
    { 
      id: 'foul-context', 
      label: 'Foul Frequency Heatmap', 
      icon: Layers,
      description: 'Where referees call fouls vs league average'
    },
    { 
      id: 'pressure-analysis', 
      label: 'Team Pressure Events', 
      icon: Target,
      description: 'Pressure events from match event data'
    }
  ];

  const refereeOptions = [
    { id: 'ref_001', name: 'Antonio Mateu Lahoz' },
    { id: 'ref_002', name: 'Björn Kuipers' },
    { id: 'ref_003', name: 'Daniele Orsato' },
    { id: 'ref_004', name: 'Clément Turpin' },
    { id: 'ref_005', name: 'Michael Oliver' }
  ];

  const matchOptions = [
    { id: '3788741', label: 'La Liga Match 1' },
    { id: '3788742', label: 'La Liga Match 2' },
    { id: '3788743', label: 'Champions League Match' }
  ];

  const fetchAnalysisData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      
      if (analysisType === 'formation-bias' || analysisType === 'referee-positioning') {
        endpoint = `/api/analytics/360/${analysisType}/${selectedReferee}`;
      } else {
        endpoint = `/api/analytics/360/${analysisType}/${selectedMatch}`;
      }
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      if (response.data.success) {
        setAnalysisData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching spatial analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [analysisType, selectedMatch, selectedReferee]);

  const renderFormationBiasAnalysis = () => {
    if (!analysisData?.formation_bias_analysis) return null;

    return (
      <div className="space-y-6">
        {/* Formation Bias Visualizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Formation Analysis Visualizations
            </CardTitle>
            <CardDescription>
              Visual representation of {analysisData.referee_name}'s bias toward different formations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormationBiasVisualization formationData={analysisData.formation_bias_analysis} />
          </CardContent>
        </Card>

        {/* Tactical Bias Radar Chart */}
        <TacticalBiasRadarChart tacticalData={analysisData.tactical_bias_scores} />

        {/* Tactical Preference Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Tactical Preference Analysis
            </CardTitle>
            <CardDescription>
              {analysisData.referee_name}'s bias toward different tactical approaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analysisData.tactical_preference?.preferred_style || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Preferred Style</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(analysisData.tactical_preference?.preference_strength * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Bias Strength</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analysisData.summary_statistics?.formations_analyzed || 0}
                </div>
                <div className="text-sm text-gray-600">Formations Analyzed</div>
              </div>
            </div>
            
            {/* Formation Bias Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analysisData.formation_bias_analysis).map(([formation, data]) => {
                const biasColor = data.bias_score > 0.6 ? 'bg-green-50 border-green-200' :
                                data.bias_score < 0.4 ? 'bg-red-50 border-red-200' :
                                'bg-yellow-50 border-yellow-200';
                
                return (
                  <div key={formation} className={`p-4 rounded-lg border ${biasColor}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{formation}</h3>
                      <Badge variant="outline" className="text-xs">
                        {data.formation_type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bias Score:</span>
                        <span className="font-bold">{data.bias_score}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Category:</span>
                        <Badge className={`text-xs ${
                          data.bias_category.includes('Favorable') ? 'bg-green-500' :
                          data.bias_category.includes('Unfavorable') ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}>
                          {data.bias_category}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Decisions:</span>
                        <span>{data.total_decisions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Penalty Rate:</span>
                        <span>{data.penalty_rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysisData.key_insights?.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRefereePositioning = () => {
    if (!analysisData?.positioning_metrics) return null;

    return (
      <div className="space-y-6">
        {/* Positioning Visualization */}
        <RefereePositioningVisualization positioningData={analysisData} />

        {/* Positioning Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="w-5 h-5" />
              Positioning Analysis - {analysisData.referee_name}
            </CardTitle>
            <CardDescription>
              Analysis of referee positioning and decision-making accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analysisData.positioning_metrics.optimal_positioning_rate}%
                </div>
                <div className="text-sm text-gray-600">Optimal Positioning</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analysisData.positioning_metrics.sight_line_accuracy}%
                </div>
                <div className="text-sm text-gray-600">Sight Line Accuracy</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {analysisData.positioning_metrics.average_distance_from_optimal}m
                </div>
                <div className="text-sm text-gray-600">Avg Distance from Optimal</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analysisData.positioning_grade}
                </div>
                <div className="text-sm text-gray-600">Positioning Grade</div>
              </div>
            </div>

            {/* Recommendations */}
            {analysisData.recommendations && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Recommendations:</h3>
                <ul className="space-y-1">
                  {analysisData.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Target className="w-3 h-3 mt-1 text-blue-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFoulContext = () => {
    if (!analysisData) return null;

    return (
      <div className="space-y-6">
        {/* Spatial Context Visualization */}
        {analysisData.has_360_data && (
          <SpatialFoulContextVisualization spatialData={analysisData} />
        )}

        {/* Match Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Spatial Foul Context - Match {analysisData.match_id}
            </CardTitle>
            <CardDescription>
              {analysisData.has_360_data ? 
                `Analysis based on 360° freeze-frame data (${analysisData.coverage_percentage}% coverage)` :
                'Basic foul analysis - 360° data not available'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analysisData.total_fouls}
                </div>
                <div className="text-sm text-gray-600">Total Fouls</div>
              </div>
              {analysisData.has_360_data && (
                <>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisData.fouls_with_spatial_data}
                    </div>
                    <div className="text-sm text-gray-600">With 360° Data</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysisData.aggregate_statistics?.high_pressure_fouls || 0}
                    </div>
                    <div className="text-sm text-gray-600">High Pressure</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisData.aggregate_statistics?.crowded_area_fouls || 0}
                    </div>
                    <div className="text-sm text-gray-600">Crowded Areas</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Insights */}
        {analysisData.summary && (
          <Card>
            <CardHeader>
              <CardTitle>Match Context Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Pressure Context</div>
                    <div className="text-sm text-gray-600">{analysisData.summary.most_common_foul_context}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">Spatial Distribution</div>
                    <div className="text-sm text-gray-600">{analysisData.summary.crowded_vs_open}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderPressureAnalysis = () => {
    if (!analysisData) return null;

    return (
      <div className="space-y-6">
        {/* Interactive Pressure Events Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Team Pressure Events</CardTitle>
            <CardDescription>
              Pressure events from StatsBomb match event data with player filtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PressureAnalysisVisualization pressureData={analysisData} />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analysis Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            360° Spatial Analysis
          </CardTitle>
          <CardDescription>
            Advanced referee analytics using StatsBomb 360° freeze-frame data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {analysisTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <Button
                  key={type.id}
                  onClick={() => setAnalysisType(type.id)}
                  variant={analysisType === type.id ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <IconComponent className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs opacity-70">{type.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Parameter Selection */}
          <div className="flex flex-wrap gap-4">
            {(analysisType === 'formation-bias' || analysisType === 'referee-positioning') && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Referee:</span>
                <select 
                  value={selectedReferee} 
                  onChange={(e) => setSelectedReferee(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {refereeOptions.map(ref => (
                    <option key={ref.id} value={ref.id}>{ref.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {(analysisType === 'foul-context' || analysisType === 'pressure-analysis') && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Match:</span>
                <select 
                  value={selectedMatch} 
                  onChange={(e) => setSelectedMatch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {matchOptions.map(match => (
                    <option key={match.id} value={match.id}>{match.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Analysis Results */}
      {!loading && analysisData && (
        <>
          {analysisType === 'formation-bias' && renderFormationBiasAnalysis()}
          {analysisType === 'referee-positioning' && renderRefereePositioning()}
          {analysisType === 'foul-context' && renderFoulContext()}
          {analysisType === 'pressure-analysis' && renderPressureAnalysis()}
        </>
      )}
    </div>
  );
};

export default SpatialAnalysis;