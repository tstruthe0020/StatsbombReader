import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useRefBaseline } from '../hooks';
import { Loader2, AlertTriangle, Users, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RefCardProps {
  refId: string;
  season: string;
  compact?: boolean;
}

const RefCard: React.FC<RefCardProps> = ({ refId, season, compact = false }) => {
  const { data: baseline, loading, error } = useRefBaseline(refId, season);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="h-48 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </Card>
    );
  }

  if (error || !baseline) {
    return (
      <Card className="h-48 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <p className="text-sm">Failed to load referee data</p>
        </div>
      </Card>
    );
  }

  const handleViewDetails = () => {
    navigate(`/analysis/ref-discipline/referees/${refId}`);
  };

  const handleOpenInLab = () => {
    navigate(`/analysis/ref-discipline/lab?refId=${refId}`);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewDetails}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{baseline.refName}</h4>
              <p className="text-sm text-gray-500">{baseline.matches} matches</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-600">
                {baseline.fouls_per_90.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">fouls/90</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{baseline.refName}</CardTitle>
          <Badge variant="outline">{baseline.matches} matches</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Referee Baseline Stats */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Baseline Statistics</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {baseline.fouls_per_90.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Fouls/90</div>
            </div>
            <div className="text-center bg-yellow-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {baseline.cards_per_90.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Cards/90</div>
            </div>
          </div>
        </div>

        {/* Strongest Slopes */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Strongest Biases</h4>
          
          <div className="space-y-2">
            {baseline.strongest_slopes.map((slope, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {slope.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm font-medium capitalize">
                    {slope.feature.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {slope.zone}
                  </Badge>
                  <span className="text-sm font-mono text-gray-600">
                    {slope.direction === 'up' ? '+' : ''}{slope.magnitude.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interpretation */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Interpretation:</strong> This referee shows {baseline.strongest_slopes.length > 0 ? 
              `strong bias towards ${baseline.strongest_slopes[0].feature.replace('_', ' ')} in ${baseline.strongest_slopes[0].zone} areas.` :
              'balanced officiating across different playing styles.'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetails}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Button 
            size="sm" 
            onClick={handleOpenInLab}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Lab
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefCard;