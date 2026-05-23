/**
 * useSimulation Hook
 * 
 * Why Web Workers?
 * Monte Carlo simulations are computationally expensive (O(N * M * D) where N is simulation count, 
 * M is asset count, and D is the number of steps/days in the horizon). Running this heavy mathematical 
 * engine on the main browser thread would completely freeze the User Interface (UI), causing poor user 
 * experience, unresponsive clicks, and potential browser "page unresponsive" warnings.
 * 
 * To solve this, we offload all calculation loops (e.g., generating correlated random walks, rebalancing, 
 * and tracking percentiles) to a Web Worker running in a separate background thread. The custom hook 
 * manages the life cycle of this worker (spawning, terminating on unmount/re-runs, and receiving messages 
 * asynchronously) to keep the UI perfectly smooth and responsive at 60 FPS.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Asset, AssetHistory, SimulationSummary } from '@/types';

interface SimulationState {
  loading: boolean;
  error: string | null;
  result: SimulationSummary | null;
}

export interface RunMonteCarloOptions {
  assets: Asset[];
  assetsHistory: AssetHistory[];
  initialInvestment: number;
  horizonYears: number;
  simulationsCount: number;
  model: 'gbm' | 'bootstrap';
  rebalanceFrequency: 'none' | 'monthly' | 'annually';
}

interface WorkerSuccessResponse {
  status: 'success';
  data: SimulationSummary;
}

interface WorkerErrorResponse {
  status: 'error';
  error: string;
}

type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    loading: false,
    error: null,
    result: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const isMounted = useRef<boolean>(true);

  // Set up mount status and cleanup worker on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const runMonteCarlo = useCallback((options: RunMonteCarloOptions) => {
    const {
      assets,
      assetsHistory,
      initialInvestment,
      horizonYears,
      simulationsCount,
      model,
      rebalanceFrequency,
    } = options;

    // Terminate existing worker if it's running to prevent race conditions
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setState({ loading: true, error: null, result: null });

    try {
      // Create a new ESM Web Worker
      // Vite handles ESM workers with this modern syntax
      workerRef.current = new Worker(
        new URL('../workers/simulationWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const response = e.data;
        
        if (isMounted.current) {
          if (response.status === 'success') {
            setState({ loading: false, error: null, result: response.data });
          } else {
            setState({ loading: false, error: response.error || 'Simulation failed', result: null });
          }
        }

        // Terminate the worker after single execution to free resources
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };

      workerRef.current.onerror = (err: ErrorEvent) => {
        console.error('Worker error:', err);
        
        if (isMounted.current) {
          setState({ loading: false, error: err.message || 'Web worker runtime error', result: null });
        }

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };

      // Post parameters to the worker to kick off simulation
      workerRef.current.postMessage({
        assets,
        assetsHistory,
        initialInvestment,
        horizonYears,
        simulationsCount,
        model,
        rebalanceFrequency,
      });

    } catch (err) {
      if (isMounted.current) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to initialize simulation worker',
          result: null,
        });
      }
    }
  }, []);

  const cancelSimulation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      if (isMounted.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  return {
    ...state,
    runMonteCarlo,
    cancelSimulation,
  };
}
