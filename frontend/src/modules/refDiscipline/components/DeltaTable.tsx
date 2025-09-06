import React, { useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { PredictionResponse } from '../types';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

interface DeltaTableProps {
  data: PredictionResponse | null;
  loading?: boolean;
}

const DeltaTable: React.FC<DeltaTableProps> = ({ data, loading = false }) => {
  const tableData = useMemo(() => {
    if (!data) return null;

    return {
      totals: data.totals,
      byThirds: data.byThirds,
      summary: {
        totalDelta: data.totals.delta,
        percentChange: data.totals.baseline > 0 
          ? ((data.totals.predicted - data.totals.baseline) / data.totals.baseline) * 100 
          : 0,
        strongestThird: Object.entries(data.byThirds).reduce((max, [key, values]) => 
          Math.abs(values.delta) > Math.abs(max.delta) ? { name: key, ...values } : max,
          { name: 'defensive', delta: 0, predicted: 0, baseline: 0 }
        )
      }
    };
  }, [data]);

  const exportToCSV = () => {
    if (!data) return;

    const csvData = [
      ['Category', 'Predicted', 'Baseline', 'Delta', 'Change %'],
      ['Total', data.totals.predicted.toFixed(2), data.totals.baseline.toFixed(2), 
       data.totals.delta.toFixed(2), (((data.totals.predicted - data.totals.baseline) / data.totals.baseline) * 100).toFixed(1) + '%'],
      ['Defensive Third', data.byThirds.defensive.predicted.toFixed(2), data.byThirds.defensive.baseline.toFixed(2),
       data.byThirds.defensive.delta.toFixed(2), (((data.byThirds.defensive.predicted - data.byThirds.defensive.baseline) / data.byThirds.defensive.baseline) * 100).toFixed(1) + '%'],
      ['Middle Third', data.byThirds.middle.predicted.toFixed(2), data.byThirds.middle.baseline.toFixed(2),
       data.byThirds.middle.delta.toFixed(2), (((data.byThirds.middle.predicted - data.byThirds.middle.baseline) / data.byThirds.middle.baseline) * 100).toFixed(1) + '%'],
      ['Attacking Third', data.byThirds.attacking.predicted.toFixed(2), data.byThirds.attacking.baseline.toFixed(2),
       data.byThirds.attacking.delta.toFixed(2), (((data.byThirds.attacking.predicted - data.byThirds.attacking.baseline) / data.byThirds.attacking.baseline) * 100).toFixed(1) + '%']
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `referee-discipline-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Delta Analysis</h3>
          <Button disabled size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="animate-pulse text-gray-500">Loading analysis...</div>
        </div>
      </div>
    );
  }

  if (!data || !tableData) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Delta Analysis</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No prediction data available
        </div>
      </div>
    );
  }

  const formatChange = (predicted: number, baseline: number) => {
    if (baseline === 0) return '–';
    const change = ((predicted - baseline) / baseline) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-red-600 bg-red-50';
    if (delta < 0) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-4 w-4" />;
    if (delta < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Delta Analysis</h3>
        <Button onClick={exportToCSV} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {getDeltaIcon(tableData.summary.totalDelta)}
            <span className="text-sm font-medium text-gray-700">Total Impact</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {tableData.summary.totalDelta >= 0 ? '+' : ''}
            {tableData.summary.totalDelta.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            {tableData.summary.percentChange.toFixed(1)}% vs baseline
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Strongest Effect</span>
          </div>
          <div className="text-lg font-bold text-gray-900 capitalize">
            {tableData.summary.strongestThird.name} Third
          </div>
          <div className="text-sm text-gray-600">
            {tableData.summary.strongestThird.delta >= 0 ? '+' : ''}
            {tableData.summary.strongestThird.delta.toFixed(2)} fouls
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Breakdown by Field Area</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Baseline
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delta
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Total Row */}
              <tr className="bg-blue-25 font-medium">
                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                  Total
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {data.totals.predicted.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {data.totals.baseline.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <Badge 
                    className={`font-mono ${getDeltaColor(data.totals.delta)}`}
                    variant="secondary"
                  >
                    {data.totals.delta >= 0 ? '+' : ''}{data.totals.delta.toFixed(2)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {formatChange(data.totals.predicted, data.totals.baseline)}
                </td>
              </tr>

              {/* Third Rows */}
              {Object.entries(data.byThirds).map(([third, values]) => (
                <tr key={third} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                    {third} Third
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {values.predicted.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {values.baseline.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Badge 
                      className={`font-mono ${getDeltaColor(values.delta)}`}
                      variant="secondary"
                    >
                      {values.delta >= 0 ? '+' : ''}{values.delta.toFixed(2)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {formatChange(values.predicted, values.baseline)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Interpretation</h4>
        <p className="text-sm text-yellow-700">
          {tableData.summary.totalDelta > 0 ? (
            <>The adjusted playstyle is predicted to result in <strong>{tableData.summary.totalDelta.toFixed(2)} more fouls</strong> than the team's baseline. 
            The strongest effect is in the {tableData.summary.strongestThird.name} third.</>
          ) : tableData.summary.totalDelta < 0 ? (
            <>The adjusted playstyle is predicted to result in <strong>{Math.abs(tableData.summary.totalDelta).toFixed(2)} fewer fouls</strong> than the team's baseline.
            The strongest effect is in the {tableData.summary.strongestThird.name} third.</>
          ) : (
            <>The adjusted playstyle shows no significant change from the team's baseline foul rate.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default DeltaTable;