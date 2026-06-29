import { create } from 'zustand';
import type { AlertEvent } from '@/types';

interface AlertState {
  alerts: AlertEvent[];
  currentAlert: AlertEvent | null;
  drawerOpen: boolean;
  addAlert: (alert: AlertEvent) => void;
  setCurrentAlert: (alert: AlertEvent | null) => void;
  setDrawerOpen: (open: boolean) => void;
  markHandled: (id: string) => void;
  clearAll: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  currentAlert: null,
  drawerOpen: false,

  addAlert: (alert) => {
    const { alerts } = get();
    if (alerts.some((a) => a.id === alert.id)) return;
    set({
      alerts: [alert, ...alerts].slice(0, 100),
      currentAlert: alert,
      drawerOpen: true,
    });
  },

  setCurrentAlert: (alert) => set({ currentAlert: alert, drawerOpen: !!alert }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),

  markHandled: (id) => {
    set({
      alerts: get().alerts.map((a) => (a.id === id ? { ...a, handled: true } : a)),
      currentAlert:
        get().currentAlert?.id === id
          ? { ...get().currentAlert!, handled: true }
          : get().currentAlert,
    });
  },

  clearAll: () => set({ alerts: [], currentAlert: null, drawerOpen: false }),
}));
