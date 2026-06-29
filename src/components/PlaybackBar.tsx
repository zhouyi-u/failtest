import { Button, Select, Slider, Space, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FastForwardOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface PlaybackBarProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  playing: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

export default function PlaybackBar({
  startTime,
  endTime,
  currentTime,
  playing,
  speed,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
  className = '',
}: PlaybackBarProps) {
  const total = endTime - startTime;
  const progress = Math.max(0, Math.min(100, ((currentTime - startTime) / total) * 100));

  return (
    <div className={`bg-card-bg/95 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-2xl ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-xs font-mono text-text-secondary flex-shrink-0 w-36 text-right">
          {dayjs(startTime).format('MM-DD HH:mm:ss')}
        </div>
        <div className="flex-1">
          <Slider
            min={0}
            max={100}
            step={0.1}
            value={progress}
            tooltip={{
              formatter: (v) =>
                dayjs(startTime + ((v ?? 0) / 100) * total).format('YYYY-MM-DD HH:mm:ss'),
            }}
            onChange={(v) => onSeek(startTime + (v / 100) * total)}
            styles={{ track: { background: 'linear-gradient(90deg,#3B82F6,#10B981)' } }}
          />
        </div>
        <div className="text-xs font-mono text-text-secondary flex-shrink-0 w-36">
          {dayjs(endTime).format('MM-DD HH:mm:ss')}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-mono text-text-primary px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          当前: <span className="text-status-info">{dayjs(currentTime).format('HH:mm:ss')}</span>
        </div>
        <Space size="middle">
          <Tooltip title="重置">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={onReset}
              className="!text-text-secondary hover:!text-text-primary"
            />
          </Tooltip>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={playing ? onPause : onPlay}
            className="!w-12 !h-12 !text-xl"
          />
          <Select
            value={speed}
            onChange={onSpeedChange}
            size="small"
            className="w-24"
            suffixIcon={<FastForwardOutlined className="text-xs" />}
            options={[
              { value: 1, label: '1x 速度' },
              { value: 2, label: '2x 速度' },
              { value: 4, label: '4x 速度' },
              { value: 8, label: '8x 速度' },
              { value: 16, label: '16x 速度' },
            ]}
          />
        </Space>
        <div className="text-xs text-text-secondary w-36 text-right">
          进度: {progress.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
