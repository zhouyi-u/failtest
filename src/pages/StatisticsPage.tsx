import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Card,
  Select,
  Button,
  Row,
  Col,
  Segmented,
  Table,
  Tag,
  Space,
  App,
  Tabs,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  TrophyOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  AlertTriangle,
  Activity,
  Users,
  Gauge,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useVehicleStore } from '@/store/useVehicleStore';
import {
  generateDailyStats,
  generateTrendData,
  generateRiskRank,
  generateDisableTypeDistribution,
} from '@/mock/statistics';
import type { DailyStats, RiskRankItem, TrendPeriod } from '@/types';
import { RISK_LABEL } from '@/types';
import { formatDuration, exportStatsExcel, exportStatsPDF } from '@/utils/formatters';

const PERIOD_OPTIONS = [
  { label: '日', value: 'day' as TrendPeriod },
  { label: '周', value: 'week' as TrendPeriod },
  { label: '月', value: 'month' as TrendPeriod },
];

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

function getRiskTag(score: number): { level: 'low' | 'medium' | 'high'; color: string } {
  if (score >= 70) return { level: 'high', color: RISK_COLORS.high };
  if (score >= 40) return { level: 'medium', color: RISK_COLORS.medium };
  return { level: 'low', color: RISK_COLORS.low };
}

export default function StatisticsPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const { message } = App.useApp();

  const [selectedFleet, setSelectedFleet] = useState<string>('all');
  const [period, setPeriod] = useState<TrendPeriod>('day');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [trend, setTrend] = useState(generateTrendData('day'));
  const [riskRank, setRiskRank] = useState<RiskRankItem[]>([]);
  const [typeDist, setTypeDist] = useState(generateDisableTypeDistribution());

  const fleets = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.fleet));
    return Array.from(set);
  }, [vehicles]);

  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => selectedFleet === 'all' || v.fleet === selectedFleet),
    [vehicles, selectedFleet],
  );

  useEffect(() => {
    const d = generateDailyStats(filteredVehicles);
    setDailyStats(d);
    setRiskRank(generateRiskRank(filteredVehicles));
  }, [filteredVehicles]);

  useEffect(() => {
    setTrend(generateTrendData(period));
  }, [period]);

  useEffect(() => {
    setTypeDist(generateDisableTypeDistribution());
  }, [selectedFleet]);

  const filteredRisk = useMemo(() => {
    if (riskFilter === 'all') return riskRank;
    return riskRank.filter((r) => getRiskTag(r.riskScore).level === riskFilter);
  }, [riskRank, riskFilter]);

  const totals = useMemo(() => {
    return {
      disableCount: dailyStats.reduce((s, r) => s + r.disableCount, 0),
      totalDuration: dailyStats.reduce((s, r) => s + r.totalDisableDuration, 0),
      severeCount: dailyStats.reduce((s, r) => s + r.severeDisableCount, 0),
      overspeed: dailyStats.reduce((s, r) => s + r.overspeedCount, 0),
      vehicles: dailyStats.length,
      highRisk: riskRank.filter((r) => getRiskTag(r.riskScore).level === 'high').length,
    };
  }, [dailyStats, riskRank]);

  const trendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(30,41,59,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#F1F5F9' } },
    legend: { data: ['失能总数', '重度失能', '超速'], textStyle: { color: '#94A3B8' }, right: 10, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trend.map((t) => t.period),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#94A3B8', fontSize: 11 },
    },
    series: [
      {
        name: '失能总数',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: trend.map((t) => t.disableCount),
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,130,246,0.4)' },
              { offset: 1, color: 'rgba(59,130,246,0.02)' },
            ],
          },
        },
        lineStyle: { width: 2.5 },
      },
      {
        name: '重度失能',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: trend.map((t) => t.severeDisableCount),
        itemStyle: { color: '#EF4444' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239,68,68,0.35)' },
              { offset: 1, color: 'rgba(239,68,68,0.02)' },
            ],
          },
        },
        lineStyle: { width: 2.5 },
      },
      {
        name: '超速',
        type: 'bar',
        data: trend.map((t) => t.overspeedCount),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#F59E0B' },
              { offset: 1, color: 'rgba(245,158,11,0.3)' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 14,
      },
    ],
  }), [trend]);

  const rankOption = useMemo(() => {
    const top = riskRank.slice(0, 10).reverse();
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(30,41,59,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#F1F5F9' } },
      grid: { left: 100, right: 30, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: top.map((r) => r.plateNumber),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#F1F5F9', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' },
      },
      series: [
        {
          type: 'bar',
          data: top.map((r) => ({
            value: r.riskScore,
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: getRiskTag(r.riskScore).color + 'CC' },
                  { offset: 1, color: getRiskTag(r.riskScore).color + '55' },
                ],
              },
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            color: '#F1F5F9',
            fontSize: 11,
            formatter: '{c}分',
            fontFamily: '"JetBrains Mono", monospace',
          },
        },
      ],
    };
  }, [riskRank]);

  const pieOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(30,41,59,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#F1F5F9' }, formatter: '{b}: {c}次 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#94A3B8', fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
    color: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#A855F7', '#EC4899'],
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#1E293B', borderWidth: 2 },
        label: { show: true, color: '#F1F5F9', formatter: '{d}%', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' },
        labelLine: { length: 8, length2: 8, lineStyle: { color: 'rgba(255,255,255,0.3)' } },
        data: typeDist.map((t) => ({ value: t.count, name: t.type })),
      },
    ],
  }), [typeDist]);

  const statsColumns: ColumnsType<DailyStats> = useMemo(
    () => [
      { title: '车牌号', dataIndex: 'plateNumber', width: 120, render: (t) => <span className="font-mono font-medium">{t}</span> },
      { title: '日期', dataIndex: 'date', width: 110, className: 'font-mono text-xs text-text-secondary' },
      {
        title: '失能总次数',
        dataIndex: 'disableCount',
        width: 100,
        sorter: (a, b) => a.disableCount - b.disableCount,
        render: (v) => (
          <span className={`font-mono font-semibold ${v > 8 ? 'text-status-disabled' : v > 3 ? 'text-status-overspeed' : 'text-text-primary'}`}>{v}</span>
        ),
      },
      {
        title: '累计失能时长',
        dataIndex: 'totalDisableDuration',
        width: 140,
        sorter: (a, b) => a.totalDisableDuration - b.totalDisableDuration,
        render: (v) => <span className="font-mono">{formatDuration(v)}</span>,
      },
      {
        title: '重度失能次数',
        dataIndex: 'severeDisableCount',
        width: 110,
        sorter: (a, b) => a.severeDisableCount - b.severeDisableCount,
        render: (v) => (v > 0 ? <Tag color="red" className="!font-mono">重度 {v}</Tag> : <span className="text-text-secondary font-mono">0</span>),
      },
      { title: '超速次数', dataIndex: 'overspeedCount', width: 90, className: 'font-mono' },
      { title: '行驶里程', dataIndex: 'mileage', width: 110, render: (v) => <span className="font-mono">{v} km</span> },
    ],
    [],
  );

  const rankColumns: ColumnsType<RiskRankItem> = useMemo(
    () => [
      {
        title: '排名',
        dataIndex: 'rank',
        width: 70,
        render: (v) => (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm font-mono ${
            v === 1 ? 'bg-yellow-500/20 text-yellow-400' :
            v === 2 ? 'bg-slate-400/20 text-slate-300' :
            v === 3 ? 'bg-orange-700/30 text-orange-400' :
            'bg-white/5 text-text-secondary'
          }`}>
            {v}
          </div>
        ),
      },
      { title: '车牌号', dataIndex: 'plateNumber', width: 120, render: (t) => <span className="font-mono font-medium">{t}</span> },
      { title: '驾驶员', dataIndex: 'driverName', width: 100, render: (t) => <span className="flex items-center gap-1"><UserOutlined />{t}</span> },
      {
        title: '风险等级',
        width: 110,
        render: (_, r) => {
          const { level, color } = getRiskTag(r.riskScore);
          return <Tag color={level === 'high' ? 'red' : level === 'medium' ? 'orange' : 'green'} style={{ color }}>{RISK_LABEL[level]}</Tag>;
        },
      },
      {
        title: '风险评分',
        dataIndex: 'riskScore',
        width: 160,
        sorter: (a, b) => a.riskScore - b.riskScore,
        render: (v) => {
          const { color } = getRiskTag(v);
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: color }} />
              </div>
              <span className="font-mono text-xs font-bold w-10 text-right" style={{ color }}>{v}</span>
            </div>
          );
        },
      },
      { title: '失能次数', dataIndex: 'disableCount', width: 90, className: 'font-mono' },
      { title: '重度次数', dataIndex: 'severeCount', width: 90, className: 'font-mono text-status-disabled' },
    ],
    [],
  );

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-auto scrollbar-thin">
      <Card className="flex-shrink-0" styles={{ body: { padding: '14px 20px' } }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">车队筛选：</span>
            <Select
              value={selectedFleet}
              onChange={setSelectedFleet}
              style={{ width: 170 }}
              options={[
                { value: 'all', label: '全部车队' },
                ...fleets.map((f) => ({ value: f, label: f })),
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">统计周期：</span>
            <Segmented value={period} onChange={(v) => setPeriod(v as TrendPeriod)} options={PERIOD_OPTIONS} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">风险等级：</span>
            <Segmented
              value={riskFilter}
              onChange={(v) => setRiskFilter(v as any)}
              options={[
                { label: '全部', value: 'all' },
                { label: <span className="text-green-400">低风险</span>, value: 'low' },
                { label: <span className="text-orange-400">中风险</span>, value: 'medium' },
                { label: <span className="text-red-400">高风险</span>, value: 'high' },
              ]}
            />
          </div>
          <Space className="ml-auto">
            <Tooltip title="导出为Excel报表">
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => {
                  exportStatsExcel(dailyStats, riskRank);
                  message.success('Excel报表导出成功');
                }}
              >
                导出 Excel
              </Button>
            </Tooltip>
            <Tooltip title="导出为PDF报表">
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={() => {
                  exportStatsPDF(dailyStats, riskRank);
                  message.success('PDF报表导出成功');
                }}
              >
                导出 PDF
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Card>

      <div className="grid grid-cols-6 gap-3 flex-shrink-0">
        <StatCard title="失能事件总数" value={totals.disableCount} unit="次" icon={<AlertTriangle size={20} />} accentColor="#3B82F6" trend={+5.8} trendUp />
        <StatCard title="累计失能时长" value={formatDuration(totals.totalDuration)} icon={<ClockCircleOutlined className="text-lg" />} accentColor="#6366F1" trend={-2.1} />
        <StatCard title="重度失能次数" value={totals.severeCount} unit="次" icon={<ThunderboltOutlined className="text-lg" />} accentColor="#EF4444" trend={+1} trendUp />
        <StatCard title="超速事件次数" value={totals.overspeed} unit="次" icon={<Activity size={20} />} accentColor="#F59E0B" trend={-3.5} />
        <StatCard title="在统车辆数" value={totals.vehicles} unit="辆" icon={<Users size={20} />} accentColor="#10B981" description={selectedFleet === 'all' ? '全部车队' : selectedFleet} />
        <StatCard title="高风险驾驶员" value={totals.highRisk} unit="人" icon={<Gauge size={20} />} accentColor="#EC4899" trend={totals.highRisk > 3 ? '+1' : 0} trendUp={totals.highRisk > 3} description="需重点关注" />
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={15}>
          <Card
            title={<span className="flex items-center gap-2"><LineChartOutlined /> 失能趋势分析</span>}
            extra={<Tag color="blue">{period === 'day' ? '按小时(今日)' : period === 'week' ? '按周' : '按月'}</Tag>}
          >
            <ReactECharts option={trendOption} style={{ height: 320 }} notMerge lazyUpdate />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title={<span className="flex items-center gap-2"><PieChartOutlined /> 失能类型分布</span>}>
            <ReactECharts option={pieOption} style={{ height: 320 }} notMerge lazyUpdate />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="flex items-center gap-2"><TrophyOutlined /> 车辆风险排行榜 TOP10</span>}
            extra={<span className="text-xs text-text-secondary">评分越高风险越大</span>}
          >
            <ReactECharts option={rankOption} style={{ height: 360 }} notMerge lazyUpdate />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span className="flex items-center gap-2"><BarChartOutlined /> 类型占比明细</span>}>
            <div className="space-y-3 py-1">
              {typeDist.map((t, idx) => {
                const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#A855F7'];
                return (
                  <div key={t.type} className="group">
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: colors[idx % colors.length] }} />
                        <span className="text-text-primary">{t.type}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-text-primary font-semibold">{t.count}次</span>
                        <span className="text-text-secondary">{t.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                        style={{ width: `${t.percentage}%`, background: colors[idx % colors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className="flex-shrink-0"
        title={<span className="flex items-center gap-2"><TrendingUp /> 驾驶员风险分级明细</span>}
      >
        <Table<RiskRankItem>
          size="small"
          rowKey="vehicleId"
          dataSource={filteredRisk}
          columns={rankColumns}
          pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['8', '16', '32'] }}
        />
      </Card>

      <Card
        className="flex-shrink-0"
        title={<span className="flex items-center gap-2"><TrendingDown /> 单车当日失能统计</span>}
      >
        <Table<DailyStats>
          size="small"
          rowKey={(r) => `${r.vehicleId}-${r.date}`}
          dataSource={dailyStats}
          columns={statsColumns}
          pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['8', '16', '32'] }}
        />
      </Card>
    </div>
  );
}
