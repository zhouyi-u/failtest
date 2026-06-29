export type VehicleStatus = 'online' | 'offline' | 'disabled' | 'overspeed';
export type RiskLevel = 'low' | 'medium' | 'high';
export type DisableType = 'mild' | 'severe';
export type AlertType = 'disabled' | 'overspeed';
export type CameraPosition = 'front' | 'rear' | 'left' | 'right' | 'in_cabin';
export type TrendPeriod = 'day' | 'week' | 'month';

export interface GPSData {
  longitude: number;
  latitude: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  fleet: string;
  driverName: string;
  driverRiskLevel: RiskLevel;
  status: VehicleStatus;
  gps: GPSData;
  imcDeviceId: string;
  cameraIds: string[];
}

export interface TrackPoint {
  timestamp: number;
  longitude: number;
  latitude: number;
  speed: number;
  heading: number;
  isDisabled: boolean;
  disabledType?: DisableType;
  isOverspeed: boolean;
  eventId?: string;
}

export interface AlertEvent {
  id: string;
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  type: AlertType;
  disabledLevel?: DisableType;
  timestamp: number;
  duration?: number;
  speed: number;
  longitude: number;
  latitude: number;
  locationName: string;
  captureImage: string;
  handled: boolean;
}

export interface IMCDevice {
  id: string;
  deviceCode: string;
  model: string;
  boundVehicleId: string | null;
  boundVehiclePlate?: string;
  onlineStatus: 'online' | 'offline';
  signalStrength: number;
  batteryLevel: number;
  lastActiveTime: number;
}

export interface Camera {
  id: string;
  cameraCode: string;
  position: CameraPosition;
  boundVehicleId: string | null;
  boundVehiclePlate?: string;
  onlineStatus: 'online' | 'offline';
  streamUrl?: string;
}

export interface DailyStats {
  vehicleId: string;
  plateNumber: string;
  date: string;
  disableCount: number;
  totalDisableDuration: number;
  severeDisableCount: number;
  overspeedCount: number;
  mileage: number;
}

export interface TrendPoint {
  period: string;
  disableCount: number;
  severeDisableCount: number;
  overspeedCount: number;
}

export interface RiskRankItem {
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  riskScore: number;
  disableCount: number;
  severeCount: number;
  rank: number;
}

export interface DisableTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface ThresholdConfig {
  severeDisableDuration: number;
  overspeedThreshold: number;
  disableAlertCooldown: number;
}

export const CAMERA_POSITION_LABEL: Record<CameraPosition, string> = {
  front: '前向',
  rear: '后向',
  left: '左侧',
  right: '右侧',
  in_cabin: '车内',
};

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  online: '在线',
  offline: '离线',
  disabled: '失能',
  overspeed: '超速',
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};
