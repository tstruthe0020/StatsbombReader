import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useTeamBaseline } from '../hooks';
import { Loader2, TrendingUp, AlertTriangle, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeamCardProps {
  teamId: string;
  season: string;
  compact?: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({ teamId, season, compact = false }) => {
  const { data: baseline, loading, error } = useTeamBaseline(teamId, season);
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
          <p className="text-sm">Failed to load team data</p>
        </div>
      </Card>
    );
  }

  const handleOpenInLab = () => {
    navigate(`/analysis/ref-discipline/lab?teamId=${teamId}`);
  };

  const handleViewDetails = () => {
    navigate(`/analysis/ref-discipline/teams/${teamId}`);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewDetails}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{baseline.teamName}</h4>
              <p className="text-sm text-gray-500">{baseline.matches} matches</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-600">
                {baseline.discipline.fouls_per_90.toFixed(1)}
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
          <CardTitle className="text-lg">{baseline.teamName}</CardTitle>
          <Badge variant="outline">{baseline.matches} matches</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Playstyle Radar Chart (simplified visual representation) */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Playstyle Profile
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Possession</span>
                <span className="font-medium">{(baseline.playstyle.possession_share * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${baseline.playstyle.possession_share * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Directness</span>
                <span className="font-medium">{(baseline.playstyle.directness * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${baseline.playstyle.directness * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PPDA</span>
                <span className="font-medium">{baseline.playstyle.ppda.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(baseline.playstyle.ppda / 20 * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wing Usage</span>
                <span className="font-medium">{(baseline.playstyle.wing_share * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${baseline.playstyle.wing_share * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Discipline KPIs */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Discipline Record
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {baseline.discipline.fouls_per_90.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Fouls/90</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {baseline.discipline.yellows_per_90.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Yellows/90</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">
                {baseline.discipline.reds_per_90.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Reds/90</div>
            </div>
          </div>
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

export default TeamCard;