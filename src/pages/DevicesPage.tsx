import { useMemo, useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  Slider,
  InputNumber,
  Row,
  Col,
  Progress,
  Badge,
  Tooltip,
  App,
  Switch,
  Segmented,
  Divider,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  HddOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  SearchOutlined,
  LinkOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  SignalFilled,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  CheckCircleTwoTone,
  EditOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Radio, Cpu, Wifi, ShieldAlert } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useConfigStore } from '@/store/useConfigStore';
import { DEFAULT_THRESHOLD } from '@/mock/vehicles';
import type { IMCDevice, Camera, CameraPosition } from '@/types';
import { CAMERA_POSITION_LABEL, STATUS_LABEL } from '@/types';
import StatCard from '@/components/StatCard';
import { formatTime } from '@/utils/formatters';

export default function DevicesPage() {
  const { vehicles, imcDevices, cameras } = useVehicleStore();
  const { threshold, setThreshold, resetThreshold } = useConfigStore();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [imcSearch, setImcSearch] = useState('');
  const [cameraSearch, setCameraSearch] = useState('');
  const [imcStatusFilter, setImcStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [cameraStatusFilter, setCameraStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindTarget, setBindTarget] = useState<{ type: 'imc' | 'camera'; device: IMCDevice | Camera } | null>(null);
  const [configChanged, setConfigChanged] = useState(false);
  const [playModal, setPlayModal] = useState<{ open: boolean; camera?: Camera }>({ open: false });

  const imcSummary = useMemo(() => ({
    total: imcDevices.length,
    online: imcDevices.filter((d) => d.onlineStatus === 'online').length,
    offline: imcDevices.filter((d) => d.onlineStatus === 'offline').length,
    bound: imcDevices.filter((d) => d.boundVehicleId).length,
    lowSignal: imcDevices.filter((d) => d.onlineStatus === 'online' && d.signalStrength < 65).length,
  }), [imcDevices]);

  const cameraSummary = useMemo(() => ({
    total: cameras.length,
    online: cameras.filter((c) => c.onlineStatus === 'online').length,
    offline: cameras.filter((c) => c.onlineStatus === 'offline').length,
    bound: cameras.filter((c) => c.boundVehicleId).length,
  }), [cameras]);

  const filteredIMC = useMemo(() => imcDevices.filter((d) => {
    const matchSearch = !imcSearch ||
      d.deviceCode.toLowerCase().includes(imcSearch.toLowerCase()) ||
      (d.boundVehiclePlate || '').toLowerCase().includes(imcSearch.toLowerCase());
    const matchStatus = imcStatusFilter === 'all' || d.onlineStatus === imcStatusFilter;
    return matchSearch && matchStatus;
  }), [imcDevices, imcSearch, imcStatusFilter]);

  const filteredCameras = useMemo(() => cameras.filter((c) => {
    const matchSearch = !cameraSearch ||
      c.cameraCode.toLowerCase().includes(cameraSearch.toLowerCase()) ||
      (c.boundVehiclePlate || '').toLowerCase().includes(cameraSearch.toLowerCase());
    const matchStatus = cameraStatusFilter === 'all' || c.onlineStatus === cameraStatusFilter;
    return matchSearch && matchStatus;
  }), [cameras, cameraSearch, cameraStatusFilter]);

  const openBindModal = (type: 'imc' | 'camera', device: IMCDevice | Camera) => {
    setBindTarget({ type, device });
    form.setFieldsValue({
      vehicleId: (device as any).boundVehicleId,
    });
    setBindModalOpen(true);
  };

  const handleBindSubmit = () => {
    form.validateFields().then((values) => {
      const vehicle = vehicles.find((v) => v.id === values.vehicleId);
      if (bindTarget?.type === 'imc') {
        const d = bindTarget.device as IMCDevice;
        d.boundVehicleId = values.vehicleId || null;
        d.boundVehiclePlate = vehicle?.plateNumber;
        message.success(`IMC设备 ${d.deviceCode} 已${values.vehicleId ? '绑定至 ' + vehicle?.plateNumber : '解除绑定'}`);
      } else if (bindTarget?.type === 'camera') {
        const c = bindTarget.device as Camera;
        c.boundVehicleId = values.vehicleId || null;
        c.boundVehiclePlate = vehicle?.plateNumber;
        message.success(`摄像头 ${c.cameraCode} 已${values.vehicleId ? '绑定至 ' + vehicle?.plateNumber : '解除绑定'}`);
      }
      setBindModalOpen(false);
      setBindTarget(null);
    });
  };

  const saveThreshold = () => {
    message.success('告警阈值已保存，立即生效');
    setConfigChanged(false);
  };

  const resetAll = () => {
    modal.confirm({
      title: '确认重置阈值？',
      icon: <ExclamationCircleOutlined />,
      content: '将恢复为系统默认推荐阈值，是否继续？',
      okText: '确认重置',
      cancelText: '取消',
      onOk: () => {
        resetThreshold();
        form.setFieldsValue(DEFAULT_THRESHOLD);
        setConfigChanged(true);
        message.info('已重置为默认阈值，记得点击保存');
      },
    });
  };

  const imcColumns: ColumnsType<IMCDevice> = [
    {
      title: '设备编号',
      dataIndex: 'deviceCode',
      width: 160,
      render: (t, r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-status-info/15 text-status-info flex items-center justify-center flex-shrink-0">
            <Cpu size={16} />
          </div>
          <span className="font-mono font-medium text-sm">{t}</span>
        </div>
      ),
    },
    { title: '设备型号', dataIndex: 'model', width: 140, render: (t) => <Tag color="purple" className="!font-mono text-xs">{t}</Tag> },
    {
      title: '在线状态',
      dataIndex: 'onlineStatus',
      width: 110,
      render: (s, r) => (
        <Badge
          status={s === 'online' ? 'success' : 'default'}
          text={
            <span className="text-sm">
              {s === 'online' ? (
                <span className="text-status-online flex items-center gap-1"><Wifi size={12} /> {STATUS_LABEL.online}</span>
              ) : (
                <span className="text-text-secondary">{STATUS_LABEL.offline}</span>
              )}
            </span>
          }
        />
      ),
    },
    {
      title: '信号强度',
      dataIndex: 'signalStrength',
      width: 180,
      render: (v, r) => r.onlineStatus === 'online' ? (
        <div className="flex items-center gap-2">
          <SignalFilled style={{ color: v >= 80 ? '#10B981' : v >= 50 ? '#F59E0B' : '#EF4444', fontSize: 16 }} />
          <Progress
            percent={v}
            size="small"
            showInfo
            strokeColor={v >= 80 ? '#10B981' : v >= 50 ? '#F59E0B' : '#EF4444'}
            className="!w-24 !mb-0"
            format={(p) => <span className="font-mono text-xs">{p}%</span>}
          />
        </div>
      ) : <span className="text-text-secondary text-xs italic">设备离线</span>,
    },
    {
      title: '电量',
      dataIndex: 'batteryLevel',
      width: 160,
      render: (v) => (
        <div className="flex items-center gap-2">
          <ThunderboltOutlined style={{ color: v >= 50 ? '#10B981' : v >= 20 ? '#F59E0B' : '#EF4444', fontSize: 18 }} />
          <Progress
            percent={v}
            size="small"
            strokeColor={v >= 50 ? '#10B981' : v >= 20 ? '#F59E0B' : '#EF4444'}
            className="!w-20 !mb-0"
            format={(p) => <span className="font-mono text-xs">{p}%</span>}
          />
        </div>
      ),
    },
    {
      title: '绑定车辆',
      dataIndex: 'boundVehiclePlate',
      width: 140,
      render: (t, r) => t ? (
        <Tag icon={<LinkOutlined />} color="blue" className="!font-mono">{t}</Tag>
      ) : (
        <Tag icon={<CloseOutlined />} color="default">未绑定</Tag>
      ),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveTime',
      width: 170,
      className: 'font-mono text-xs text-text-secondary',
      render: (t) => formatTime(t, 'MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openBindModal('imc', r)}
          >
            {r.boundVehicleId ? '更换绑定' : '绑定车辆'}
          </Button>
        </Space>
      ),
    },
  ];

  const cameraColumns: ColumnsType<Camera> = [
    {
      title: '摄像头编号',
      dataIndex: 'cameraCode',
      width: 160,
      render: (t, r) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
            r.onlineStatus === 'online' ? 'bg-status-online/15 text-status-online' : 'bg-white/5 text-text-secondary'
          }`}>
            <Radio size={16} />
          </div>
          <span className="font-mono font-medium text-sm">{t}</span>
        </div>
      ),
    },
    {
      title: '安装位置',
      dataIndex: 'position',
      width: 100,
      render: (p: CameraPosition) => {
        const colors: Record<CameraPosition, string> = {
          front: 'blue', rear: 'cyan', left: 'purple', right: 'geekblue', in_cabin: 'magenta',
        };
        return <Tag color={colors[p]} className="!text-xs">{CAMERA_POSITION_LABEL[p]}</Tag>;
      },
    },
    {
      title: '在线状态',
      dataIndex: 'onlineStatus',
      width: 110,
      render: (s) => (
        <Badge
          status={s === 'online' ? 'success' : 'default'}
          text={
            <span className="text-sm">
              {s === 'online' ? <span className="text-status-online">{STATUS_LABEL.online}</span> : <span className="text-text-secondary">{STATUS_LABEL.offline}</span>}
            </span>
          }
        />
      ),
    },
    {
      title: '绑定车辆',
      dataIndex: 'boundVehiclePlate',
      width: 140,
      render: (t, r) => t ? (
        <Tag icon={<LinkOutlined />} color="blue" className="!font-mono">{t}</Tag>
      ) : (
        <Tag icon={<CloseOutlined />} color="default">未绑定</Tag>
      ),
    },
    {
      title: '视频流地址',
      dataIndex: 'streamUrl',
      ellipsis: true,
      className: 'font-mono text-xs text-text-secondary',
      render: (u) => <code className="text-xs">{u || '-'}</code>,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title={r.onlineStatus === 'online' ? '视频点播' : '设备离线，无法播放'}>
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              disabled={r.onlineStatus !== 'online'}
              onClick={() => setPlayModal({ open: true, camera: r })}
            >
              播放
            </Button>
          </Tooltip>
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => openBindModal('camera', r)}
          >
            {r.boundVehicleId ? '更换' : '绑定'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-auto scrollbar-thin">
      <Card styles={{ body: { padding: 0 } }} className="flex-shrink-0 !rounded-xl overflow-hidden">
        <Tabs
          defaultActiveKey="imc"
          size="large"
          items={[
            {
              key: 'imc',
              label: (
                <span className="!px-2 flex items-center gap-2">
                  <HddOutlined /> IMC采集设备管理
                </span>
              ),
              children: (
                <div className="p-4 pt-0 flex flex-col gap-4">
                  <div className="grid grid-cols-5 gap-3">
                    <StatCard title="IMC设备总数" value={imcSummary.total} unit="台" icon={<Cpu size={20} />} accentColor="#3B82F6" />
                    <StatCard title="在线设备" value={imcSummary.online} unit="台" icon={<Wifi size={20} />} accentColor="#10B981" trend={+2} trendUp={false} />
                    <StatCard title="离线设备" value={imcSummary.offline} unit="台" icon={<ShieldAlert size={20} />} accentColor="#64748B" />
                    <StatCard title="已绑定车辆" value={imcSummary.bound} unit="台" icon={<LinkOutlined />} accentColor="#8B5CF6" description={`绑定率 ${((imcSummary.bound / Math.max(1, imcSummary.total)) * 100).toFixed(0)}%`} />
                    <StatCard title="弱信号设备" value={imcSummary.lowSignal} unit="台" icon={<SignalFilled />} accentColor="#EF4444" description="信号强度<65%" />
                  </div>

                  <Card className="!p-0" styles={{ body: { padding: 0 } }}>
                    <div className="flex items-center gap-3 p-3 border-b border-white/5 flex-wrap">
                      <Input
                        size="middle"
                        prefix={<SearchOutlined />}
                        placeholder="搜索设备编号/车牌"
                        value={imcSearch}
                        onChange={(e) => setImcSearch(e.target.value)}
                        style={{ width: 240 }}
                        allowClear
                      />
                      <Segmented
                        value={imcStatusFilter}
                        onChange={(v) => setImcStatusFilter(v as any)}
                        options={[
                          { label: '全部', value: 'all' },
                          { label: <span className="text-green-400">在线</span>, value: 'online' },
                          { label: <span className="text-slate-400">离线</span>, value: 'offline' },
                        ]}
                      />
                      <div className="ml-auto text-xs text-text-secondary">
                        共 <span className="font-mono text-status-info font-semibold">{filteredIMC.length}</span> 台设备
                      </div>
                    </div>
                    <Table<IMCDevice>
                      size="middle"
                      rowKey="id"
                      dataSource={filteredIMC}
                      columns={imcColumns}
                      scroll={{ x: 1200 }}
                      pagination={{ pageSize: 8, showSizeChanger: true, showQuickJumper: true }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'camera',
              label: (
                <span className="!px-2 flex items-center gap-2">
                  <VideoCameraOutlined /> 360°摄像头管理
                </span>
              ),
              children: (
                <div className="p-4 pt-0 flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-3">
                    <StatCard title="摄像头总数" value={cameraSummary.total} unit="个" icon={<VideoCameraOutlined />} accentColor="#8B5CF6" />
                    <StatCard title="在线摄像头" value={cameraSummary.online} unit="个" icon={<Wifi size={20} />} accentColor="#10B981" trend={+1} trendUp={false} />
                    <StatCard title="离线摄像头" value={cameraSummary.offline} unit="个" icon={<ShieldAlert size={20} />} accentColor="#64748B" />
                    <StatCard title="已关联车辆" value={cameraSummary.bound} unit="个" icon={<LinkOutlined />} accentColor="#06B6D4" description={`关联率 ${((cameraSummary.bound / Math.max(1, cameraSummary.total)) * 100).toFixed(0)}%`} />
                  </div>

                  <Card className="!p-0" styles={{ body: { padding: 0 } }}>
                    <div className="flex items-center gap-3 p-3 border-b border-white/5 flex-wrap">
                      <Input
                        size="middle"
                        prefix={<SearchOutlined />}
                        placeholder="搜索摄像头编号/车牌"
                        value={cameraSearch}
                        onChange={(e) => setCameraSearch(e.target.value)}
                        style={{ width: 240 }}
                        allowClear
                      />
                      <Segmented
                        value={cameraStatusFilter}
                        onChange={(v) => setCameraStatusFilter(v as any)}
                        options={[
                          { label: '全部', value: 'all' },
                          { label: <span className="text-green-400">在线</span>, value: 'online' },
                          { label: <span className="text-slate-400">离线</span>, value: 'offline' },
                        ]}
                      />
                      <div className="ml-auto text-xs text-text-secondary">
                        共 <span className="font-mono text-status-info font-semibold">{filteredCameras.length}</span> 个摄像头
                      </div>
                    </div>
                    <Table<Camera>
                      size="middle"
                      rowKey="id"
                      dataSource={filteredCameras}
                      columns={cameraColumns}
                      scroll={{ x: 1100 }}
                      pagination={{ pageSize: 8, showSizeChanger: true, showQuickJumper: true }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'config',
              label: (
                <span className="!px-2 flex items-center gap-2">
                  <SettingOutlined /> 告警阈值配置
                </span>
              ),
              children: (
                <div className="p-4 pt-0">
                  {configChanged && (
                    <Alert
                      type="warning"
                      showIcon
                      icon={<ExclamationCircleOutlined />}
                      message="阈值已修改但尚未保存"
                      description="修改后的阈值仅在保存后生效，请点击下方「保存配置」按钮"
                      className="mb-4"
                      action={
                        <Button size="small" type="primary" icon={<SaveOutlined />} onClick={saveThreshold}>
                          立即保存
                        </Button>
                      }
                    />
                  )}
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <span className="flex items-center gap-2">
                            <ExclamationCircleOutlined className="text-status-disabled" /> 失能告警参数
                          </span>
                        }
                        className="h-full"
                      >
                        <Form
                          form={form}
                          layout="vertical"
                          initialValues={threshold}
                          onValuesChange={(changed) => {
                            setThreshold(changed);
                            setConfigChanged(true);
                          }}
                        >
                          <Form.Item
                            label={
                              <span>
                                重度失能判定时长
                                <Tag color="red" className="!ml-2 !text-xs">秒</Tag>
                              </span>
                            }
                            name="severeDisableDuration"
                            tooltip="持续失能超过该时长则判定为重度失能事件"
                            rules={[{ required: true, message: '请输入判定时长' }]}
                          >
                            <div className="flex items-center gap-4">
                              <Form.Item noStyle name="severeDisableDuration">
                                <Slider min={5} max={300} step={5} className="flex-1 !mb-0" />
                              </Form.Item>
                              <Form.Item noStyle name="severeDisableDuration">
                                <InputNumber
                                  min={5}
                                  max={300}
                                  step={5}
                                  addonAfter="秒"
                                  style={{ width: 130 }}
                                  controls
                                />
                              </Form.Item>
                            </div>
                          </Form.Item>
                          <div className="text-xs text-text-secondary mb-3 flex flex-wrap gap-x-4 gap-y-1">
                            <span>常用推荐：</span>
                            {[10, 20, 30, 60, 120].map((s) => (
                              <Button
                                key={s}
                                type={threshold.severeDisableDuration === s ? 'primary' : 'default'}
                                size="small"
                                className="!h-6 !text-xs"
                                onClick={() => {
                                  setThreshold({ severeDisableDuration: s });
                                  form.setFieldsValue({ severeDisableDuration: s });
                                  setConfigChanged(true);
                                }}
                              >
                                {s}秒
                              </Button>
                            ))}
                            <Button
                              type="text"
                              size="small"
                              className="!text-status-info !h-6 !px-1"
                              onClick={() => {
                                setThreshold({ severeDisableDuration: DEFAULT_THRESHOLD.severeDisableDuration });
                                form.setFieldsValue({ severeDisableDuration: DEFAULT_THRESHOLD.severeDisableDuration });
                                setConfigChanged(true);
                              }}
                            >
                              默认({DEFAULT_THRESHOLD.severeDisableDuration}秒)
                            </Button>
                          </div>
                          <Divider className="!my-2" />
                          <Form.Item
                            label={
                              <span>
                                同一失能告警冷却时间
                                <Tag color="blue" className="!ml-2 !text-xs">秒</Tag>
                              </span>
                            }
                            name="disableAlertCooldown"
                            tooltip="同一车辆在冷却时间内不重复推送相同类型失能告警"
                            rules={[{ required: true, message: '请输入冷却时间' }]}
                          >
                            <div className="flex items-center gap-4">
                              <Form.Item noStyle name="disableAlertCooldown">
                                <Slider min={0} max={600} step={10} className="flex-1 !mb-0" />
                              </Form.Item>
                              <Form.Item noStyle name="disableAlertCooldown">
                                <InputNumber
                                  min={0}
                                  max={600}
                                  step={10}
                                  addonAfter="秒"
                                  style={{ width: 130 }}
                                  controls
                                />
                              </Form.Item>
                            </div>
                          </Form.Item>
                          <div className="flex items-start gap-2 text-xs text-text-secondary p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <CheckCircleTwoTone twoToneColor="#10B981" />
                            <div>
                              <p><b>重度失能</b>：{threshold.severeDisableDuration}秒以上持续失能，触发最高优先级告警</p>
                              <p className="mt-1"><b>轻度失能</b>：低于该时长的失能事件，仅记录并显示</p>
                              <p className="mt-1"><b>告警冷却</b>：{threshold.disableAlertCooldown}秒内同一车辆失能不重复推送</p>
                            </div>
                          </div>
                        </Form>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <span className="flex items-center gap-2">
                            <VideoCameraOutlined className="text-status-overspeed" /> 超速告警参数
                          </span>
                        }
                        className="h-full"
                      >
                        <Form
                          layout="vertical"
                          initialValues={threshold}
                          onValuesChange={(changed) => {
                            setThreshold(changed);
                            setConfigChanged(true);
                          }}
                        >
                          <Form.Item
                            label={
                              <span>
                                超速判定阈值
                                <Tag color="orange" className="!ml-2 !text-xs">km/h</Tag>
                              </span>
                            }
                            name="overspeedThreshold"
                            tooltip="车速超过该值判定为超速，触发预警并标记轨迹点"
                            rules={[{ required: true, message: '请输入超速阈值' }]}
                          >
                            <div className="flex items-center gap-4">
                              <Form.Item noStyle name="overspeedThreshold">
                                <Slider min={60} max={200} step={5} className="flex-1 !mb-0" />
                              </Form.Item>
                              <Form.Item noStyle name="overspeedThreshold">
                                <InputNumber
                                  min={60}
                                  max={200}
                                  step={5}
                                  addonAfter="km/h"
                                  style={{ width: 150 }}
                                  controls
                                />
                              </Form.Item>
                            </div>
                          </Form.Item>
                          <div className="text-xs text-text-secondary mb-3 flex flex-wrap gap-x-4 gap-y-1">
                            <span>常用推荐：</span>
                            {[80, 100, 120, 140, 160].map((s) => (
                              <Button
                                key={s}
                                type={threshold.overspeedThreshold === s ? 'primary' : 'default'}
                                size="small"
                                className="!h-6 !text-xs"
                                onClick={() => {
                                  setThreshold({ overspeedThreshold: s });
                                  form.setFieldsValue({ overspeedThreshold: s });
                                  setConfigChanged(true);
                                }}
                              >
                                {s} km/h
                              </Button>
                            ))}
                            <Button
                              type="text"
                              size="small"
                              className="!text-status-info !h-6 !px-1"
                              onClick={() => {
                                setThreshold({ overspeedThreshold: DEFAULT_THRESHOLD.overspeedThreshold });
                                form.setFieldsValue({ overspeedThreshold: DEFAULT_THRESHOLD.overspeedThreshold });
                                setConfigChanged(true);
                              }}
                            >
                              默认({DEFAULT_THRESHOLD.overspeedThreshold} km/h)
                            </Button>
                          </div>
                          <Divider className="!my-2" />
                          <div className="space-y-3 text-sm">
                            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20">
                              <div className="font-medium text-status-overspeed mb-2">当前超速判定规则</div>
                              <ul className="space-y-1 text-text-secondary text-xs pl-4 list-disc">
                                <li>车速 ≥ <span className="font-mono text-status-overspeed font-semibold">{threshold.overspeedThreshold} km/h</span> 判定超速</li>
                                <li>地图上车辆标记变为橙色并闪烁预警</li>
                                <li>轨迹点记录为超速事件，导出Excel时标记</li>
                                <li>顶部告警栏实时推送超速事件通知</li>
                              </ul>
                            </div>
                            <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20">
                              <div className="font-medium text-status-disabled mb-2">失能判定规则</div>
                              <ul className="space-y-1 text-text-secondary text-xs pl-4 list-disc">
                                <li>任意失能事件：立即推送 <span className="text-orange-400">轻度失能</span> 告警</li>
                                <li>持续 ≥ {threshold.severeDisableDuration}秒：升级为 <span className="text-red-400 font-semibold">重度失能</span> 告警</li>
                                <li>重度失能将在失能统计中单独统计和高亮</li>
                              </ul>
                            </div>
                          </div>
                        </Form>
                      </Card>
                    </Col>
                  </Row>
                  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                    <Button icon={<ReloadOutlined />} onClick={resetAll}>
                      恢复默认
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      size="middle"
                      onClick={saveThreshold}
                      className="!px-6"
                    >
                      保存配置
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <LinkOutlined />
            {bindTarget?.type === 'imc' ? 'IMC设备车辆绑定' : '摄像头车辆绑定'}
          </span>
        }
        open={bindModalOpen}
        onCancel={() => { setBindModalOpen(false); setBindTarget(null); }}
        onOk={handleBindSubmit}
        okText="确认绑定"
        cancelText="取消"
        width={480}
      >
        {bindTarget && (
          <div className="space-y-4">
            <Alert
              type="info"
              showIcon
              message={bindTarget.type === 'imc'
                ? `设备：${(bindTarget.device as IMCDevice).deviceCode}（${(bindTarget.device as IMCDevice).model}）`
                : `摄像头：${(bindTarget.device as Camera).cameraCode}（${CAMERA_POSITION_LABEL[(bindTarget.device as Camera).position]}）`
              }
              description={
                bindTarget.device.boundVehiclePlate
                  ? `当前已绑定：${bindTarget.device.boundVehiclePlate}，选择下方车辆可更换绑定`
                  : '当前尚未绑定任何车辆，请选择要绑定的车辆'
              }
            />
            <Form form={form} layout="vertical">
              <Form.Item
                label="选择绑定车辆（可选择「不绑定」解除关联）"
                name="vehicleId"
                rules={[{ required: false }]}
              >
                <Select
                  allowClear
                  placeholder="请选择车辆（不选择则解除绑定）"
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  options={[
                    { value: '', label: '— 不绑定（解除当前关联）—' },
                    ...vehicles.map((v) => ({
                      value: v.id,
                      label: `${v.plateNumber} · ${v.driverName} · ${v.fleet}`,
                    })),
                  ]}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <PlayCircleOutlined className="text-status-online" />
            视频点播：{playModal.camera?.cameraCode}
            {playModal.camera && (
              <Tag color={playModal.camera.onlineStatus === 'online' ? 'green' : 'default'} className="!ml-2">
                {CAMERA_POSITION_LABEL[playModal.camera.position]} · {playModal.camera.onlineStatus === 'online' ? '在线' : '离线'}
              </Tag>
            )}
          </span>
        }
        open={playModal.open}
        onCancel={() => setPlayModal({ open: false })}
        footer={[
          <Button key="close" onClick={() => setPlayModal({ open: false })}>关闭</Button>,
          <Button key="full" type="default" icon={<PlayCircleOutlined />}>全屏播放</Button>,
        ]}
        width={780}
      >
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/30 to-black/50 flex flex-col items-center justify-center gap-3">
            <VideoCameraOutlined className="text-6xl text-white/40" />
            <div className="text-center">
              <p className="text-text-primary font-medium">{playModal.camera?.boundVehiclePlate || '未绑定车辆'} - {playModal.camera && CAMERA_POSITION_LABEL[playModal.camera.position]}摄像头</p>
              <p className="text-text-secondary text-sm mt-1 font-mono">{playModal.camera?.streamUrl}</p>
              <p className="text-xs text-status-overspeed mt-2">
                <ExclamationCircleOutlined /> 演示环境：实际部署时请替换为真实RTSP/HLS视频流
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
