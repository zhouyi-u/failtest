# 基于高精定位的可靠性试验运行管理系统

> **Reliability Test Operation Management System Based on High-Precision Positioning**
>
> 面向车辆可靠性试验场景的专业管理平台，通过高精 GPS 定位技术、IMC 采集设备与 360° 摄像头，实现对试验车辆的 **实时监控、轨迹追溯、驾驶员状态分析与设备全生命周期管理**。

<p align="center">
  <img src="https://img.shields.io/badge/React-18%2B-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5%2B-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/AntDesign-5%2B-0170FE?style=for-the-badge&logo=antdesign&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/ECharts-5-AA344D?style=for-the-badge&logo=apacheecharts&logoColor=white" />
</p>

---

## ✨ 核心功能模块

### 🚗 1. 实时监控模块
- **全量车辆在线地图**：全屏暗色风格 Leaflet 地图，实时展示全量车辆当前 GPS 坐标、行驶速度、行驶方向
- **动态轨迹持续刷新**：车辆行驶轨迹点每 2s 持续追加更新，形成可视化拖尾效果
- **状态高亮预警**：
  - 🟢 在线车辆：呼吸脉冲动画标记
  - ⚪ 离线车辆：灰化处理，无动画
  - 🔴 失能车辆：红色闪烁动画，最高优先级
  - 🟠 超速车辆：橙色闪烁动画
- **实时告警消息弹窗**：驾驶员失能 / 超速事件触发右侧滑入抽屉告警，附带抓拍图片、发生时间、当时车速、位置详情
- **车辆列表面板**：左侧支持搜索车牌/驾驶员、按状态筛选，点击一键地图定位聚焦

### 🛰️ 2. 轨迹管理模块
- **任意时间段轨迹查询**：车辆选择器 + 日期范围选择器，精准定位目标时段
- **倍速回放控制**：底部专业播放控制条，支持 1x / 2x / 4x / 8x / 16x 倍速播放、暂停、进度任意拖动、一键重置
- **事件点位标注**：
  - ⚠️ 失能事件：橙色 / 红色图标标注（轻度/重度）
  - ⚡ 超速事件：黄色图标标注
  - 点击事件跳转至对应轨迹时间点
- **事件明细表格**：实时事件列表、类型筛选、时间/车速/时长/位置详情
- **Excel 导出**：一键导出完整轨迹数据 Excel（时间、经度、纬度、车速、失能标记 5 列）

### 📊 3. 驾驶员失能统计模块
- **单车当日看板**：6 项核心指标卡片（失能总数、累计时长、重度次数、超速次数、在统车辆、高风险驾驶员数）
- **多维度统计报表**：
  - 📈 失能趋势：支持日 / 周 / 月三种时间粒度，折线面积图 + 超速柱状图复合展示
  - 🍩 失能类型分布：环形饼图 + 明细进度条（疲劳驾驶 / 注意力分散 / 急加减速 / 违规变道等）
  - 🏆 风险排行 TOP10：横向渐变柱状图 + 综合风险评分
- **驾驶员风险分级**：低 / 中 / 高三级标签 + 风险进度条 + 筛选器
- **双格式报表导出**：
  - Excel：每日统计 / 风险排行 两个 Sheet 完整导出（XLSX）
  - PDF：专业排版报表（带汇总数据 + 表格），可直接打印归档
- **车队维度筛选**：支持按车队过滤所有统计图表

### ⚙️ 4. 设备管理模块
#### 📡 IMC 采集设备管理
- 设备型号 / 编号 / 在线状态总览
- 信号强度进度条（绿 / 黄 / 红三色分级）
- 设备电量可视化监测
- 车辆绑定 / 更换 / 解除绑定
- 最后活跃时间、弱信号设备预警

#### 📹 360° 摄像头管理
- 一车多摄像头关联（前向 / 后向 / 左侧 / 右侧 / 车内 5 种安装位置）
- 在线 / 离线状态监测
- 视频点播入口 Modal（演示 RTSP / HLS 流占位）
- 摄像头与车辆灵活绑定 / 更换

#### 🔧 告警阈值配置
- **重度失能判定时长**：滑块 + 数字框联动（5~300秒），常用预设（10 / 20 / 30 / 60 / 120秒）一键设置
- **同一失能告警冷却时间**：避免告警刷屏（0~600秒）
- **超速判定阈值**：可自定义（60~200 km/h），常用道路限速预设
- 实时规则预览、修改未保存警告、恢复默认、配置即时生效

---

## 🛠️ 技术栈

| 分类 | 技术 | 版本 | 用途 |
|-----|------|-----|-----|
| 框架 | React | 18.x | 组件化开发 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建 | Vite | 5.x | 极速开发 / 构建 |
| UI | Ant Design | 5.x | 深色企业级组件库 |
| 路由 | React Router | 6.x | SPA 页面路由 |
| 状态管理 | Zustand | 4.x | 轻量全局状态（无需 Provider） |
| 地图引擎 | Leaflet + react-leaflet | 1.9 / 4.x | OSM 车辆监控地图 |
| 数据可视化 | ECharts + echarts-for-react | 5.x | 趋势 / 饼图 / 排行图表 |
| 数据导出 | XLSX (SheetJS) | 0.18.x | Excel 报表导出 |
| 数据导出 | jsPDF + jspdf-autotable | 2.x / 3.x | PDF 报表导出 |
| 日期工具 | Day.js | 1.x | 时间格式化 / 范围处理 |
| 样式 | Tailwind CSS | 3.x | 原子化 CSS + 自定义主题 |
| 图标 | Ant Design Icons + Lucide React | 5.x / 0.4x | 语义化图标 |

---

## 🚀 快速开始

### 环境要求
- **Node.js** >= 16.0.0（推荐 18 / 20 LTS）
- **npm** >= 8.x 或 **pnpm** >= 7.x
- 现代浏览器（Chrome / Edge / Firefox，推荐 Chromium 内核 100+）

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:5173
```

### 类型检查
```bash
npm run check
```

### 生产构建
```bash
npm run build
```

### 本地预览构建产物
```bash
npm run preview
```

---

## 📁 项目目录结构

```
.
├── .trae/
│   └── documents/                  # PRD 与技术架构文档
│       ├── PRD-基于高精定位的可靠性试验运行管理系统.md
│       └── TECH-技术架构文档.md
├── public/                         # 静态资源
├── src/
│   ├── assets/                     # 全局静态资源
│   ├── components/                 # 通用可复用组件
│   │   ├── AppLayout.tsx           # 主布局（左侧导航 + 顶部状态栏 + 内容区）
│   │   ├── AlertDrawer.tsx         # 告警事件右侧抽屉
│   │   ├── StatCard.tsx            # 数据看板统计卡片
│   │   └── PlaybackBar.tsx         # 轨迹回放播放控制条
│   ├── pages/                      # 页面模块
│   │   ├── MonitorPage.tsx         # 🚗 实时监控模块
│   │   ├── TrackPage.tsx           # 🛰️ 轨迹管理模块
│   │   ├── StatisticsPage.tsx      # 📊 失能统计模块
│   │   └── DevicesPage.tsx         # ⚙️ 设备管理模块
│   ├── store/                      # Zustand 全局状态
│   │   ├── useVehicleStore.ts      # 车辆 / 设备 / 摄像头状态
│   │   ├── useAlertStore.ts        # 告警事件队列 / 抽屉控制
│   │   └── useConfigStore.ts       # 告警阈值配置
│   ├── mock/                       # Mock 数据生成（演示用）
│   │   ├── vehicles.ts             # 车辆 / IMC / 摄像头模拟数据
│   │   ├── tracks.ts               # 轨迹点 + 告警事件生成
│   │   └── statistics.ts           # 统计 / 趋势 / 排行 / 分布数据
│   ├── utils/                      # 工具函数
│   │   └── formatters.ts           # 时间 / 时长 / 坐标 / 速度格式化 + Excel / PDF 导出
│   ├── types/                      # TypeScript 类型定义（7 大核心数据模型）
│   │   └── index.ts
│   ├── router/                     # React Router 配置
│   │   └── index.tsx
│   ├── styles/                     # 全局样式
│   │   └── globals.css             # 深色主题 + Tailwind 指令 + 自定义动效
│   ├── App.tsx                     # 应用入口组件
│   ├── main.tsx                    # DOM 挂载入口 + AntD 主题 / 路由 / I18n 包裹
│   └── vite-env.d.ts
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                  # Vite + @ 别名配置
├── tailwind.config.js              # Tailwind 主题色 / 字体 / 关键帧动画
├── postcss.config.js
└── README.md
```

---

## 🧭 路由定义

| 路径 | 页面组件 | 功能 |
|-----|---------|-----|
| `/` | 重定向 | 默认跳转到实时监控 |
| `/monitor` | `MonitorPage` | 🚗 实时监控（主页面） |
| `/track` | `TrackPage` | 🛰️ 轨迹回放与导出 |
| `/statistics` | `StatisticsPage` | 📊 失能统计报表与风险分级 |
| `/devices` | `DevicesPage` | ⚙️ IMC / 摄像头 / 阈值配置 |

---

## 🎨 设计规范

### 配色（深色工业科技风）

| 用途 | 色值 | 说明 |
|-----|-----|-----|
| 主背景 | `#0F172A` | 深空灰，降低长时间监控屏幕疲劳 |
| 卡片背景 | `#1E293B` | 深蓝灰 + 微透明，层级分明 |
| 主色 | `#0A2540 / #3B82F6` | 科技蓝，导航栏 / 主按钮 |
| 成功 / 在线 | `#10B981` | 正常状态 |
| 失能 / 严重 | `#EF4444` | 最高优先级告警 |
| 超速 / 警告 | `#F59E0B` | 次级预警 |
| 离线 / 次要文本 | `#64748B / #94A3B8` | 灰化降级显示 |

### 字体
- **中文**：Noto Sans SC（思源黑体，专业清晰）
- **数字 / 代码**：JetBrains Mono（等宽字体，数据对比醒目）
- 全局通过 Google Fonts 预连接加载

### 动效
- 页面入场：`pageFadeIn` 轻微上浮 + 渐入
- 在线车辆：呼吸脉冲圈 `markerPulse`
- 失能 / 超速标记：`blinkRed / blinkOrange` 1s 闪烁
- 告警抽屉：`slideInRight` 右侧滑入
- 统计卡片：`hover` 细微上浮 + 阴影加深

---

## 📄 项目文档

详细需求与架构设计文档位于 `.trae/documents/` 目录：

| 文档 | 说明 |
|-----|-----|
| [PRD-基于高精定位的可靠性试验运行管理系统.md](./.trae/documents/PRD-基于高精定位的可靠性试验运行管理系统.md) | **产品需求文档**：4 大模块功能详情、用户流程、UI 设计规范 |
| [TECH-技术架构文档.md](./.trae/documents/TECH-技术架构文档.md) | **技术架构文档**：架构图、路由、7 大数据模型定义、目录结构 |

---

## 🔌 对接真实后端

当前演示版本使用 Mock 数据自动生成。对接真实后端时，只需替换以下模块中的函数实现即可，**上层 UI 组件无需修改**：

| Mock 文件 | 建议对接方式 |
|----------|------------|
| `src/mock/vehicles.ts` | WebSocket 推送车辆实时坐标 / 设备状态（SSE 或 MQTT over WS） |
| `src/mock/tracks.ts` | REST API `/api/tracks?vehicleId=&start=&end=` 获取轨迹点 |
| `src/mock/statistics.ts` | REST API `/api/stats/*` 系列统计聚合接口 |
| 告警事件 | 后端推送（建议 WebSocket 实时通道），写入 `useAlertStore` |

---

## 📝 开发备注

- 本项目为**桌面端优先**设计（1920×1080 以上最佳），不做移动端适配
- 地图瓦片默认使用 OpenStreetMap 公开瓦片，生产环境建议替换为国内地图服务商（高德 / 百度 / Mapbox / 自建矢量瓦片）
- 导出报表为演示数据结构，对接真实数据时只需修改 `utils/formatters.ts` 的导出入参格式即可
- **关于 GitHub Pages**：SPA 路由建议改为 HashRouter，或配置 `404.html` 回落，否则深链接刷新会 404

---

## 📜 License

内部项目 · 仅供授权场景使用
