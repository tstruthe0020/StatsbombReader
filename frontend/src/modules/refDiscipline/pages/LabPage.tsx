import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { 
  FiltersBar, 
  WhatIfSliders, 
  FoulHeatmap, 
  ForestPlot, 
  DeltaTable,
  TeamCard,
  RefCard
} from '../components';
import { useTeamsList, useRefereesList, usePredictHeatmap, useRefSlopes, useTeamBaseline, useDebounced } from '../hooks';
import { useFilters, useFeatureOverrides, useRefDisciplineActions } from '../state';
import { PredictionRequest } from '../types';
import { Download, RefreshCw, Beaker, Target, BarChart3 } from 'lucide-react';

const LabPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useFilters();
  const featureOverrides = useFeatureOverrides();
  const { setSelection } = useRefDisciplineActions();

  // Get initial selections from URL
  const [selectedTeam, setSelectedTeam] = useState(searchParams.get('teamId') || '');
  const [selectedReferee, setSelectedReferee] = useState(searchParams.get('refId') || '');
  const [activeTab, setActiveTab] = useState<'predicted' | 'delta'>('predicted');

  // Data hooks
  const { data: teams } = useTeamsList(filters.season);
  const { data: referees } = useRefereesList(filters.season);
  const { data: teamBaseline } = useTeamBaseline(selectedTeam, filters.season);
  const { data: forestSlopes } = useRefSlopes(selectedReferee, 'directness', filters.season);

  // Debounce feature overrides for prediction API calls
  const debouncedOverrides = useDebounced(featureOverrides, 150);

  // Build prediction request
  const predictionRequest: PredictionRequest | null = useMemo(() => {
    if (!selectedReferee) return null;
    
    return {
      refId: selectedReferee,
      season: filters.season,
      features: debouncedOverrides,
      exposure: filters.exposure,
      grid: filters.grid
    };
  }, [selectedReferee, filters.season, debouncedOverrides, filters.exposure, filters.grid]);

  // Get prediction data
  const { data: predictionData, loading: predictionLoading } = usePredictHeatmap(predictionRequest);

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedTeam) params.set('teamId', selectedTeam);
    else params.delete('teamId');
    if (selectedReferee) params.set('refId', selectedReferee);
    else params.delete('refId');
    setSearchParams(params);
    
    setSelection({ teamId: selectedTeam || undefined, refId: selectedReferee || undefined });
  }, [selectedTeam, selectedReferee, searchParams, setSearchParams, setSelection]);

  // Calculate baseline heatmap (with no overrides)
  const baselinePrediction = useMemo(() => {
    if (!predictionData) return null;
    
    // For delta calculation, we need baseline prediction
    // This would come from API with no feature overrides
    return predictionData; // Simplified for demo
  }, [predictionData]);

  const handleExportPNG = () => {
    // In a real implementation, this would capture the heatmap as PNG
    console.log('Exporting heatmap as PNG');
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF report
    console.log('Exporting analysis as PDF');
  };

  const hasOverrides = Object.values(featureOverrides).some(value => value !== undefined && value !== 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Beaker className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">What-If Laboratory</h1>
            <p className="text-gray-600">
              Experiment with playstyle adjustments and analyze referee effects
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPNG}>
            <Download className="h-4 w-4 mr-1" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* Main Lab Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Team Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Team Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map(team => (
                    <SelectItem key={team.teamId} value={team.teamId}>
                      {team.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedTeam && teamBaseline && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="grid grid-cols-2 gap-1">
                    <span>Fouls/90:</span>
                    <span className="font-mono">{teamBaseline.discipline.fouls_per_90.toFixed(1)}</span>
                    <span>Possession:</span>
                    <span className="font-mono">{(teamBaseline.playstyle.possession_share * 100).toFixed(1)}%</span>
                    <span>Directness:</span>
                    <span className="font-mono">{(teamBaseline.playstyle.directness * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referee Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-4 w-4" />
                Referee Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedReferee} onValueChange={setSelectedReferee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select referee" />
                </SelectTrigger>
                <SelectContent>
                  {referees?.map(referee => (
                    <SelectItem key={referee.refId} value={referee.refId}>
                      {referee.refName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* What-If Sliders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WhatIfSliders 
                teamBaseline={teamBaseline?.playstyle}
                onOverrideChange={() => {
                  // Overrides are handled via global state
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Center - Heatmap */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Foul Distribution Analysis</CardTitle>
                <div className="flex items-center gap-2">
                  {hasOverrides && (
                    <Badge variant="secondary" className="text-xs">
                      Modified
                    </Badge>
                  )}
                  {predictionLoading && (
                    <Badge variant="outline" className="text-xs">
                      Updating...
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedReferee ? (
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p>Select a referee to see predictions</p>
                  </div>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="predicted">Predicted</TabsTrigger>
                    <TabsTrigger value="delta">Δ vs Baseline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="predicted" className="space-y-4">
                    {predictionData ? (
                      <FoulHeatmap
                        mode="predicted"
                        grid={filters.grid}
                        data={predictionData.grid}
                        showCI={true}
                      />
                    ) : (
                      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-gray-500">Loading prediction...</div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="delta" className="space-y-4">
                    {predictionData && baselinePrediction ? (
                      <FoulHeatmap
                        mode="delta"
                        grid={filters.grid}
                        data={predictionData.grid.map((cell, i) => ({
                          ...cell,
                          value: cell.value - (baselinePrediction.grid[i]?.value || 0)
                        }))}
                        showCI={false}
                      />
                    ) : (
                      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-gray-500">
                          {!hasOverrides ? 'Adjust playstyle features to see changes' : 'Loading delta analysis...'}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Quick Team/Ref Info */}
          {(selectedTeam || selectedReferee) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTeam && (
                <TeamCard 
                  teamId={selectedTeam} 
                  season={filters.season} 
                  compact={true}
                />
              )}
              {selectedReferee && (
                <RefCard 
                  refId={selectedReferee} 
                  season={filters.season} 
                  compact={true}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Analysis */}
        <div className="lg:col-span-1 space-y-6">
          {/* Delta Table */}
          <DeltaTable 
            data={predictionData} 
            loading={predictionLoading}
          />

          {/* Forest Plot */}
          {selectedReferee && forestSlopes && forestSlopes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referee Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-hidden">
                  <ForestPlot 
                    slopes={forestSlopes} 
                    feature="directness"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interpretation */}
          {predictionData && hasOverrides && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base text-blue-900">
                  Quick Interpretation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800">
                <div className="space-y-2">
                  <p>
                    <strong>Total Impact:</strong> {' '}
                    {predictionData.totals.delta > 0 ? '+' : ''}
                    {predictionData.totals.delta.toFixed(2)} expected fouls
                  </p>
                  <p>
                    <strong>Strongest Effect:</strong> {' '}
                    {Object.entries(predictionData.byThirds).reduce((max, [key, values]) => 
                      Math.abs(values.delta) > Math.abs(max.delta) ? { name: key, ...values } : max,
                      { name: 'defensive', delta: 0, predicted: 0, baseline: 0 }
                    ).name} third
                  </p>
                  {Object.entries(featureOverrides).filter(([_, value]) => value && value !== 0).length > 0 && (
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <p className="font-medium mb-1">Active Adjustments:</p>
                      <div className="space-y-1">
                        {Object.entries(featureOverrides).filter(([_, value]) => value && value !== 0).map(([feature, value]) => (
                          <div key={feature} className="text-xs">
                            {feature.replace('_', ' ')}: {value! > 0 ? '+' : ''}{value!.toFixed(1)}σ
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabPage;