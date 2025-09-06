import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { MatchRecord } from '../types';
import { useTeamMatches } from '../hooks';
import { Calendar, MapPin, User, AlertTriangle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface MatchTableProps {
  teamId: string;
  season: string;
  compact?: boolean;
}

const MatchTable: React.FC<MatchTableProps> = ({ teamId, season, compact = false }) => {
  const [cursor, setCursor] = useState<string | undefined>();
  const { data, loading, error } = useTeamMatches(teamId, season, cursor);

  const handlePrevious = () => {
    // In a real implementation, you'd track previous cursor
    setCursor(undefined);
  };

  const handleNext = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading matches...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Failed to load matches</p>
        </CardContent>
      </Card>
    );
  }

  const renderMiniHeatmap = (heatmapData: MatchRecord['heatmapData']) => {
    if (!heatmapData || heatmapData.length === 0) {
      return <div className="w-12 h-8 bg-gray-100 rounded text-xs flex items-center justify-center">N/A</div>;
    }

    const maxValue = Math.max(...heatmapData.map(d => d.value));
    
    return (
      <div className="w-12 h-8 grid grid-cols-5 gap-px bg-gray-200 rounded overflow-hidden">
        {heatmapData.map((cell, index) => {
          const intensity = maxValue > 0 ? cell.value / maxValue : 0;
          return (
            <div
              key={index}
              className="bg-red-500"
              style={{ opacity: 0.2 + intensity * 0.8 }}
              title={`Zone ${cell.xBin}-${cell.yBin}: ${cell.value.toFixed(1)} fouls`}
            />
          );
        })}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {data.matches.slice(0, 5).map((match) => (
          <div key={match.matchId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <div className="font-medium">{match.opponent}</div>
                <div className="text-gray-500">{new Date(match.date).toLocaleDateString()}</div>
              </div>
              <Badge variant={match.homeAway === 'H' ? 'default' : 'secondary'}>
                {match.homeAway}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-center">
                <div className="font-medium text-red-600">{match.fouls}</div>
                <div className="text-xs text-gray-500">fouls</div>
              </div>
              {renderMiniHeatmap(match.heatmapData)}
            </div>
          </div>
        ))}
        {data.matches.length > 5 && (
          <div className="text-center">
            <Button variant="link" size="sm">
              View all {data.matches.length} matches
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opponent
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  H/A
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referee
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fouls
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cards
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pattern
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.matches.map((match) => (
                <tr key={match.matchId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(match.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {match.opponent}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <Badge variant={match.homeAway === 'H' ? 'default' : 'secondary'}>
                      {match.homeAway}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-32" title={match.referee}>
                        {match.referee}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{match.fouls}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      {match.yellows > 0 && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {match.yellows}Y
                        </Badge>
                      )}
                      {match.reds > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {match.reds}R
                        </Badge>
                      )}
                      {match.yellows === 0 && match.reds === 0 && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {renderMiniHeatmap(match.heatmapData)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(cursor || data.nextCursor) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={!cursor}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-500">
              Showing {data.matches.length} matches
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!data.nextCursor}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchTable;