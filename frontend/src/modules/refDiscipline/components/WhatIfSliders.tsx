import React from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { FeatureOverrides } from '../types';
import { useFeatureOverrides, useRefDisciplineActions } from '../state';
import { RotateCcw } from 'lucide-react';

interface WhatIfSlidersProps {
  teamBaseline?: Record<string, number>;
  onOverrideChange?: (overrides: FeatureOverrides) => void;
}

const WhatIfSliders: React.FC<WhatIfSlidersProps> = ({ 
  teamBaseline,
  onOverrideChange 
}) => {
  const overrides = useFeatureOverrides();
  const { setFeatureOverrides, resetOverrides } = useRefDisciplineActions();

  const features = [
    {
      key: 'ppda' as keyof FeatureOverrides,
      label: 'PPDA',
      description: 'Pressing intensity (Passes Per Defensive Action)',
      baseline: teamBaseline?.ppda || 12.5,
      unit: ''
    },
    {
      key: 'directness' as keyof FeatureOverrides,
      label: 'Directness',
      description: 'Forward progression vs total distance',
      baseline: teamBaseline?.directness || 0.42,
      unit: '%'
    },
    {
      key: 'possession_share' as keyof FeatureOverrides,
      label: 'Possession',
      description: 'Share of total match possession',
      baseline: teamBaseline?.possession_share || 0.52,
      unit: '%'
    },
    {
      key: 'block_height_x' as keyof FeatureOverrides,
      label: 'Block Height',
      description: 'Defensive line height on field',
      baseline: teamBaseline?.block_height_x || 55,
      unit: 'm'
    },
    {
      key: 'wing_share' as keyof FeatureOverrides,
      label: 'Wing Usage',
      description: 'Share of play through wide areas',
      baseline: teamBaseline?.wing_share || 0.35,
      unit: '%'
    }
  ];

  const handleSliderChange = (feature: keyof FeatureOverrides, value: number) => {
    const newOverrides = { ...overrides, [feature]: value };
    setFeatureOverrides(newOverrides);
    onOverrideChange?.(newOverrides);
  };

  const hasOverrides = Object.values(overrides).some(value => value !== undefined && value !== 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">What-If Analysis</h3>
          <p className="text-sm text-gray-600">
            Adjust team playstyle features (in standard deviations)
          </p>
        </div>
        {hasOverrides && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetOverrides}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {features.map((feature) => {
          const currentValue = overrides[feature.key] || 0;
          const isModified = currentValue !== 0;
          
          return (
            <div key={feature.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {feature.label}
                    </label>
                    {isModified && (
                      <Badge variant="secondary" className="text-xs">
                        {currentValue > 0 ? '+' : ''}{currentValue.toFixed(1)}σ
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-mono text-gray-900">
                    {feature.baseline.toFixed(2)}{feature.unit}
                  </div>
                  <div className="text-xs text-gray-500">baseline</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={currentValue}
                    onChange={(e) => handleSliderChange(feature.key, parseFloat(e.target.value))}
                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider
                      ${isModified ? 'accent-blue-600' : 'accent-gray-400'}
                    `}
                    aria-label={`${feature.label} adjustment in standard deviations`}
                  />
                  {/* Tick marks */}
                  <div className="absolute top-3 left-0 right-0 flex justify-between text-xs text-gray-400 pointer-events-none">
                    <span>-3σ</span>
                    <span>-2σ</span>
                    <span>-1σ</span>
                    <span>0</span>
                    <span>+1σ</span>
                    <span>+2σ</span>
                    <span>+3σ</span>
                  </div>
                </div>

                {/* Effect interpretation */}
                {isModified && (
                  <div className={`text-xs p-2 rounded ${
                    currentValue > 0 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {currentValue > 0 ? 'Higher' : 'Lower'} than baseline: 
                    {feature.key === 'ppda' && (currentValue > 0 ? ' More aggressive pressing' : ' Less pressing intensity')}
                    {feature.key === 'directness' && (currentValue > 0 ? ' More direct play' : ' More patient build-up')}
                    {feature.key === 'possession_share' && (currentValue > 0 ? ' Dominate possession' : ' Less possession-based')}
                    {feature.key === 'block_height_x' && (currentValue > 0 ? ' Higher defensive line' : ' Deeper defensive line')}
                    {feature.key === 'wing_share' && (currentValue > 0 ? ' More wing play' : ' More central play')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary of active overrides */}
      {hasOverrides && (
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Active Adjustments</h4>
          <div className="flex flex-wrap gap-1">
            {Object.entries(overrides).map(([key, value]) => {
              if (value && value !== 0) {
                const feature = features.find(f => f.key === key);
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {feature?.label}: {value > 0 ? '+' : ''}{value.toFixed(1)}σ
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default WhatIfSliders;