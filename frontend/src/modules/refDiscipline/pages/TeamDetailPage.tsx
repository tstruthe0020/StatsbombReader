import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { TeamCard, MatchTable, FiltersBar } from '../components';
import { useFilters } from '../state';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const filters = useFilters();
  const navigate = useNavigate();

  if (!teamId) {
    return <div>Team not found</div>;
  }

  const handleOpenInLab = () => {
    navigate(`/analysis/ref-discipline/lab?teamId=${teamId}`);
  };

  const handleBack = () => {
    navigate('/analysis/ref-discipline/teams');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Teams
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Analysis</h1>
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

      {/* Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TeamCard teamId={teamId} season={filters.season} />
        </div>
        
        <div className="lg:col-span-2">
          <MatchTable teamId={teamId} season={filters.season} />
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;