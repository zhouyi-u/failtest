import { useEffect } from 'react';
import AppRouter from '@/router';
import { useVehicleStore } from '@/store/useVehicleStore';

export default function App() {
  const initData = useVehicleStore((s) => s.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return <AppRouter />;
}
