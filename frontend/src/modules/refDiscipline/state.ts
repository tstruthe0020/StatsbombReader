/**
 * State management for Referee Discipline Analysis
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Filters, Selection, FeatureOverrides, RefDisciplineState } from './types';

// Default state
const defaultFilters: Filters = {
  season: '2024',
  grid: '5x3',
  gameState: 'all',
  exposure: 'opp_passes'
};

const defaultSelection: Selection = {};

const defaultFeatureOverrides: FeatureOverrides = {};

// URL parameter handling
const getFiltersFromURL = (): Partial<Filters> => {
  const params = new URLSearchParams(window.location.search);
  const filters: Partial<Filters> = {};
  
  if (params.get('season')) filters.season = params.get('season')!;
  if (params.get('grid')) filters.grid = params.get('grid') as '5x3' | '6x4';
  if (params.get('gameState')) filters.gameState = params.get('gameState') as any;
  if (params.get('exposure')) filters.exposure = params.get('exposure') as any;
  
  return filters;
};

const getSelectionFromURL = (): Partial<Selection> => {
  const params = new URLSearchParams(window.location.search);
  const selection: Partial<Selection> = {};
  
  if (params.get('teamId')) selection.teamId = params.get('teamId')!;
  if (params.get('refId')) selection.refId = params.get('refId')!;
  if (params.get('matchId')) selection.matchId = params.get('matchId')!;
  
  return selection;
};

const getOverridesFromURL = (): Partial<FeatureOverrides> => {
  const params = new URLSearchParams(window.location.search);
  const overrides: Partial<FeatureOverrides> = {};
  
  const features = ['ppda', 'directness', 'possession_share', 'block_height_x', 'wing_share'];
  features.forEach(feature => {
    const value = params.get(`override_${feature}`);
    if (value && !isNaN(Number(value))) {
      overrides[feature as keyof FeatureOverrides] = Number(value);
    }
  });
  
  return overrides;
};

const updateURL = (filters: Filters, selection: Selection, overrides: FeatureOverrides) => {
  const params = new URLSearchParams();
  
  // Add filters
  if (filters.season !== defaultFilters.season) params.set('season', filters.season);
  if (filters.grid !== defaultFilters.grid) params.set('grid', filters.grid);
  if (filters.gameState !== defaultFilters.gameState) params.set('gameState', filters.gameState);
  if (filters.exposure !== defaultFilters.exposure) params.set('exposure', filters.exposure);
  
  // Add selection
  if (selection.teamId) params.set('teamId', selection.teamId);
  if (selection.refId) params.set('refId', selection.refId);
  if (selection.matchId) params.set('matchId', selection.matchId);
  
  // Add overrides
  Object.entries(overrides).forEach(([feature, value]) => {
    if (value !== undefined && value !== 0) {
      params.set(`override_${feature}`, value.toString());
    }
  });
  
  const newSearch = params.toString();
  const newURL = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
  
  // Only update if URL actually changed to avoid infinite loops
  if (newURL !== window.location.pathname + window.location.search) {
    window.history.replaceState({}, '', newURL);
  }
};

// Zustand store
export const useRefDisciplineStore = create<RefDisciplineState & {
  // Actions
  setFilters: (filters: Partial<Filters>) => void;
  setSelection: (selection: Partial<Selection>) => void;
  setFeatureOverrides: (overrides: Partial<FeatureOverrides>) => void;
  resetOverrides: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
}>(
  subscribeWithSelector((set, get) => ({
    // Initial state from URL or defaults
    filters: { ...defaultFilters, ...getFiltersFromURL() },
    selection: { ...defaultSelection, ...getSelectionFromURL() },
    featureOverrides: { ...defaultFeatureOverrides, ...getOverridesFromURL() },
    ui: {
      isLoading: false,
      error: null,
      activeTab: 'overview'
    },
    
    // Actions
    setFilters: (newFilters) => {
      const currentState = get();
      const updatedFilters = { ...currentState.filters, ...newFilters };
      set({ filters: updatedFilters });
      updateURL(updatedFilters, currentState.selection, currentState.featureOverrides);
    },
    
    setSelection: (newSelection) => {
      const currentState = get();
      const updatedSelection = { ...currentState.selection, ...newSelection };
      set({ selection: updatedSelection });
      updateURL(currentState.filters, updatedSelection, currentState.featureOverrides);
    },
    
    setFeatureOverrides: (newOverrides) => {
      const currentState = get();
      const updatedOverrides = { ...currentState.featureOverrides, ...newOverrides };
      set({ featureOverrides: updatedOverrides });
      updateURL(currentState.filters, currentState.selection, updatedOverrides);
    },
    
    resetOverrides: () => {
      const currentState = get();
      set({ featureOverrides: defaultFeatureOverrides });
      updateURL(currentState.filters, currentState.selection, defaultFeatureOverrides);
    },
    
    setLoading: (loading) => set((state) => ({ ui: { ...state.ui, isLoading: loading } })),
    
    setError: (error) => set((state) => ({ ui: { ...state.ui, error } })),
    
    setActiveTab: (activeTab) => set((state) => ({ ui: { ...state.ui, activeTab } })),
    
    reset: () => {
      set({
        filters: defaultFilters,
        selection: defaultSelection,
        featureOverrides: defaultFeatureOverrides,
        ui: { isLoading: false, error: null, activeTab: 'overview' }
      });
      updateURL(defaultFilters, defaultSelection, defaultFeatureOverrides);
    }
  }))
);

// Selectors
export const useFilters = () => useRefDisciplineStore((state) => state.filters);
export const useSelection = () => useRefDisciplineStore((state) => state.selection);
export const useFeatureOverrides = () => useRefDisciplineStore((state) => state.featureOverrides);
export const useUI = () => useRefDisciplineStore((state) => state.ui);

// Actions
export const useRefDisciplineActions = () => useRefDisciplineStore((state) => ({
  setFilters: state.setFilters,
  setSelection: state.setSelection,
  setFeatureOverrides: state.setFeatureOverrides,
  resetOverrides: state.resetOverrides,
  setLoading: state.setLoading,
  setError: state.setError,
  setActiveTab: state.setActiveTab,
  reset: state.reset
}));