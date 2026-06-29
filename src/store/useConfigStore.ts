import { create } from 'zustand';
import type { ThresholdConfig } from '@/types';
import { DEFAULT_THRESHOLD } from '@/mock/vehicles';

interface ConfigState {
  threshold: ThresholdConfig;
  setThreshold: (config: Partial<ThresholdConfig>) => void;
  resetThreshold: () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  threshold: { ...DEFAULT_THRESHOLD },
  setThreshold: (config) =>
    set((state) => ({ threshold: { ...state.threshold, ...config } })),
  resetThreshold: () => set({ threshold: { ...DEFAULT_THRESHOLD } }),
}));
