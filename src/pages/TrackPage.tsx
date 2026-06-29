import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  App,
  Tooltip,
  Table,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useConfigStore } from '@/store/useConfigStore';
import PlaybackBar from '@/components/PlaybackBar';
import { generateTrackPoints, generateAlertEvents, getDefaultTrackRange } from '@/mock/tracks';
import { exportTrackExcel, formatTime, formatSpeed, headingToText } from '@/utils/formatters';
import type { TrackPoint, AlertEvent } from '@/types';

const { RangePicker } = DatePicker;

function FitBounds({ points }: { points: TrackPoint[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (points.length >= 2 && !done.current) {
      const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds.pad(0.15), { maxZoom: 15 });
      done.current = true;
    }
    return () => {
      done.current = false;
    };
  }, [points, map]);
  return null;
}

function EventMarkerIcon(type: 'disabled' | 'overspeed', level?: 'mild' | 'severe') {
  const color = type === 'disabled' ? (level === 'severe' ? '#EF4444' : '#F97316') : '#F59E0B';
  const icon = type === 'disabled' ? '⚠' : '⚡';
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:bold;font-size:14px;
      border:3px solid white;
      box-shadow:0 2px 8px ${color}99;">${icon}</div>`,
  });
}

function VehiclePositionIcon(heading: number) {
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div style="position:relative;">
        <div style="
          position:absolute;
          width:44px;height:44px;border-radius:50%;
          background:rgba(59,130,246,0.2);
          animation:markerPulse 1.8s ease-out infinite;"></div>
        <div style="
          position:relative;
          width:36px;height:36px;border-radius:50%;
          background:#3B82F6;
          border:3px solid white;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 16px rgba(59,130,246,0.6);
          transform:rotate(${heading}deg);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="transform:rotate(${-heading}deg)">
            <path d="M12 2L4 12l8 10 8-10z"/>
          </svg>
        </div>
      </div>`,
  });
}

export default function TrackPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const threshold = useConfigStore((s) => s.threshold);
  const { message } = App.useApp();

  const range = getDefaultTrackRange();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(range.start),
    dayjs(range.end),
  ]);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [queried, setQueried] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [currentIdx, setCurrentIdx] = useState(0);
  const playTimer = useRef<number | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const queryTrack = () => {
    if (!selectedVehicleId || !dateRange?.[0] || !dateRange?.[1]) {
      message.warning('请选择车辆和时间范围');
      return;
    }
    const v = vehicles.find((x) => x.id === selectedVehicleId)!;
    const pts = generateTrackPoints(
      selectedVehicleId,
      dateRange[0].valueOf(),
      dateRange[1].valueOf(),
      threshold.overspeedThreshold,
    );
    const evts = generateAlertEvents(pts, v.id, v.plateNumber, v.driverName);
    setTrack(pts);
    setEvents(evts);
    setCurrentIdx(0);
    setPlaying(false);
    setQueried(true);
    message.success(`已加载 ${pts.length} 条轨迹点，${evts.length} 个事件`);
  };

  useEffect(() => {
    if (track.length > 0) queryTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId]);

  useEffect(() => {
    if (playing && track.length > 0) {
      playTimer.current = window.setInterval(() => {
        setCurrentIdx((prev) => {
          const step = Math.max(1, Math.floor(playbackSpeed * 2));
          const next = prev + step;
          if (next >= track.length - 1) {
            setPlaying(false);
            return track.length - 1;
          }
          return next;
        });
      }, 1000 / Math.max(1, playbackSpeed / 2));
    }
    return () => {
      if (playTimer.current) window.clearInterval(playTimer.current);
    };
  }, [playing, playbackSpeed, track.length]);

  const currentPoint = track[currentIdx];
  const currentTime = currentPoint?.timestamp ?? dateRange?.[0]?.valueOf() ?? Date.now();
  const startTime = track[0]?.timestamp ?? dateRange?.[0]?.valueOf() ?? Date.now();
  const endTime = track[track.length - 1]?.timestamp ?? dateRange?.[1]?.valueOf() ?? Date.now();

  const eventColumns: ColumnsType<AlertEvent> = useMemo(
    () => [
      {
        title: '类型',
        dataIndex: 'type',
        width: 110,
        render: (t, r) => (
          <Tag color={t === 'disabled' ? (r.disabledLevel === 'severe' ? 'red' : 'orange') : 'warning'}>
            {t === 'disabled' ? (r.disabledLevel === 'severe' ? '重度失能' : '轻度失能') : '超速'}
          </Tag>
        ),
      },
      { title: '时间', dataIndex: 'timestamp', width: 160, render: (t) => formatTime(t), className: 'font-mono text-xs' },
      { title: '车速', dataIndex: 'speed', width: 90, render: (s) => formatSpeed(s), className: 'font-mono text-xs' },
      {
        title: '时长',
        dataIndex: 'duration',
        width: 90,
        render: (d) => (d ? `${d}秒` : '-'),
        className: 'font-mono text-xs',
      },
      {
        title: '位置',
        dataIndex: 'locationName',
        ellipsis: true,
        render: (t) => <span className="text-xs">{t}</span>,
      },
      {
        title: '状态',
        dataIndex: 'handled',
        width: 80,
        render: (h) => <Tag color={h ? 'green' : 'red'}>{h ? '已处理' : '未处理'}</Tag>,
      },
    ],
    [],
  );

  return (
    <div className="h-full flex flex-col gap-3 p-4">
      <Card className="flex-shrink-0 !py-3" styles={{ body: { padding: '12px 20px' } }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-text-secondary text-sm whitespace-nowrap">车辆选择：</span>
            <Select
              style={{ width: 200 }}
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
              placeholder="请选择车辆"
              showSearch
              optionFilterProp="label"
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.plateNumber} · ${v.driverName}`,
              }))}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-text-secondary text-sm whitespace-nowrap">时间段：</span>
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              value={dateRange}
              onChange={(v) => v && setDateRange([v[0]!, v[1]!])}
              style={{ width: 380 }}
              suffixIcon={<CalendarOutlined />}
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={queryTrack}
            size="middle"
          >
            查询轨迹
          </Button>
          <Tooltip title="导出当前轨迹为Excel">
            <Button
              icon={<DownloadOutlined />}
              disabled={track.length === 0}
              onClick={() => {
                if (selectedVehicle) {
                  exportTrackExcel(track, `${selectedVehicle.plateNumber}_轨迹数据`);
                  message.success('已导出轨迹Excel');
                }
              }}
            >
              导出Excel
            </Button>
          </Tooltip>
          {selectedVehicle && (
            <div className="ml-auto flex items-center gap-4 text-sm">
              <Tag color="blue">{selectedVehicle.plateNumber}</Tag>
              <span className="text-text-secondary">驾驶员：</span>
              <span className="font-medium">{selectedVehicle.driverName}</span>
              <span className="text-text-secondary">车队：</span>
              <span className="font-medium">{selectedVehicle.fleet}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        <Card
          className="col-span-8 !p-0 min-h-0 overflow-hidden flex flex-col"
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 } }}
          title={
            <div className="flex items-center justify-between w-full pr-2">
              <span className="flex items-center gap-2">
                <EnvironmentOutlined /> 轨迹回放地图
              </span>
              {track.length > 0 && (
                <Space size="small" className="text-xs">
                  <Tag>共 {track.length} 个轨迹点</Tag>
                  <Tag color="orange">{events.length} 个事件</Tag>
                </Space>
              )}
            </div>
          }
          extra={
            queried && currentPoint && (
              <Tooltip title="当前位置详情">
                <Tag icon={<InfoCircleOutlined />} color="blue">
                  {Math.round(currentPoint.speed)} km/h · {headingToText(currentPoint.heading)}
                </Tag>
              </Tooltip>
            )
          }
        >
          <div className="flex-1 relative min-h-0">
            {track.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-text-secondary">
                <div className="text-center">
                  <EnvironmentOutlined className="text-5xl opacity-30 mb-3 block" />
                  <p>请选择车辆和时间段后点击「查询轨迹」</p>
                </div>
              </div>
            ) : (
              <>
                <MapContainer
                  center={[currentPoint?.latitude ?? 39.9, currentPoint?.longitude ?? 116.4]}
                  zoom={13}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds points={track} />
                  <Polyline
                    positions={track.map((p) => [p.latitude, p.longitude])}
                    pathOptions={{
                      color: '#3B82F6',
                      weight: 4,
                      opacity: 0.85,
                    }}
                  />
                  <Polyline
                    positions={track
                      .slice(0, currentIdx + 1)
                      .map((p) => [p.latitude, p.longitude])}
                    pathOptions={{
                      color: '#10B981',
                      weight: 6,
                      opacity: 0.95,
                    }}
                  />
                  {events.map((e) => (
                    <Marker
                      key={e.id}
                      position={[e.latitude, e.longitude]}
                      icon={EventMarkerIcon(e.type, e.disabledLevel)}
                    >
                      <Popup>
                        <div className="min-w-[200px] text-sm">
                          <div className="font-bold mb-2 flex items-center gap-2">
                            <ThunderboltOutlined className={e.type === 'disabled' ? 'text-red-500' : 'text-orange-500'} />
                            {e.type === 'disabled'
                              ? e.disabledLevel === 'severe'
                                ? '重度失能事件'
                                : '轻度失能事件'
                              : '超速事件'}
                          </div>
                          <div className="text-xs space-y-1">
                            <div>时间: {formatTime(e.timestamp)}</div>
                            <div>车速: {formatSpeed(e.speed)}</div>
                            <div>位置: {e.locationName}</div>
                            {e.duration && <div>持续: {e.duration}秒</div>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {currentPoint && (
                    <Marker
                      key="current"
                      position={[currentPoint.latitude, currentPoint.longitude]}
                      icon={VehiclePositionIcon(currentPoint.heading)}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-bold mb-2">当前回放位置</div>
                          <div className="text-xs space-y-1">
                            <div>时间: {formatTime(currentPoint.timestamp)}</div>
                            <div>车速: {formatSpeed(currentPoint.speed)}</div>
                            <div>方向: {headingToText(currentPoint.heading)}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
                <div className="absolute left-4 bottom-4 right-4 z-[1000]">
                  <PlaybackBar
                    startTime={startTime}
                    endTime={endTime}
                    currentTime={currentTime}
                    playing={playing}
                    speed={playbackSpeed}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onReset={() => {
                      setCurrentIdx(0);
                      setPlaying(false);
                    }}
                    onSeek={(t) => {
                      const idx = track.findIndex((p) => p.timestamp >= t);
                      setCurrentIdx(Math.max(0, idx >= 0 ? idx : track.length - 1));
                    }}
                    onSpeedChange={(s) => setPlaybackSpeed(s)}
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        <Card
          className="col-span-4 !p-0 min-h-0 flex flex-col"
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 } }}
          title={
            <div className="flex items-center gap-2">
              <ThunderboltOutlined /> 事件点位列表
              <Tag color="orange" className="!ml-1">{events.length}</Tag>
            </div>
          }
        >
          {currentPoint && (
            <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
              <Descriptions
                column={2}
                size="small"
                labelStyle={{ color: '#94A3B8', fontSize: 12 }}
                contentStyle={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}
              >
                <Descriptions.Item label="当前时间">{formatTime(currentTime)}</Descriptions.Item>
                <Descriptions.Item label="当前车速">{formatSpeed(currentPoint.speed)}</Descriptions.Item>
                <Descriptions.Item label="行驶方向">{headingToText(currentPoint.heading)}</Descriptions.Item>
                <Descriptions.Item label="回放进度">{((currentIdx / Math.max(1, track.length - 1)) * 100).toFixed(1)}%</Descriptions.Item>
              </Descriptions>
            </div>
          )}
          <Table<AlertEvent>
            size="small"
            dataSource={events}
            rowKey="id"
            columns={eventColumns}
            pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
            scroll={{ y: 'auto' }}
            locale={{ emptyText: queried ? '本时段内无异常事件' : '请先查询轨迹' }}
            onRow={(r) => ({
              onClick: () => {
                const idx = track.findIndex((p) => p.eventId === r.id);
                if (idx >= 0) setCurrentIdx(idx);
              },
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      </div>
    </div>
  );
}
