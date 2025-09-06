import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Target, BarChart3, Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const RefereePlaystyleAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsStatus, setAnalyticsStatus] = useState(null);
  const [availableFeatures, setAvailableFeatures] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [teamFeatures, setTeamFeatures] = useState(null);
  const [foulPrediction, setFoulPrediction] = useState(null);
  const [refereeSlopes, setRefereeSlopes] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState('directness');
  const [selectedReferee, setSelectedReferee] = useState('');
  const [predictionInput, setPredictionInput] = useState({
    z_directness: 0,
    z_ppda: 0,
    z_possession_share: 0,
    z_wing_share: 0,
    referee_name: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Load analytics status on component mount
  useEffect(() => {
    loadAnalyticsStatus();
    loadAvailableFeatures();
  }, []);

  const loadAnalyticsStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/analytics/zone-models/status`);
      const data = await response.json();
      setAnalyticsStatus(data);
    } catch (error) {
      console.error('Failed to load analytics status:', error);
    }
  };

  const loadAvailableFeatures = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/analytics/available-features`);
      const data = await response.json();
      setAvailableFeatures(data);
    } catch (error) {
      console.error('Failed to load available features:', error);
    }
  };

  const extractTeamFeatures = async () => {
    if (!selectedMatch) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/analytics/team-match-features/${selectedMatch}`);
      const data = await response.json();
      setTeamFeatures(data);
    } catch (error) {
      console.error('Failed to extract team features:', error);
      setTeamFeatures({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const predictFouls = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/analytics/predict-fouls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_features: predictionInput })
      });
      const data = await response.json();
      setFoulPrediction(data);
    } catch (error) {
      console.error('Failed to predict fouls:', error);
      setFoulPrediction({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadRefereeSlopes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/analytics/zone-models/referee-slopes/${selectedFeature}`);
      const data = await response.json();
      setRefereeSlopes(data);
    } catch (error) {
      console.error('Failed to load referee slopes:', error);
      setRefereeSlopes({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const AnalyticsStatusCard = () => (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analyticsStatus ? (
          <div className="space-y-3">
            {analyticsStatus.success ? (
              <>
                <div className="flex items-center gap-2">
                  {analyticsStatus.data.available ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-700">Zone Models Available</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-700">Zone Models Not Fitted</span>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsStatus.data.total_models}
                    </div>
                    <div className="text-sm text-gray-600">Total Models</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analyticsStatus.data.zones_analyzed.length}
                    </div>
                    <div className="text-sm text-gray-600">Zones Analyzed</div>
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Advanced analytics not available. Models need to be fitted first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FeatureExtractionCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Team Feature Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Match ID (e.g., 7560)"
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="flex-1"
          />
          <Button onClick={extractTeamFeatures} disabled={loading || !selectedMatch}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Extract Features'}
          </Button>
        </div>

        {teamFeatures && (
          <div className="mt-4">
            {teamFeatures.error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{teamFeatures.error}</AlertDescription>
              </Alert>
            ) : teamFeatures.success && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Match {teamFeatures.data.match_id} - Teams: {teamFeatures.data.teams_analyzed.join(' vs ')}
                </div>
                
                {Object.entries(teamFeatures.data.team_features).map(([team, features]) => (
                  <Card key={team} className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">{team}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-semibold text-blue-600">
                            {features.possession_share?.toFixed(3) || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Possession Share</div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-semibold text-green-600">
                            {features.directness?.toFixed(3) || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Directness</div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-semibold text-red-600">
                            {features.fouls_committed || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Fouls Committed</div>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <div className="text-lg font-semibold text-yellow-600">
                            {features.yellows || 0} / {features.reds || 0}
                          </div>
                          <div className="text-xs text-gray-500">Yellow / Red Cards</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FoulPredictionCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Foul Prediction Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Directness</label>
            <Input
              type="number"
              step="0.1"
              value={predictionInput.z_directness}
              onChange={(e) => setPredictionInput({...predictionInput, z_directness: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">PPDA</label>
            <Input
              type="number"
              step="0.1"
              value={predictionInput.z_ppda}
              onChange={(e) => setPredictionInput({...predictionInput, z_ppda: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Possession</label>
            <Input
              type="number"
              step="0.1"
              value={predictionInput.z_possession_share}
              onChange={(e) => setPredictionInput({...predictionInput, z_possession_share: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Wing Usage</label>
            <Input
              type="number"
              step="0.1"
              value={predictionInput.z_wing_share}
              onChange={(e) => setPredictionInput({...predictionInput, z_wing_share: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Referee</label>
            <Input
              placeholder="Referee Name"
              value={predictionInput.referee_name}
              onChange={(e) => setPredictionInput({...predictionInput, referee_name: e.target.value})}
            />
          </div>
        </div>

        <Button onClick={predictFouls} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Predict Expected Fouls
        </Button>

        {foulPrediction && (
          <div className="mt-4">
            {foulPrediction.error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{foulPrediction.error}</AlertDescription>
              </Alert>
            ) : foulPrediction.success && (
              <div className="space-y-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {foulPrediction.data.prediction_summary.total_expected_fouls}
                        </div>
                        <div className="text-sm text-gray-600">Total Expected Fouls</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-red-600">
                          {foulPrediction.data.prediction_summary.hottest_zone}
                        </div>
                        <div className="text-sm text-gray-600">Hottest Zone</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {foulPrediction.data.prediction_summary.referee}
                        </div>
                        <div className="text-sm text-gray-600">Referee</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(foulPrediction.data.zone_predictions).map(([zone, data]) => (
                    <div
                      key={zone}
                      className="bg-white border rounded p-2 text-center hover:bg-gray-50 transition-colors"
                      style={{
                        backgroundColor: `rgba(239, 68, 68, ${data.expected_fouls / 5})` // Red intensity based on fouls
                      }}
                    >
                      <div className="text-xs font-mono text-gray-500">{zone}</div>
                      <div className="text-sm font-bold">{data.expected_fouls}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const RefereeAnalysisCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referee Bias Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedFeature} onValueChange={setSelectedFeature}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="directness">Directness</SelectItem>
              <SelectItem value="ppda">Pressing (PPDA)</SelectItem>
              <SelectItem value="possession_share">Possession Share</SelectItem>
              <SelectItem value="wing_share">Wing Usage</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadRefereeSlopes} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze Referee Effects'}
          </Button>
        </div>

        {refereeSlopes && (
          <div className="mt-4">
            {refereeSlopes.error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{refereeSlopes.error}</AlertDescription>
              </Alert>
            ) : refereeSlopes.success && (
              <div className="space-y-4">
                {refereeSlopes.data.slopes && refereeSlopes.data.slopes.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-lg font-bold text-blue-600">
                          {refereeSlopes.data.summary.total_slopes}
                        </div>
                        <div className="text-xs text-gray-600">Total Slopes</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {refereeSlopes.data.summary.significant_slopes}
                        </div>
                        <div className="text-xs text-gray-600">Significant</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-lg font-bold text-purple-600">
                          {refereeSlopes.data.summary.unique_referees}
                        </div>
                        <div className="text-xs text-gray-600">Referees</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded">
                        <div className="text-lg font-bold text-yellow-600">
                          {refereeSlopes.data.summary.average_slope.toFixed(3)}
                        </div>
                        <div className="text-xs text-gray-600">Avg Slope</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {refereeSlopes.data.slopes.map((slope, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{slope.referee_name}</div>
                            <Badge variant={slope.significant ? "default" : "secondary"}>
                              {slope.zone}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-mono ${slope.slope > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {slope.slope > 0 ? '+' : ''}{slope.slope.toFixed(3)}
                            </div>
                            {slope.significant && (
                              <Badge variant="outline" className="text-xs">
                                p&lt;0.05
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No referee slopes found for {selectedFeature}. This is expected if statistical models haven't been fitted yet.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FeatureDocumentationCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Feature Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        {availableFeatures ? (
          availableFeatures.success ? (
            <Tabs defaultValue="playstyle">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="playstyle">Playstyle Features</TabsTrigger>
                <TabsTrigger value="discipline">Discipline Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="playstyle" className="space-y-4">
                {Object.entries(availableFeatures.data.playstyle_features).map(([category, features]) => (
                  <Card key={category} className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-base capitalize">
                        {category.replace('_', ' & ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(features).map(([feature, description]) => (
                          <div key={feature} className="flex justify-between items-start">
                            <code className="text-sm bg-white px-2 py-1 rounded">{feature}</code>
                            <span className="text-sm text-gray-600 ml-3 flex-1">{description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="discipline" className="space-y-4">
                {Object.entries(availableFeatures.data.discipline_features).map(([category, features]) => (
                  <Card key={category} className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-base capitalize">
                        {category.replace('_', ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {category === 'zone_grid' ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">{features.description}</div>
                          <code className="text-sm bg-white px-2 py-1 rounded">{features.format}</code>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(features).map(([feature, description]) => (
                            <div key={feature} className="flex justify-between items-start">
                              <code className="text-sm bg-white px-2 py-1 rounded">{feature}</code>
                              <span className="text-sm text-gray-600 ml-3 flex-1">{description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Feature documentation not available</AlertDescription>
            </Alert>
          )
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Referee-Playstyle Analysis
        </h1>
        <p className="text-gray-600">
          Advanced analytics for understanding how team playstyles affect disciplinary outcomes by referee
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="extraction">Feature Extraction</TabsTrigger>
          <TabsTrigger value="prediction">Foul Prediction</TabsTrigger>
          <TabsTrigger value="referee">Referee Analysis</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsStatusCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">System Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">5×3 Zone-wise Foul Modeling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Referee × Playstyle Interactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Negative Binomial GLM Framework</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">StatsBomb Data Integration</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Key Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Team Playstyle Extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Spatial Discipline Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Predictive Foul Modeling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Referee Bias Detection</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="extraction">
          <FeatureExtractionCard />
        </TabsContent>

        <TabsContent value="prediction">
          <FoulPredictionCard />
        </TabsContent>

        <TabsContent value="referee">
          <RefereeAnalysisCard />
        </TabsContent>

        <TabsContent value="docs">
          <FeatureDocumentationCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RefereePlaystyleAnalysis;