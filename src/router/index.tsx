import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import MonitorPage from '@/pages/MonitorPage';
import TrackPage from '@/pages/TrackPage';
import StatisticsPage from '@/pages/StatisticsPage';
import DevicesPage from '@/pages/DevicesPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/monitor" replace />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="*" element={<Navigate to="/monitor" replace />} />
      </Route>
    </Routes>
  );
}
