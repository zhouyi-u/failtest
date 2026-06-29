import dayjs from 'dayjs';
import type { TrackPoint } from '@/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyStats, RiskRankItem } from '@/types';

export function formatTime(ts: number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(ts).format(format);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}小时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export function formatSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function headingToText(heading: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const idx = Math.round(((heading %= 360) < 0 ? heading + 360 : heading) / 45) % 8;
  return dirs[idx];
}

export function calcDistanceKm(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function exportTrackExcel(track: TrackPoint[], filename: string = '轨迹数据'): void {
  const rows = track.map((p) => ({
    时间: formatTime(p.timestamp),
    经度: Number(p.longitude.toFixed(6)),
    纬度: Number(p.latitude.toFixed(6)),
    车速: `${Math.round(p.speed)} km/h`,
    失能标记: p.isDisabled ? (p.disabledType === 'severe' ? '重度失能' : '轻度失能') : p.isOverspeed ? '超速' : '正常',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '轨迹数据');
  XLSX.writeFile(wb, `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
}

export function exportStatsExcel(
  dailyStats: DailyStats[],
  riskRank: RiskRankItem[],
  filename: string = '失能统计报表',
): void {
  const wb = XLSX.utils.book_new();
  const dailyRows = dailyStats.map((s) => ({
    日期: s.date,
    车牌号: s.plateNumber,
    失能总次数: s.disableCount,
    累计失能时长: formatDuration(s.totalDisableDuration),
    重度失能次数: s.severeDisableCount,
    超速次数: s.overspeedCount,
    行驶里程: `${s.mileage} km`,
  }));
  const ws1 = XLSX.utils.json_to_sheet(dailyRows);
  ws1['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, '每日统计');

  const rankRows = riskRank.map((r) => ({
    排名: r.rank,
    车牌号: r.plateNumber,
    驾驶员: r.driverName,
    风险评分: r.riskScore,
    失能总次数: r.disableCount,
    重度失能次数: r.severeCount,
  }));
  const ws2 = XLSX.utils.json_to_sheet(rankRows);
  ws2['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, '风险排行');
  XLSX.writeFile(wb, `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
}

export function exportStatsPDF(
  dailyStats: DailyStats[],
  riskRank: RiskRankItem[],
  filename: string = '失能统计报表',
): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(18);
  doc.text('Reliability Test - Disability Statistics Report', 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 14, 26);

  const totalDisable = dailyStats.reduce((s, r) => s + r.disableCount, 0);
  const totalSevere = dailyStats.reduce((s, r) => s + r.severeDisableCount, 0);
  const totalDuration = dailyStats.reduce((s, r) => s + r.totalDisableDuration, 0);
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.text(
    `Summary: Total ${totalDisable} events | Severe ${totalSevere} | Duration ${formatDuration(totalDuration)}`,
    14,
    36,
  );
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 44,
    head: [['Date', 'Plate', 'Disable Count', 'Duration', 'Severe', 'Overspeed', 'Mileage']],
    body: dailyStats.map((s) => [
      s.date,
      s.plateNumber,
      s.disableCount,
      formatDuration(s.totalDisableDuration),
      s.severeDisableCount,
      s.overspeedCount,
      `${s.mileage} km`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
    theme: 'striped',
  });

  const page2Y = (doc as any).lastAutoTable.finalY + 20 || 40;
  if (page2Y > 160) {
    doc.addPage();
  }
  doc.setFontSize(14);
  doc.text('Risk Ranking', 14, Math.max(40, page2Y));
  autoTable(doc, {
    startY: Math.max(48, page2Y + 8),
    head: [['Rank', 'Plate', 'Driver', 'Risk Score', 'Disable', 'Severe']],
    body: riskRank.map((r) => [r.rank, r.plateNumber, r.driverName, r.riskScore, r.disableCount, r.severeCount]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [239, 68, 68] },
    theme: 'striped',
  });

  doc.save(`${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
}
