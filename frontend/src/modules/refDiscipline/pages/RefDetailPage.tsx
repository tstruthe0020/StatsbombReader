import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { RefCard, ForestPlot, FiltersBar } from '../components';
import { useRefSlopes } from '../hooks';
import { useFilters } from '../state';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const RefDetailPage: React.FC = () => {
  const { refId } = useParams<{ refId: string }>();
  const filters = useFilters();
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<string>('directness');

  const { data: slopes, loading } = useRefSlopes(refId, selectedFeature, filters.season);

  if (!refId) {
    return <div>Referee not found</div>;
  }

  const handleOpenInLab = () => {
    navigate(`/analysis/ref-discipline/lab?refId=${refId}`);
  };

  const handleBack = () => {
    navigate('/analysis/ref-discipline/referees');
  };

  const features = [
    { value: 'directness', label: 'Directness' },
    { value: 'ppda', label: 'PPDA (Pressing)' },
    { value: 'possession_share', label: 'Possession Share' },
    { value: 'block_height_x', label: 'Block Height' },
    { value: 'wing_share', label: 'Wing Usage' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Referees
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referee Analysis</h1>
            <p className="text-gray-600">Detailed breakdown for season {filters.season}</p>
          </div>
        </div>
        
        <Button onClick={handleOpenInLab}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Lab
        </Button>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* Referee Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RefCard refId={refId} season={filters.season} />
        </div>
        
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {/* Feature Selection */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Analyze Feature:
              </label>
              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {features.map(feature => (
                    <SelectItem key={feature.value} value={feature.value}>
                      {feature.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forest Plot */}
            {loading ? (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Loading analysis...</div>
              </div>
            ) : slopes && slopes.length > 0 ? (
              <ForestPlot 
                slopes={slopes} 
                feature={selectedFeature as any}
              />
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>No slope data available</p>
                  <p className="text-sm">for {selectedFeature}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefDetailPage;