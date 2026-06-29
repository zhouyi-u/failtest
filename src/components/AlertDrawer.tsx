import { Drawer, Tag, Button, Divider, Row, Col, Statistic, Space } from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAlertStore } from '@/store/useAlertStore';
import { formatTime, formatSpeed, formatCoords, formatDuration } from '@/utils/formatters';

export default function AlertDrawer() {
  const { drawerOpen, setDrawerOpen, currentAlert, markHandled } = useAlertStore();

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleFilled className="text-status-disabled text-xl" />
          <span className="text-status-disabled font-semibold">告警事件详情</span>
          {currentAlert && !currentAlert.handled && (
            <Tag color="red" className="ml-2">未处理</Tag>
          )}
          {currentAlert && currentAlert.handled && (
            <Tag color="green" className="ml-2">已处理</Tag>
          )}
        </div>
      }
      placement="right"
      width={480}
      onClose={() => setDrawerOpen(false)}
      open={drawerOpen}
      extra={
        currentAlert && !currentAlert.handled && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => currentAlert && markHandled(currentAlert.id)}
          >
            标记处理
          </Button>
        )
      }
    >
      {currentAlert && (
        <div className="page-fade-in">
          <div className="mb-5 overflow-hidden rounded-lg border border-white/10">
            <img
              src={currentAlert.captureImage}
              alt="抓拍图片"
              className="w-full h-56 object-cover bg-black/40"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect fill="%231E293B" width="800" height="450"/><text fill="%2364748B" font-family="sans-serif" font-size="24" x="400" y="225" text-anchor="middle" dy=".3em">事件抓拍图像</text></svg>';
              }}
            />
            <div className="px-4 py-2.5 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2 text-sm text-red-400">
              <ThunderboltOutlined />
              <span className="font-medium">
                {currentAlert.type === 'disabled'
                  ? currentAlert.disabledLevel === 'severe'
                    ? '重度失能告警'
                    : '轻度失能告警'
                  : '车辆超速告警'}
              </span>
              <span className="ml-auto text-text-secondary text-xs">
                告警ID: {currentAlert.id}
              </span>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <CarOutlined /> 车牌号
                </div>
                <div className="text-lg font-mono font-semibold text-text-primary">
                  {currentAlert.plateNumber}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <UserOutlined /> 驾驶员
                </div>
                <div className="text-lg font-medium text-text-primary">
                  {currentAlert.driverName}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <ClockCircleOutlined /> 发生时间
                </div>
                <div className="text-base font-mono text-text-primary">
                  {formatTime(currentAlert.timestamp)}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <InfoCircleOutlined /> 当时车速
                </div>
                <div className={`text-lg font-mono font-bold ${currentAlert.speed > 120 ? 'text-status-overspeed' : 'text-status-disabled'}`}>
                  {formatSpeed(currentAlert.speed)}
                </div>
              </div>
            </Col>
            {currentAlert.duration !== undefined && (
              <Col span={24}>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                    <ClockCircleOutlined /> 持续时长
                  </div>
                  <div className="text-base font-mono text-text-primary">
                    {formatDuration(currentAlert.duration)}
                  </div>
                </div>
              </Col>
            )}
            <Col span={24}>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <EnvironmentOutlined /> 发生位置
                </div>
                <div className="text-base text-text-primary mb-1">
                  {currentAlert.locationName}
                </div>
                <div className="text-xs font-mono text-text-secondary">
                  经纬度: {formatCoords(currentAlert.latitude, currentAlert.longitude)}
                </div>
              </div>
            </Col>
          </Row>

          <Divider className="my-5 !border-white/5" />

          <div className="flex items-center justify-between">
            <Space>
              <Tag color="blue">车辆ID: {currentAlert.vehicleId}</Tag>
            </Space>
            <Space>
              <Button size="small" onClick={() => setDrawerOpen(false)}>关闭</Button>
            </Space>
          </div>
        </div>
      )}
    </Drawer>
  );
}
