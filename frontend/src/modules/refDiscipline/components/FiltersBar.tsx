import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useFilters, useRefDisciplineActions } from '../state';
import { Filter, RotateCcw } from 'lucide-react';

const FiltersBar: React.FC = () => {
  const filters = useFilters();
  const { setFilters, reset } = useRefDisciplineActions();

  const handleSeasonChange = (season: string) => {
    setFilters({ season });
  };

  const handleGridChange = (grid: '5x3' | '6x4') => {
    setFilters({ grid });
  };

  const handleGameStateChange = (gameState: 'all' | 'leading' | 'drawing' | 'trailing') => {
    setFilters({ gameState });
  };

  const handleExposureChange = (exposure: 'opp_passes' | 'minutes') => {
    setFilters({ exposure });
  };

  const isNonDefault = filters.season !== '2024' || 
                       filters.grid !== '5x3' || 
                       filters.gameState !== 'all' || 
                       filters.exposure !== 'opp_passes';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Analysis Filters</h3>
        </div>
        {isNonDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Season Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Season</label>
          <Select value={filters.season} onValueChange={handleSeasonChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Grid</label>
          <div className="flex border border-gray-200 rounded-md">
            <button
              onClick={() => handleGridChange('5x3')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
                filters.grid === '5x3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              5×3
            </button>
            <button
              onClick={() => handleGridChange('6x4')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-l transition-colors ${
                filters.grid === '6x4'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              6×4
            </button>
          </div>
        </div>

        {/* Game State Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Game State</label>
          <Select value={filters.gameState} onValueChange={handleGameStateChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Situations</SelectItem>
              <SelectItem value="leading">Leading</SelectItem>
              <SelectItem value="drawing">Drawing</SelectItem>
              <SelectItem value="trailing">Trailing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exposure Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Exposure</label>
          <Select value={filters.exposure} onValueChange={handleExposureChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opp_passes">Opponent Passes</SelectItem>
              <SelectItem value="minutes">Minutes Played</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {isNonDefault && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters.season !== '2024' && (
              <Badge variant="secondary">Season: {filters.season}</Badge>
            )}
            {filters.grid !== '5x3' && (
              <Badge variant="secondary">Grid: {filters.grid}</Badge>
            )}
            {filters.gameState !== 'all' && (
              <Badge variant="secondary">State: {filters.gameState}</Badge>
            )}
            {filters.exposure !== 'opp_passes' && (
              <Badge variant="secondary">Exposure: {filters.exposure.replace('_', ' ')}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersBar;