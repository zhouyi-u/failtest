import { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CarOutlined,
  DashboardOutlined,
  LineChartOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAlertStore } from '@/store/useAlertStore';
import { useVehicleStore } from '@/store/useVehicleStore';
import dayjs from 'dayjs';

const { Sider, Header, Content } = Layout;

const MENU_ITEMS: MenuProps['items'] = [
  { key: '/monitor', icon: <CarOutlined />, label: '实时监控' },
  { key: '/track', icon: <DashboardOutlined />, label: '轨迹管理' },
  { key: '/statistics', icon: <LineChartOutlined />, label: '失能统计' },
  { key: '/devices', icon: <SettingOutlined />, label: '设备管理' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(dayjs());
  const alerts = useAlertStore((s) => s.alerts);
  const setDrawerOpen = useAlertStore((s) => s.setDrawerOpen);
  const setCurrentAlert = useAlertStore((s) => s.setCurrentAlert);
  const refreshVehicles = useVehicleStore((s) => s.refreshVehiclePositions);

  const unhandledCount = alerts.filter((a) => !a.handled).length;

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => refreshVehicles(), 2000);
    return () => clearInterval(t);
  }, [refreshVehicles]);

  const userMenu: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const alertMenu: MenuProps['items'] = alerts.slice(0, 8).map((a) => ({
    key: a.id,
    label: (
      <div className="flex flex-col gap-1 py-1">
        <div className="flex justify-between items-center gap-4">
          <span className="font-mono text-sm">{a.plateNumber}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            a.type === 'disabled' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {a.type === 'disabled' ? (a.disabledLevel === 'severe' ? '重度失能' : '轻度失能') : '超速'}
          </span>
        </div>
        <div className="text-xs text-text-secondary">{dayjs(a.timestamp).format('MM-DD HH:mm:ss')} · {a.locationName}</div>
      </div>
    ),
    onClick: () => {
      setCurrentAlert(a);
      setDrawerOpen(true);
    },
  }));

  return (
    <Layout className="h-screen w-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        className="!bg-accent-blue border-r border-white/5"
      >
        <div className="h-16 flex items-center justify-center px-4 border-b border-white/5">
          {!collapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-status-info to-status-online flex items-center justify-center flex-shrink-0">
                <CarOutlined className="text-white text-base" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-bold text-sm truncate">高精定位试验管理</span>
                <span className="text-text-secondary text-[10px] truncate">Reliability Test System</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-status-info to-status-online flex items-center justify-center">
              <CarOutlined className="text-white" />
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
          className="!bg-transparent !border-0 mt-2"
        />
      </Sider>
      <Layout>
        <Header className="!bg-secondary-bg !h-16 !px-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-text-primary font-semibold text-base">
              {((MENU_ITEMS || []).find((m: any) => m && m.key === location.pathname) as any)?.label || '系统'}
            </span>
            <span className="h-4 w-px bg-white/10 mx-2" />
            <span className="text-text-secondary text-sm font-mono">{now.format('YYYY-MM-DD HH:mm:ss')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Dropdown menu={{ items: alertMenu }} placement="bottomRight" trigger={['click']}>
              <Badge count={unhandledCount} offset={[-4, 4]} size="small">
                <button
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-text-secondary hover:text-text-primary"
                  onClick={() => {
                    if (alerts.length > 0) {
                      setCurrentAlert(alerts[0]);
                      setDrawerOpen(true);
                    }
                  }}
                >
                  <BellOutlined />
                </button>
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <Avatar size={32} icon={<UserOutlined />} className="!bg-status-info" />
                <div className="flex flex-col leading-tight">
                  <span className="text-text-primary text-sm font-medium">管理员</span>
                  <span className="text-text-secondary text-xs">超级管理员</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="!bg-primary-bg m-0 overflow-auto scrollbar-thin page-fade-in" style={{ height: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
