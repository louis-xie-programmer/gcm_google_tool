import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Map,
  ShoppingBag,
  Store,
  TrendingUp,
  Workflow,
  Code2,
  Settings,
  AlertTriangle,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'indexing'
  | 'sitemaps'
  | 'pdp_analytics'
  | 'merchant_sync'
  | 'rank_tracker'
  | 'automation'
  | 'mssql_storage'
  | 'wails_code'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mismatchCount: number;
  queuedCount: number;
  unindexedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mismatchCount,
  queuedCount,
  unindexedCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: '全景仪表板',
      sublabel: 'Overview & Health',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'mssql_storage' as ActiveTab,
      label: 'MSSQL 数据库与缓存',
      sublabel: '配置 / PDP / 站点地图',
      icon: Database,
      badge: 'MSSQL',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      id: 'indexing' as ActiveTab,
      label: 'Google Indexing API',
      sublabel: '配额优化与调度',
      icon: Zap,
      badge: queuedCount > 0 ? `${queuedCount} 待发` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'sitemaps' as ActiveTab,
      label: '站点地图自动同步',
      sublabel: 'XML 验证 & Ping',
      icon: Map,
      badge: null,
    },
    {
      id: 'pdp_analytics' as ActiveTab,
      label: '产品详情页访问分析',
      sublabel: 'PDP 流量 & 转化',
      icon: ShoppingBag,
      badge: unindexedCount > 0 ? `${unindexedCount} 未收录` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'merchant_sync' as ActiveTab,
      label: 'Merchant Service 同步',
      sublabel: '商品数据与搜索对齐',
      icon: Store,
      badge: mismatchCount > 0 ? `${mismatchCount} 异常` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'rank_tracker' as ActiveTab,
      label: '搜索监控与排名',
      sublabel: 'SERP & 关键词走势',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'automation' as ActiveTab,
      label: 'SEO 自动化与决策流',
      sublabel: '规则引擎 & 策略',
      icon: Workflow,
      badge: 'Active',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'wails_code' as ActiveTab,
      label: 'Wails + Vue 3 架构源码',
      sublabel: 'gcm_google_tool 工程',
      icon: Code2,
      badge: 'Go + Vue 3',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
  ];

  return (
    <aside
      id="desktop-app-sidebar"
      className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-sm"
    >
      {/* Navigation list */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          全链路运营与调度
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-medium'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs truncate">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.sublabel}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-700 text-white border-blue-500/50'
                      : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="p-3 border-t border-slate-800 bg-[#0B132B]/60 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> 自动化引擎状态
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              后台监听中
            </span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-2">
            每 15 分钟自动对比 PDP 与 Google Merchant 数据，若检测到缺货即刻触发 200 配额内优先上报。
          </p>
        </div>

        <button
          id="btn-nav-settings"
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors border ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-transparent'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>服务凭证与环境配置</span>
        </button>
      </div>
    </aside>
  );
};
