import React, { useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { FiltersBar, RefCard } from '../components';
import { useRefereesList } from '../hooks';
import { useFilters } from '../state';
import { Search, Grid, List, Loader2 } from 'lucide-react';

const RefereesPage: React.FC = () => {
  const filters = useFilters();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: referees, loading, error } = useRefereesList(filters.season, search);

  const filteredReferees = referees?.filter(referee =>
    referee.refName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referee Analysis</h1>
          <p className="text-gray-600">
            Explore referee tendencies and biases for season {filters.season}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FiltersBar />

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search referees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            `${filteredReferees.length} referee${filteredReferees.length !== 1 ? 's' : ''} found`
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Failed to load referees data</div>
        </div>
      ) : filteredReferees.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {search ? `No referees found matching "${search}"` : 'No referees available'}
          </div>
          {search && (
            <Button
              variant="outline"
              onClick={() => setSearch('')}
              className="mt-4"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredReferees.map((referee) => (
            <RefCard
              key={referee.refId}
              refId={referee.refId}
              season={filters.season}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && filteredReferees.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {(filteredReferees.reduce((sum, r) => sum + r.fouls_per_90, 0) / filteredReferees.length).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Fouls/90</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {(filteredReferees.reduce((sum, r) => sum + r.cards_per_90, 0) / filteredReferees.length).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Cards/90</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(filteredReferees.reduce((sum, r) => sum + r.matches, 0) / filteredReferees.length).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredReferees.filter(r => r.strongest_slopes.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Strong Biases</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefereesPage;