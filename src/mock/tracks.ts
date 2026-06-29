import type { TrackPoint, AlertEvent } from '@/types';
import dayjs from 'dayjs';

const BEIJING_CENTER = { lat: 39.9042, lng: 116.4074 };

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function generateTrackPoints(
  vehicleId: string,
  startTime: number,
  endTime: number,
  overspeedThreshold: number = 120,
): TrackPoint[] {
  const points: TrackPoint[] = [];
  const totalMs = endTime - startTime;
  const intervalMs = 2000;
  const totalPoints = Math.floor(totalMs / intervalMs);

  let lat = BEIJING_CENTER.lat + rand(-0.05, 0.05);
  let lng = BEIJING_CENTER.lng + rand(-0.05, 0.05);
  let heading = randInt(0, 360);
  let speed = rand(20, 80);
  let eventCounter = 0;

  for (let i = 0; i < totalPoints; i++) {
    const ts = startTime + i * intervalMs;

    heading = (heading + rand(-5, 5) + 360) % 360;
    const headingRad = (heading * Math.PI) / 180;
    const distKm = (speed * intervalMs) / 3600000;
    lat += (distKm / 111) * Math.cos(headingRad);
    lng += (distKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(headingRad);

    speed = Math.max(0, Math.min(160, speed + rand(-8, 8)));

    let isDisabled = false;
    let disabledType: 'mild' | 'severe' | undefined;
    let isOverspeed = false;
    let eventId: string | undefined;

    const eventRand = Math.random();
    if (eventRand < 0.008 && speed > 10) {
      isDisabled = true;
      disabledType = Math.random() < 0.3 ? 'severe' : 'mild';
      eventCounter++;
      eventId = `${vehicleId}-evt-${String(eventCounter).padStart(4, '0')}`;
      speed = Math.max(0, speed - rand(5, 20));
    } else if (speed > overspeedThreshold) {
      isOverspeed = true;
      if (Math.random() < 0.2) {
        eventCounter++;
        eventId = `${vehicleId}-evt-${String(eventCounter).padStart(4, '0')}`;
      }
    }

    points.push({
      timestamp: ts,
      latitude: lat,
      longitude: lng,
      heading,
      speed: Math.round(speed * 10) / 10,
      isDisabled,
      disabledType,
      isOverspeed,
      eventId,
    });
  }
  return points;
}

export function generateAlertEvents(points: TrackPoint[], vehicleId: string, plateNumber: string, driverName: string): AlertEvent[] {
  const alerts: AlertEvent[] = [];
  const seenEvents = new Set<string>();

  points.forEach((p) => {
    if (p.eventId && !seenEvents.has(p.eventId)) {
      seenEvents.add(p.eventId);
      const type = p.isDisabled ? 'disabled' : 'overspeed';
      alerts.push({
        id: p.eventId,
        vehicleId,
        plateNumber,
        driverName,
        type,
        disabledLevel: p.disabledType,
        timestamp: p.timestamp,
        duration: p.isDisabled ? (p.disabledType === 'severe' ? randInt(35, 120) : randInt(5, 28)) : undefined,
        speed: p.speed,
        longitude: p.longitude,
        latitude: p.latitude,
        locationName: `北京市朝阳区试验场${randInt(1, 8)}号路段`,
        captureImage: `https://picsum.photos/seed/${p.eventId}/800/450`,
        handled: Math.random() < 0.3,
      });
    }
  });
  return alerts;
}

export function getDefaultTrackRange() {
  const end = dayjs().endOf('day').valueOf();
  const start = dayjs().startOf('day').subtract(1, 'day').valueOf();
  return { start, end };
}
