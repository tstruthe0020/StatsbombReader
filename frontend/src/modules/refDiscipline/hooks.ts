/**
 * Data fetching hooks for Referee Discipline Analysis
 */

import { useState, useEffect, useMemo } from 'react';
import { TeamBaseline, RefereeBaseline, MatchRecord, PredictionRequest, PredictionResponse, Slope } from './types';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

// Generic fetch hook with caching
const useFetch = <T>(key: string[], fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheKey = JSON.stringify(key);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check cache first
        const cached = sessionStorage.getItem(`refDisc_${cacheKey}`);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            if (!cancelled) {
              setData(cachedData);
              setLoading(false);
            }
            return;
          }
        }
        
        const result = await fetcher();
        
        if (!cancelled) {
          // Cache the result
          sessionStorage.setItem(`refDisc_${cacheKey}`, JSON.stringify({
            data: result,
            timestamp: Date.now()
          }));
          
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);
  
  return { data, loading, error, refetch: () => {
    sessionStorage.removeItem(`refDisc_${cacheKey}`);
    // Trigger re-fetch by changing the effect dependency
  }};
};

// Team baseline hook
export const useTeamBaseline = (teamId?: string, season?: string) => {
  return useFetch<TeamBaseline>(
    ['refDisc/team-baseline', teamId, season].filter(Boolean),
    async () => {
      if (!teamId || !season) {
        throw new Error('Team ID and season are required');
      }
      
      // Try the new analytics endpoint first, fallback to mock
      try {
        const response = await fetch(`${API_BASE_URL}/api/ref-discipline/baselines/team?teamId=${teamId}&season=${season}`);
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      } catch (error) {
        console.log('Using mock data for team baseline:', error);
      }
      
      // Mock data
      return {
        teamId,
        teamName: `Team ${teamId}`,
        season,
        playstyle: {
          possession_share: 0.52 + (Math.random() - 0.5) * 0.2,
          passes_per_possession: 8.5 + (Math.random() - 0.5) * 3,
          directness: 0.42 + (Math.random() - 0.5) * 0.2,
          ppda: 12.5 + (Math.random() - 0.5) * 8,
          wing_share: 0.35 + (Math.random() - 0.5) * 0.2
        },
        discipline: {
          fouls_per_90: 11.2 + (Math.random() - 0.5) * 4,
          yellows_per_90: 2.1 + (Math.random() - 0.5) * 1,
          reds_per_90: 0.08 + Math.random() * 0.1
        },
        matches: 25 + Math.floor(Math.random() * 15)
      } as TeamBaseline;
    }
  );
};

// Referee baseline hook
export const useRefBaseline = (refId?: string, season?: string) => {
  return useFetch<RefereeBaseline>(
    ['refDisc/ref-baseline', refId, season].filter(Boolean),
    async () => {
      if (!refId || !season) {
        throw new Error('Referee ID and season are required');
      }
      
      // Try the analytics endpoint first, fallback to mock
      try {
        const response = await fetch(`${API_BASE_URL}/api/ref-discipline/baselines/referee?refId=${refId}&season=${season}`);
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      } catch (error) {
        console.log('Using mock data for referee baseline:', error);
      }
      
      // Mock data
      return {
        refId,
        refName: `Referee ${refId}`,
        season,
        fouls_per_90: 21.3 + (Math.random() - 0.5) * 8,
        cards_per_90: 3.8 + (Math.random() - 0.5) * 2,
        matches: 18 + Math.floor(Math.random() * 12),
        strongest_slopes: [
          { feature: 'directness', direction: 'up', zone: 'midfield', magnitude: 0.45 },
          { feature: 'ppda', direction: 'down', zone: 'attacking_third', magnitude: -0.32 },
          { feature: 'wing_share', direction: 'up', zone: 'wide_areas', magnitude: 0.28 }
        ]
      } as RefereeBaseline;
    }
  );
};

// Heatmap prediction hook
export const usePredictHeatmap = (request: PredictionRequest | null) => {
  const requestKey = request ? JSON.stringify(request) : null;
  
  return useFetch<PredictionResponse>(
    ['refDisc/predict-heatmap', requestKey].filter(Boolean),
    async () => {
      if (!request) {
        throw new Error('Prediction request is required');
      }
      
      // Try the analytics endpoint first, fallback to mock
      try {
        const response = await fetch(`${API_BASE_URL}/api/ref-discipline/predict/heatmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      } catch (error) {
        console.log('Using mock data for heatmap prediction:', error);
      }
      
      // Mock heatmap data
      const gridSize = request.grid === '5x3' ? 15 : 24;
      const xBins = request.grid === '5x3' ? 5 : 6;
      const yBins = request.grid === '5x3' ? 3 : 4;
      
      const grid = [];
      for (let x = 0; x < xBins; x++) {
        for (let y = 0; y < yBins; y++) {
          const baseValue = 0.8 + Math.random() * 2.2;
          // Add some effect from feature overrides
          let modifier = 1.0;
          if (request.features.directness) modifier += request.features.directness * 0.15;
          if (request.features.ppda) modifier += request.features.ppda * 0.1;
          
          grid.push({
            xBin: x,
            yBin: y,
            value: baseValue * modifier,
            ciLow: (baseValue * modifier) * 0.8,
            ciHigh: (baseValue * modifier) * 1.2
          });
        }
      }
      
      const totalPredicted = grid.reduce((sum, cell) => sum + cell.value, 0);
      const totalBaseline = grid.reduce((sum, cell) => sum + (cell.value / (Object.values(request.features).reduce((sum, v) => sum + (v || 0), 0) * 0.1 + 1)), 0);
      
      return {
        grid,
        totals: {
          predicted: totalPredicted,
          baseline: totalBaseline,
          delta: totalPredicted - totalBaseline
        },
        byThirds: {
          defensive: { predicted: totalPredicted * 0.25, baseline: totalBaseline * 0.25, delta: (totalPredicted - totalBaseline) * 0.25 },
          middle: { predicted: totalPredicted * 0.45, baseline: totalBaseline * 0.45, delta: (totalPredicted - totalBaseline) * 0.45 },
          attacking: { predicted: totalPredicted * 0.30, baseline: totalBaseline * 0.30, delta: (totalPredicted - totalBaseline) * 0.30 }
        }
      } as PredictionResponse;
    }
  );
};

// Referee slopes hook
export const useRefSlopes = (refId?: string, feature?: string, season?: string) => {
  return useFetch<Slope[]>(
    ['refDisc/ref-slopes', refId, feature, season].filter(Boolean),
    async () => {
      if (!refId || !feature || !season) {
        throw new Error('Referee ID, feature, and season are required');
      }
      
      // Try the analytics endpoint first, fallback to mock
      try {
        const response = await fetch(`${API_BASE_URL}/api/ref-discipline/slopes?refId=${refId}&feature=${feature}&season=${season}`);
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      } catch (error) {
        console.log('Using mock data for referee slopes:', error);
      }
      
      // Mock slopes data
      const zones = ['zone_0_0', 'zone_0_1', 'zone_0_2', 'zone_1_0', 'zone_1_1', 'zone_1_2', 
                    'zone_2_0', 'zone_2_1', 'zone_2_2', 'zone_3_0', 'zone_3_1', 'zone_3_2',
                    'zone_4_0', 'zone_4_1', 'zone_4_2'];
      
      return zones.map(zone => ({
        zone,
        ref: refId,
        coef: (Math.random() - 0.5) * 0.8,
        se: 0.05 + Math.random() * 0.15,
        pValue: Math.random()
      }));
    }
  );
};

// Team matches hook with pagination
export const useTeamMatches = (teamId?: string, season?: string, cursor?: string) => {
  return useFetch<{ matches: MatchRecord[]; nextCursor?: string }>(
    ['refDisc/team-matches', teamId, season, cursor].filter(Boolean),
    async () => {
      if (!teamId || !season) {
        throw new Error('Team ID and season are required');
      }
      
      // Try the analytics endpoint first, fallback to mock
      try {
        const url = `${API_BASE_URL}/api/ref-discipline/matches?teamId=${teamId}&season=${season}${cursor ? `&cursor=${cursor}` : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      } catch (error) {
        console.log('Using mock data for team matches:', error);
      }
      
      // Mock matches data
      const matches: MatchRecord[] = Array.from({ length: 10 }, (_, i) => ({
        matchId: `${teamId}_match_${i + (cursor ? parseInt(cursor) : 0)}`,
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        opponent: `Opponent ${i + 1}`,
        homeAway: Math.random() > 0.5 ? 'H' : 'A',
        referee: `Referee ${Math.floor(Math.random() * 20) + 1}`,
        fouls: Math.floor(Math.random() * 20) + 5,
        yellows: Math.floor(Math.random() * 5),
        reds: Math.random() > 0.9 ? 1 : 0,
        heatmapData: Array.from({ length: 15 }, (_, j) => ({
          xBin: j % 5,
          yBin: Math.floor(j / 5),
          value: Math.random() * 3
        }))
      }));
      
      return {
        matches,
        nextCursor: cursor && parseInt(cursor) > 20 ? undefined : String((cursor ? parseInt(cursor) : 0) + 10)
      };
    }
  );
};

// Teams list hook
export const useTeamsList = (season?: string, search?: string) => {
  return useFetch<TeamBaseline[]>(
    ['refDisc/teams-list', season, search].filter(Boolean),
    async () => {
      // Mock teams data
      const teams = Array.from({ length: 20 }, (_, i) => ({
        teamId: `team_${i + 1}`,
        teamName: `Team ${i + 1}`,
        season: season || '2024',
        playstyle: {
          possession_share: 0.45 + Math.random() * 0.2,
          passes_per_possession: 7 + Math.random() * 5,
          directness: 0.3 + Math.random() * 0.4,
          ppda: 8 + Math.random() * 12,
          wing_share: 0.25 + Math.random() * 0.3
        },
        discipline: {
          fouls_per_90: 9 + Math.random() * 6,
          yellows_per_90: 1.5 + Math.random() * 1.5,
          reds_per_90: Math.random() * 0.15
        },
        matches: 20 + Math.floor(Math.random() * 20)
      }));
      
      return search 
        ? teams.filter(team => team.teamName.toLowerCase().includes(search.toLowerCase()))
        : teams;
    }
  );
};

// Referees list hook
export const useRefereesList = (season?: string, search?: string) => {
  return useFetch<RefereeBaseline[]>(
    ['refDisc/referees-list', season, search].filter(Boolean),
    async () => {
      // Mock referees data
      const referees = Array.from({ length: 15 }, (_, i) => ({
        refId: `ref_${i + 1}`,
        refName: `Referee ${i + 1}`,
        season: season || '2024',
        fouls_per_90: 18 + Math.random() * 12,
        cards_per_90: 3 + Math.random() * 3,
        matches: 15 + Math.floor(Math.random() * 15),
        strongest_slopes: [
          { feature: 'directness', direction: Math.random() > 0.5 ? 'up' : 'down', zone: 'midfield', magnitude: Math.random() * 0.5 },
          { feature: 'ppda', direction: Math.random() > 0.5 ? 'up' : 'down', zone: 'attacking_third', magnitude: Math.random() * 0.4 }
        ]
      }));
      
      return search 
        ? referees.filter(ref => ref.refName.toLowerCase().includes(search.toLowerCase()))
        : referees;
    }
  );
};

// Debounced hook for sliders
export const useDebounced = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};