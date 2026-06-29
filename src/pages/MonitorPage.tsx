import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, Input, Tag, Button, List, Avatar, Tooltip, Segmented, App } from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { AlertTriangle, Activity, Wifi, WifiOff, Navigation } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useAlertStore } from '@/store/useAlertStore';
import AlertDrawer from '@/components/AlertDrawer';
import StatCard from '@/components/StatCard';
import type { Vehicle, VehicleStatus, AlertEvent, AlertType, DisableType } from '@/types';
import { STATUS_LABEL, RISK_LABEL } from '@/types';
import { formatSpeed, formatTime, headingToText } from '@/utils/formatters';
import { generateAlertEvents, generateTrackPoints, getDefaultTrackRange } from '@/mock/tracks';

const STATUS_COLORS: Record<VehicleStatus, string> = {
  online: '#10B981',
  offline: '#64748B',
  disabled: '#EF4444',
  overspeed: '#F59E0B',
};

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

function VehicleIcon(vehicle: Vehicle): L.DivIcon {
  const color = STATUS_COLORS[vehicle.status];
  const isOffline = vehicle.status === 'offline';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        ${!isOffline ? `<div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${color}33;animation:markerPulse 2s ease-out infinite;"></div>` : ''}
        <div style="
          position:relative;
          width:32px;height:32px;
          border-radius:50%;
          background:${color};
          border:3px solid ${isOffline ? '#334155' : 'white'};
          display:flex;align-items:center;justify-content:center;
          transform: rotate(${vehicle.gps.heading}deg);
          box-shadow: 0 2px 12px ${color}99;
          ${vehicle.status === 'disabled' ? 'animation: blinkRed 1s infinite;' : ''}
          ${vehicle.status === 'overspeed' ? 'animation: blinkOrange 1s infinite;' : ''}
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(${-vehicle.gps.heading}deg)">
            <path d="M12 2L4 12l8 10 8-10z"/>
          </svg>
        </div>
      </div>
    `,
  });
}

function MapController({ center, selectedVehicle }: { center: [number, number]; selectedVehicle: Vehicle | null }) {
  const map = useMap();
  const positioned = useRef(false);
  useEffect(() => {
    if (selectedVehicle && !positioned.current) {
      map.flyTo([selectedVehicle.gps.latitude, selectedVehicle.gps.longitude], 14, { duration: 0.8 });
      positioned.current = true;
    } else if (!selectedVehicle && !positioned.current) {
      map.setView(center, 12);
      positioned.current = true;
    }
  }, [selectedVehicle, map, center]);
  return null;
}

export default function MonitorPage() {
  const { vehicles, selectedVehicleId, setSelectedVehicle, refreshVehiclePositions } = useVehicleStore();
  const { addAlert, alerts } = useAlertStore();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [trailLines, setTrailLines] = useState<Record<string, [number, number][]>>({});
  const lastAlertCheck = useRef<Record<string, number>>({});

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        !search ||
        v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.driverName.includes(search);
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      online: vehicles.filter((v) => v.status === 'online').length,
      disabled: vehicles.filter((v) => v.status === 'disabled').length,
      overspeed: vehicles.filter((v) => v.status === 'overspeed').length,
      offline: vehicles.filter((v) => v.status === 'offline').length,
    };
  }, [vehicles]);

  useEffect(() => {
    const t = setInterval(() => {
      refreshVehiclePositions();
      setTrailLines((prev) => {
        const next = { ...prev };
        vehicles.forEach((v) => {
          const pt: [number, number] = [v.gps.latitude, v.gps.longitude];
          const trail = next[v.id] ? [...next[v.id], pt] : [pt];
          next[v.id] = trail.slice(-60);
        });
        return next;
      });
      vehicles.forEach((v) => {
        if (v.status === 'disabled' || v.status === 'overspeed') {
          const last = lastAlertCheck.current[v.id] || 0;
          if (Date.now() - last > 12000) {
            lastAlertCheck.current[v.id] = Date.now();
            const range = getDefaultTrackRange();
            const pts = generateTrackPoints(v.id, range.start, range.end);
            const evts = generateAlertEvents(pts, v.id, v.plateNumber, v.driverName);
            if (evts.length > 0) {
              const evt = {
                ...evts[evts.length - 1],
                timestamp: Date.now(),
                speed: v.gps.speed,
                longitude: v.gps.longitude,
                latitude: v.gps.latitude,
                type: (v.status === 'disabled' ? 'disabled' : 'overspeed') as AlertType,
                disabledLevel: v.status === 'disabled' ? (Math.random() < 0.4 ? 'severe' : 'mild') as DisableType : undefined,
              } as AlertEvent;
              addAlert(evt);
            }
          }
        }
      });
    }, 2000);
    return () => clearInterval(t);
  }, [refreshVehiclePositions, vehicles, addAlert]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const center: [number, number] = selectedVehicle
    ? [selectedVehicle.gps.latitude, selectedVehicle.gps.longitude]
    : [39.9042, 116.4074];

  return (
    <div className="h-full flex flex-col gap-3 p-4">
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        <StatCard title="试验车辆总数" value={stats.total} unit="辆" icon={<CarOutlined className="text-lg" />} accentColor="#3B82F6" description="全部车辆" />
        <StatCard title="在线车辆" value={stats.online} unit="辆" icon={<Wifi size={20} />} accentColor="#10B981" trend={-2} trendUp={false} description="实时在线" />
        <StatCard title="失能告警" value={stats.disabled} unit="辆" icon={<AlertTriangle size={20} />} accentColor="#EF4444" trend={stats.disabled > 0 ? '+1' : 0} trendUp={stats.disabled > 0} description="需立即处理" />
        <StatCard title="超速告警" value={stats.overspeed} unit="辆" icon={<Activity size={20} />} accentColor="#F59E0B" trend={0} description="当前超速" />
        <StatCard title="离线车辆" value={stats.offline} unit="辆" icon={<WifiOff size={20} />} accentColor="#64748B" trend={+1} trendUp={false} description="信号丢失" />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        <Card
          className="col-span-3 flex flex-col !p-0 min-h-0"
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 } }}
          title={
            <div className="flex items-center justify-between gap-2 w-full pr-2">
              <span className="flex items-center gap-2">
                <CarOutlined /> 车辆列表
                <Tag color="blue" className="!ml-1">{filteredVehicles.length}</Tag>
              </span>
            </div>
          }
          extra={
            <div className="w-[220px]">
              <Input
                size="small"
                prefix={<SearchOutlined />}
                placeholder="搜索车牌/驾驶员"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </div>
          }
        >
          <div className="px-4 pb-3 flex gap-1 flex-wrap flex-shrink-0 border-b border-white/5 mb-1">
            <Segmented
              size="small"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as any)}
              options={[
                { label: '全部', value: 'all' },
                { label: <span className="text-green-400">在线</span>, value: 'online' },
                { label: <span className="text-red-400">失能</span>, value: 'disabled' },
                { label: <span className="text-orange-400">超速</span>, value: 'overspeed' },
                { label: <span className="text-slate-400">离线</span>, value: 'offline' },
              ]}
            />
          </div>
          <List
            className="flex-1 overflow-auto scrollbar-thin"
            itemLayout="horizontal"
            dataSource={filteredVehicles}
            locale={{ emptyText: '暂无匹配车辆' }}
            renderItem={(v) => (
              <List.Item
                className={`!px-4 !py-2.5 cursor-pointer transition-colors border-b border-white/[0.03] last:border-0 ${selectedVehicleId === v.id ? '!bg-status-info/10' : 'hover:!bg-white/5'}`}
                onClick={() => setSelectedVehicle(selectedVehicleId === v.id ? null : v.id)}
                style={{ animation: v.status === 'disabled' || v.status === 'overspeed' ? 'none' : undefined }}
              >
                <div className="w-full flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      size={40}
                      icon={<CarOutlined />}
                      style={{
                        background: STATUS_COLORS[v.status],
                        opacity: v.status === 'offline' ? 0.5 : 1,
                        boxShadow: v.status === 'disabled'
                          ? '0 0 0 3px rgba(239,68,68,0.3)'
                          : v.status === 'overspeed'
                            ? '0 0 0 3px rgba(245,158,11,0.3)'
                            : undefined,
                      }}
                    />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card-bg"
                      style={{ background: STATUS_COLORS[v.status] }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-text-primary truncate">{v.plateNumber}</span>
                      <Tag
                        color={v.status === 'disabled' ? 'red' : v.status === 'overspeed' ? 'orange' : v.status === 'online' ? 'green' : 'default'}
                        className="!text-xs !px-1.5 !py-0 flex-shrink-0"
                      >
                        {STATUS_LABEL[v.status]}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><UserOutlined />{v.driverName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono" style={{ color: RISK_COLORS[v.driverRiskLevel] }}>
                        {RISK_LABEL[v.driverRiskLevel]}
                      </span>
                      <span className="text-xs font-mono text-text-secondary flex items-center gap-1">
                        <Navigation size={10} />
                        {Math.round(v.gps.speed)} km/h · {headingToText(v.gps.heading)}
                      </span>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card
          className="col-span-9 !p-0 min-h-0 overflow-hidden"
          styles={{ body: { padding: 0, height: '100%' } }}
          title={
            <div className="flex items-center justify-between w-full pr-2">
              <span className="flex items-center gap-2">
                <EnvironmentOutlined /> 实时监控地图
              </span>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-online"></span>在线</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-disabled"></span>失能</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-overspeed"></span>超速</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-offline opacity-60"></span>离线</span>
              </div>
            </div>
          }
          extra={
            <Button
              size="small"
              icon={<WarningOutlined />}
              onClick={() => message.info(`当前共 ${alerts.length} 条告警记录，最近未处理 ${alerts.filter((a) => !a.handled).length} 条`)}
            >
              告警 ({alerts.filter((a) => !a.handled).length})
            </Button>
          }
        >
          <div className="w-full h-full">
            <MapContainer
              center={center}
              zoom={12}
              zoomControl={true}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={center} selectedVehicle={selectedVehicle} />
              {Object.entries(trailLines).map(([vid, pts]) => {
                const v = vehicles.find((x) => x.id === vid);
                if (!v || v.status === 'offline' || pts.length < 2) return null;
                return (
                  <Polyline
                    key={`trail-${vid}`}
                    positions={pts}
                    pathOptions={{
                      color: STATUS_COLORS[v.status],
                      weight: 2,
                      opacity: 0.45,
                    }}
                  />
                );
              })}
              {vehicles.map((v) => (
                <Marker
                  key={v.id}
                  position={[v.gps.latitude, v.gps.longitude]}
                  icon={VehicleIcon(v)}
                  eventHandlers={{ click: () => setSelectedVehicle(selectedVehicleId === v.id ? null : v.id) }}
                >
                  <Popup>
                    <div className="min-w-[220px] py-1 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-base">{v.plateNumber}</span>
                        <Tag color={v.status === 'disabled' ? 'red' : v.status === 'overspeed' ? 'orange' : v.status === 'online' ? 'green' : 'default'}>
                          {STATUS_LABEL[v.status]}
                        </Tag>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>驾驶员: <span className="font-medium">{v.driverName}</span></div>
                        <div>所属车队: <span className="font-medium">{v.fleet}</span></div>
                        <div>当前车速: <span className="font-mono text-status-info">{formatSpeed(v.gps.speed)}</span></div>
                        <div>行驶方向: <span className="font-mono">{headingToText(v.gps.heading)} ({v.gps.heading.toFixed(0)}°)</span></div>
                        <div>更新时间: <span className="font-mono text-text-secondary">{formatTime(v.gps.timestamp, 'HH:mm:ss')}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>
      </div>

      <AlertDrawer />
    </div>
  );
}
