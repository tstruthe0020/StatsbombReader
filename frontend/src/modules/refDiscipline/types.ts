/**
 * Type definitions for Referee Discipline Analysis
 */

export type Filters = {
  season: string;
  grid: '5x3' | '6x4';
  gameState: 'all' | 'leading' | 'drawing' | 'trailing';
  exposure: 'opp_passes' | 'minutes';
};

export type Selection = {
  teamId?: string;
  refId?: string;
  matchId?: string;
};

export type FeatureOverrides = Partial<Record<
  'ppda' | 'directness' | 'possession_share' | 'block_height_x' | 'wing_share',
  number // values in SD units
>>;

export type HeatmapCell = {
  xBin: number;
  yBin: number;
  value: number;
  ciLow?: number;
  ciHigh?: number;
};

export type FoulHeatmapProps = {
  mode: 'actual' | 'predicted' | 'delta';
  grid: '5x3' | '6x4';
  data: HeatmapCell[];
  showCI?: boolean;
};

export type Slope = {
  zone: string;
  ref: string;
  coef: number;
  se: number;
  pValue?: number;
};

export type ForestPlotProps = {
  slopes: Slope[];
  feature: 'directness' | 'ppda' | 'wing_share' | 'possession_share' | 'block_height_x';
};

export type TeamBaseline = {
  teamId: string;
  teamName: string;
  season: string;
  playstyle: {
    possession_share: number;
    passes_per_possession: number;
    directness: number;
    ppda: number;
    wing_share: number;
  };
  discipline: {
    fouls_per_90: number;
    yellows_per_90: number;
    reds_per_90: number;
  };
  matches: number;
};

export type RefereeBaseline = {
  refId: string;
  refName: string;
  season: string;
  fouls_per_90: number;
  cards_per_90: number;
  matches: number;
  strongest_slopes: Array<{
    feature: string;
    direction: 'up' | 'down';
    zone: string;
    magnitude: number;
  }>;
};

export type MatchRecord = {
  matchId: string;
  date: string;
  opponent: string;
  homeAway: 'H' | 'A';
  referee: string;
  fouls: number;
  yellows: number;
  reds: number;
  heatmapData: HeatmapCell[];
};

export type PredictionRequest = {
  refId: string;
  season: string;
  features: FeatureOverrides;
  exposure: 'opp_passes' | 'minutes';
  grid: '5x3' | '6x4';
};

export type PredictionResponse = {
  grid: HeatmapCell[];
  totals: {
    predicted: number;
    baseline: number;
    delta: number;
  };
  byThirds: {
    defensive: { predicted: number; baseline: number; delta: number };
    middle: { predicted: number; baseline: number; delta: number };
    attacking: { predicted: number; baseline: number; delta: number };
  };
};

export type RefDisciplineState = {
  filters: Filters;
  selection: Selection;
  featureOverrides: FeatureOverrides;
  ui: {
    isLoading: boolean;
    error: string | null;
    activeTab: string;
  };
};