import { create } from 'zustand';
import type { Vehicle, AlertEvent, IMCDevice, Camera } from '@/types';
import { generateVehicles, generateIMCDevices, generateCameras } from '@/mock/vehicles';

interface VehicleState {
  vehicles: Vehicle[];
  imcDevices: IMCDevice[];
  cameras: Camera[];
  selectedVehicleId: string | null;
  initData: () => void;
  setSelectedVehicle: (id: string | null) => void;
  refreshVehiclePositions: () => void;
  getVehicleById: (id: string) => Vehicle | undefined;
  getVehicleCameras: (vehicleId: string) => Camera[];
  getVehicleIMC: (vehicleId: string) => IMCDevice | undefined;
}

function moveVehicle(v: Vehicle): Vehicle {
  if (v.status === 'offline') return v;
  const gps = { ...v.gps };
  const headingRad = (gps.heading * Math.PI) / 180;
  const distKm = (gps.speed * 2) / 3600;
  gps.latitude += (distKm / 111) * Math.cos(headingRad) * (0.5 + Math.random());
  gps.longitude += (distKm / (111 * Math.cos((gps.latitude * Math.PI) / 180))) * Math.sin(headingRad) * (0.5 + Math.random());
  gps.heading = (gps.heading + (Math.random() - 0.5) * 12 + 360) % 360;
  gps.speed = Math.max(0, Math.min(160, gps.speed + (Math.random() - 0.5) * 10));
  gps.timestamp = Date.now();

  let status = v.status;
  if (status === 'disabled' || status === 'overspeed') {
    if (Math.random() < 0.25) status = 'online';
  } else {
    const r = Math.random();
    if (r < 0.01) status = 'disabled';
    else if (r < 0.025) status = 'overspeed';
  }
  if (status === 'overspeed' && gps.speed < 120) gps.speed = 125 + Math.random() * 20;

  return { ...v, gps, status };
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  imcDevices: [],
  cameras: [],
  selectedVehicleId: null,

  initData: () => {
    const vehicles = generateVehicles(12);
    set({
      vehicles,
      imcDevices: generateIMCDevices(vehicles),
      cameras: generateCameras(vehicles),
    });
  },

  setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

  refreshVehiclePositions: () => {
    const { vehicles } = get();
    set({ vehicles: vehicles.map(moveVehicle) });
  },

  getVehicleById: (id) => get().vehicles.find((v) => v.id === id),

  getVehicleCameras: (vehicleId) => get().cameras.filter((c) => c.boundVehicleId === vehicleId),

  getVehicleIMC: (vehicleId) => get().imcDevices.find((d) => d.boundVehicleId === vehicleId),
}));
