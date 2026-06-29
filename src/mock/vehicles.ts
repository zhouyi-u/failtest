import type { Vehicle, IMCDevice, Camera, ThresholdConfig } from '@/types';

const BEIJING_CENTER = { lat: 39.9042, lng: 116.4074 };

const FLEETS = ['试验一队', '试验二队', '试验三队'];
const DRIVERS = ['张伟', '李强', '王磊', '刘洋', '陈杰', '杨帆', '赵鹏', '孙浩', '周明', '吴涛', '郑军', '黄勇'];
const MODELS = ['IMC-Pro-2000', 'IMC-Pro-3000', 'IMC-Lite-1000'];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export const DEFAULT_THRESHOLD: ThresholdConfig = {
  severeDisableDuration: 30,
  overspeedThreshold: 120,
  disableAlertCooldown: 60,
};

export function generateVehicles(count: number = 12): Vehicle[] {
  const vehicles: Vehicle[] = [];
  for (let i = 0; i < count; i++) {
    const latOffset = rand(-0.08, 0.08);
    const lngOffset = rand(-0.1, 0.1);
    const statusRand = Math.random();
    let status: Vehicle['status'];
    if (statusRand < 0.08) status = 'disabled';
    else if (statusRand < 0.2) status = 'overspeed';
    else if (statusRand < 0.32) status = 'offline';
    else status = 'online';

    const riskRand = Math.random();
    let risk: Vehicle['driverRiskLevel'];
    if (riskRand < 0.55) risk = 'low';
    else if (riskRand < 0.85) risk = 'medium';
    else risk = 'high';

    vehicles.push({
      id: `veh-${String(i + 1).padStart(3, '0')}`,
      plateNumber: `京A·${randInt(10000, 99999)}`,
      fleet: pick(FLEETS),
      driverName: DRIVERS[i % DRIVERS.length],
      driverRiskLevel: risk,
      status,
      gps: {
        latitude: BEIJING_CENTER.lat + latOffset,
        longitude: BEIJING_CENTER.lng + lngOffset,
        heading: randInt(0, 360),
        speed: status === 'offline' ? 0 : status === 'overspeed' ? rand(121, 150) : rand(15, 110),
        timestamp: Date.now() - randInt(0, 300000),
      },
      imcDeviceId: `imc-${String(i + 1).padStart(3, '0')}`,
      cameraIds: [`cam-${String(i + 1).padStart(3, '0')}a`, `cam-${String(i + 1).padStart(3, '0')}b`],
    });
  }
  return vehicles;
}

export function generateIMCDevices(vehicles: Vehicle[]): IMCDevice[] {
  return vehicles.map((v, idx) => {
    const isOnline = v.status !== 'offline';
    return {
      id: v.imcDeviceId,
      deviceCode: `IMC-${String(idx + 1).padStart(5, '0')}`,
      model: pick(MODELS),
      boundVehicleId: v.id,
      boundVehiclePlate: v.plateNumber,
      onlineStatus: isOnline ? 'online' : 'offline',
      signalStrength: isOnline ? randInt(55, 99) : 0,
      batteryLevel: isOnline ? randInt(35, 100) : randInt(0, 20),
      lastActiveTime: Date.now() - randInt(0, isOnline ? 60000 : 3600000 * 5),
    };
  });
}

export function generateCameras(vehicles: Vehicle[]): Camera[] {
  const positions: Camera['position'][] = ['front', 'rear', 'left', 'right', 'in_cabin'];
  const cameras: Camera[] = [];
  let idx = 0;
  vehicles.forEach((v) => {
    const numCameras = randInt(2, 4);
    for (let j = 0; j < numCameras; j++) {
      idx++;
      const pos = positions[j % positions.length];
      const isOnline = v.status !== 'offline' && Math.random() > 0.1;
      cameras.push({
        id: `cam-${String(idx).padStart(4, '0')}`,
        cameraCode: `CAM-${String(idx).padStart(5, '0')}`,
        position: pos,
        boundVehicleId: v.id,
        boundVehiclePlate: v.plateNumber,
        onlineStatus: isOnline ? 'online' : 'offline',
        streamUrl: `rtsp://192.168.1.${randInt(10, 200)}:554/stream/${idx}`,
      });
    }
  });
  return cameras;
}
