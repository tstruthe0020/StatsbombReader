import React, { useMemo } from 'react';
import { FoulHeatmapProps, HeatmapCell } from '../types';

const FoulHeatmap: React.FC<FoulHeatmapProps> = ({ mode, grid, data, showCI = false }) => {
  const { xBins, yBins } = useMemo(() => {
    return grid === '5x3' ? { xBins: 5, yBins: 3 } : { xBins: 6, yBins: 4 };
  }, [grid]);

  const cellWidth = 120 / xBins; // Field length 120m
  const cellHeight = 80 / yBins;  // Field width 80m

  // Color scale for different modes
  const getColor = (value: number, mode: string) => {
    const absValue = Math.abs(value);
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
    const intensity = maxValue > 0 ? absValue / maxValue : 0;
    
    switch (mode) {
      case 'actual':
        return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`; // Red scale
      case 'predicted':
        return `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`; // Blue scale
      case 'delta':
        // Red for positive, blue for negative
        const color = value >= 0 ? '239, 68, 68' : '59, 130, 246';
        return `rgba(${color}, ${0.2 + intensity * 0.6})`;
      default:
        return `rgba(156, 163, 175, ${0.2 + intensity * 0.6})`; // Gray scale
    }
  };

  const formatValue = (value: number) => {
    return mode === 'delta' 
      ? (value >= 0 ? '+' : '') + value.toFixed(2)
      : value.toFixed(2);
  };

  const getAriaLabel = (cell: HeatmapCell) => {
    const zoneLabel = `Zone x${cell.xBin} y${cell.yBin}`;
    const valueLabel = `${mode} ${formatValue(cell.value)}`;
    const ciLabel = showCI && cell.ciLow && cell.ciHigh 
      ? ` (95% CI ${cell.ciLow.toFixed(2)}–${cell.ciHigh.toFixed(2)})`
      : '';
    return `${zoneLabel}: ${valueLabel}${ciLabel}`;
  };

  return (
    <div className="space-y-4">
      {/* Field Heatmap */}
      <div className="bg-green-100 rounded-lg p-4 border-2 border-green-200">
        <svg
          viewBox="0 0 120 80"
          className="w-full h-auto max-h-96 border border-gray-300 rounded"
          style={{ aspectRatio: '3/2' }}
          role="img"
          aria-label={`Foul ${mode} heatmap showing ${grid} grid`}
        >
          {/* Field markings */}
          <defs>
            <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="rgba(34, 197, 94, 0.1)" />
            </pattern>
          </defs>
          
          {/* Field background */}
          <rect width="120" height="80" fill="url(#grass)" stroke="#16a34a" strokeWidth="0.5" />
          
          {/* Center line */}
          <line x1="60" y1="0" x2="60" y2="80" stroke="#16a34a" strokeWidth="0.5" />
          
          {/* Center circle */}
          <circle cx="60" cy="40" r="8" fill="none" stroke="#16a34a" strokeWidth="0.5" />
          
          {/* Penalty areas */}
          <rect x="0" y="22" width="18" height="36" fill="none" stroke="#16a34a" strokeWidth="0.5" />
          <rect x="102" y="22" width="18" height="36" fill="none" stroke="#16a34a" strokeWidth="0.5" />
          
          {/* Goal areas */}
          <rect x="0" y="32" width="6" height="16" fill="none" stroke="#16a34a" strokeWidth="0.5" />
          <rect x="114" y="32" width="6" height="16" fill="none" stroke="#16a34a" strokeWidth="0.5" />
          
          {/* Heatmap cells */}
          {data.map((cell) => (
            <rect
              key={`${cell.xBin}-${cell.yBin}`}
              x={cell.xBin * cellWidth}
              y={cell.yBin * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill={getColor(cell.value, mode)}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="0.5"
              tabIndex={0}
              role="button"
              aria-label={getAriaLabel(cell)}
              className="hover:stroke-2 hover:stroke-white focus:stroke-2 focus:stroke-white focus:outline-none cursor-pointer"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  // Could trigger tooltip or detailed view
                }
              }}
            >
              <title>{getAriaLabel(cell)}</title>
            </rect>
          ))}
          
          {/* Value labels */}
          {data.map((cell) => (
            <text
              key={`label-${cell.xBin}-${cell.yBin}`}
              x={cell.xBin * cellWidth + cellWidth / 2}
              y={cell.yBin * cellHeight + cellHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium pointer-events-none select-none"
              fill={Math.abs(cell.value) > 1 ? "white" : "black"}
            >
              {formatValue(cell.value)}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: getColor(0.5, mode) }}
            />
            <span className="text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: getColor(2, mode) }}
            />
            <span className="text-gray-600">High</span>
          </div>
          {mode === 'delta' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-400" />
                <span className="text-gray-600">Above baseline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-400" />
                <span className="text-gray-600">Below baseline</span>
              </div>
            </>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          Grid: {grid} | Mode: {mode}
        </div>
      </div>

      {/* Table view for accessibility */}
      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
          View as table (screen reader friendly)
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left border-b">Zone</th>
                <th className="px-3 py-2 text-right border-b">Value</th>
                {showCI && (
                  <>
                    <th className="px-3 py-2 text-right border-b">CI Low</th>
                    <th className="px-3 py-2 text-right border-b">CI High</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((cell) => (
                <tr key={`${cell.xBin}-${cell.yBin}`} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">
                    Zone {cell.xBin}-{cell.yBin}
                  </td>
                  <td className="px-3 py-2 text-right border-b font-mono">
                    {formatValue(cell.value)}
                  </td>
                  {showCI && (
                    <>
                      <td className="px-3 py-2 text-right border-b font-mono">
                        {cell.ciLow?.toFixed(2) || '–'}
                      </td>
                      <td className="px-3 py-2 text-right border-b font-mono">
                        {cell.ciHigh?.toFixed(2) || '–'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

export default FoulHeatmap;