import React, { useMemo } from 'react';
import { ForestPlotProps } from '../types';

const ForestPlot: React.FC<ForestPlotProps> = ({ slopes, feature }) => {
  const plotData = useMemo(() => {
    // Group slopes by referee and aggregate if needed
    const refSlopes = slopes.reduce((acc, slope) => {
      if (!acc[slope.ref]) {
        acc[slope.ref] = [];
      }
      acc[slope.ref].push(slope);
      return acc;
    }, {} as Record<string, typeof slopes>);

    // Calculate aggregated coefficients per referee
    return Object.entries(refSlopes).map(([ref, refSlopes]) => {
      const avgCoef = refSlopes.reduce((sum, s) => sum + s.coef, 0) / refSlopes.length;
      const avgSe = Math.sqrt(refSlopes.reduce((sum, s) => sum + s.se * s.se, 0) / refSlopes.length);
      
      return {
        ref,
        coef: avgCoef,
        se: avgSe,
        ciLow: avgCoef - 1.96 * avgSe,
        ciHigh: avgCoef + 1.96 * avgSe,
        significant: Math.abs(avgCoef) > 1.96 * avgSe
      };
    }).sort((a, b) => Math.abs(b.coef) - Math.abs(a.coef)); // Sort by effect size
  }, [slopes]);

  if (plotData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No slope data available</p>
          <p className="text-sm">for {feature}</p>
        </div>
      </div>
    );
  }

  const maxAbsCoef = Math.max(...plotData.map(d => Math.max(Math.abs(d.ciLow), Math.abs(d.ciHigh))));
  const scale = maxAbsCoef > 0 ? 200 / maxAbsCoef : 1; // Scale to fit 200px width

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="font-medium text-gray-900">
          Referee Effects: {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h4>
        <p className="text-sm text-gray-600">
          Coefficient estimates with 95% confidence intervals
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <svg
          viewBox={`0 0 400 ${plotData.length * 30 + 40}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Forest plot showing ${feature} effects by referee`}
        >
          {/* Reference line at zero */}
          <line
            x1="200"
            y1="20"
            x2="200"
            y2={plotData.length * 30 + 20}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          
          {/* Y-axis label */}
          <text
            x="10"
            y="15"
            className="text-xs fill-gray-600"
            textAnchor="start"
          >
            Referee
          </text>
          
          {/* X-axis label */}
          <text
            x="200"
            y={plotData.length * 30 + 35}
            className="text-xs fill-gray-600"
            textAnchor="middle"
          >
            Effect Size (Coefficient)
          </text>

          {plotData.map((item, index) => {
            const y = 30 + index * 30;
            const centerX = 200 + item.coef * scale;
            const lowX = 200 + item.ciLow * scale;
            const highX = 200 + item.ciHigh * scale;

            return (
              <g key={item.ref}>
                {/* Confidence interval line */}
                <line
                  x1={lowX}
                  y1={y}
                  x2={highX}
                  y2={y}
                  stroke={item.significant ? "#dc2626" : "#6b7280"}
                  strokeWidth="2"
                />
                
                {/* CI caps */}
                <line x1={lowX} y1={y - 3} x2={lowX} y2={y + 3} stroke={item.significant ? "#dc2626" : "#6b7280"} strokeWidth="2" />
                <line x1={highX} y1={y - 3} x2={highX} y2={y + 3} stroke={item.significant ? "#dc2626" : "#6b7280"} strokeWidth="2" />
                
                {/* Point estimate */}
                <circle
                  cx={centerX}
                  cy={y}
                  r="4"
                  fill={item.significant ? "#dc2626" : "#6b7280"}
                  stroke="white"
                  strokeWidth="1"
                />
                
                {/* Referee label */}
                <text
                  x="195"
                  y={y + 1}
                  className="text-xs fill-gray-700"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {item.ref.length > 15 ? item.ref.substring(0, 15) + '...' : item.ref}
                </text>
                
                {/* Coefficient value */}
                <text
                  x={Math.max(highX + 5, 350)}
                  y={y + 1}
                  className="text-xs fill-gray-700 font-mono"
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  {item.coef.toFixed(3)}
                </text>

                {/* Tooltip on hover */}
                <title>
                  {item.ref}: {item.coef.toFixed(3)} (95% CI: {item.ciLow.toFixed(3)} to {item.ciHigh.toFixed(3)})
                  {item.significant ? ' - Significant' : ''}
                </title>
              </g>
            );
          })}
          
          {/* Scale indicators */}
          <text x="50" y={plotData.length * 30 + 35} className="text-xs fill-gray-500" textAnchor="middle">
            {(-maxAbsCoef).toFixed(2)}
          </text>
          <text x="350" y={plotData.length * 30 + 35} className="text-xs fill-gray-500" textAnchor="middle">
            {maxAbsCoef.toFixed(2)}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full" />
          <span>Significant effect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full" />
          <span>Non-significant</span>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-medium text-gray-900">
              {plotData.filter(d => d.significant).length}
            </div>
            <div className="text-gray-600">Significant</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {plotData.filter(d => d.coef > 0).length}
            </div>
            <div className="text-gray-600">Positive Effects</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {plotData.length}
            </div>
            <div className="text-gray-600">Total Referees</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForestPlot;