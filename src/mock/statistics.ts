import type {
  DailyStats,
  TrendPoint,
  RiskRankItem,
  DisableTypeDistribution,
  Vehicle,
} from '@/types';
import dayjs from 'dayjs';

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function generateDailyStats(vehicles: Vehicle[]): DailyStats[] {
  const today = dayjs().format('YYYY-MM-DD');
  return vehicles.map((v) => {
    const disableCount = randInt(0, 12);
    const severeCount = Math.floor(disableCount * rand(0.15, 0.4));
    const totalDuration = disableCount > 0 ? disableCount * randInt(8, 90) : 0;
    return {
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      date: today,
      disableCount,
      totalDisableDuration: Math.round(totalDuration),
      severeDisableCount: severeCount,
      overspeedCount: randInt(0, 8),
      mileage: Math.round(rand(30, 480) * 10) / 10,
    };
  });
}

export function generateTrendData(period: 'day' | 'week' | 'month'): TrendPoint[] {
  const points: TrendPoint[] = [];
  let count: number;
  let labelFn: (i: number) => string;

  if (period === 'day') {
    count = 24;
    labelFn = (i) => `${String(i).padStart(2, '0')}:00`;
  } else if (period === 'week') {
    count = 7;
    labelFn = (i) => dayjs().subtract(6 - i, 'day').format('MM-DD');
  } else {
    count = 30;
    labelFn = (i) => dayjs().subtract(29 - i, 'day').format('MM-DD');
  }

  for (let i = 0; i < count; i++) {
    const total = randInt(6, 42);
    const severe = Math.floor(total * rand(0.1, 0.35));
    points.push({
      period: labelFn(i),
      disableCount: total,
      severeDisableCount: severe,
      overspeedCount: randInt(3, 28),
    });
  }
  return points;
}

export function generateRiskRank(vehicles: Vehicle[]): RiskRankItem[] {
  const items = vehicles.map((v) => {
    const severeCount = randInt(0, 18);
    const disableCount = severeCount + randInt(2, 35);
    const baseScore = severeCount * 5 + disableCount * 1.2 + randInt(0, 15);
    return {
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      driverName: v.driverName,
      riskScore: Math.min(100, Math.round(baseScore)),
      disableCount,
      severeCount,
      rank: 0,
    };
  });
  items.sort((a, b) => b.riskScore - a.riskScore);
  items.forEach((it, idx) => (it.rank = idx + 1));
  return items;
}

export function generateDisableTypeDistribution(): DisableTypeDistribution[] {
  const types = [
    { type: '疲劳驾驶', weight: 35 },
    { type: '注意力分散', weight: 28 },
    { type: '急加速/急减速', weight: 18 },
    { type: '违规变道', weight: 12 },
    { type: '其他', weight: 7 },
  ];
  const totalWeight = types.reduce((s, t) => s + t.weight, 0);
  const totalCount = randInt(120, 260);
  return types.map((t) => {
    const count = Math.round((t.weight / totalWeight) * totalCount);
    return {
      type: t.type,
      count,
      percentage: Math.round((t.weight / totalWeight) * 1000) / 10,
    };
  });
}
