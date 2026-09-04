import React from 'react';
import {
  Cpu,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Minus,
  Square,
  X,
  Gauge,
  Terminal,
  Globe,
  Database,
} from 'lucide-react';
import { QuotaStatus, WailsRuntimeState, ServiceAccountCredentials, ProxyConfig } from '../types';

interface TitleBarProps {
  quota: QuotaStatus;
  runtimeState: WailsRuntimeState;
  serviceAccount: ServiceAccountCredentials;
  proxyConfig: ProxyConfig;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  onOpenServiceAccountModal: () => void;
  onOpenDataManager?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  quota,
  runtimeState,
  serviceAccount,
  proxyConfig,
  onToggleTerminal,
  isTerminalOpen,
  onOpenServiceAccountModal,
  onOpenDataManager,
}) => {
  const quotaPercentage = Math.round((quota.usedToday / quota.dailyLimit) * 100);

  return (
    <header
      id="wails-window-titlebar"
      className="h-11 bg-white border-b border-slate-200 px-3.5 flex items-center justify-between select-none shrink-0 z-30 text-xs shadow-xs"
    >
      {/* Left: Window controls & Branding */}
      <div className="flex items-center gap-3.5">
        {/* macOS style traffic light dots */}
        <div className="flex items-center gap-1.5 pr-2">
          <button
            id="btn-window-close"
            aria-label="关闭窗口"
            className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group"
          >
            <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            id="btn-window-minimize"
            aria-label="最小化窗口"
            className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center group"
          >
            <Minus className="w-2 h-2 text-amber-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            id="btn-window-maximize"
            aria-label="最大化窗口"
            className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center group"
          >
            <Square className="w-1.5 h-1.5 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Brand & App Title */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-xs">
            GCM
          </div>
          <span className="font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            gcm_google_tool
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Go + Vue 3 + MSSQL
            </span>
          </span>
        </div>
      </div>

      {/* Middle: Go Runtime, MSSQL & IPC Metrics */}
      <div className="hidden md:flex items-center gap-2.5 text-slate-600 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-800 font-medium">Golang {runtimeState.goVersion}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Wails {runtimeState.version}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700">MSSQL:</span>
          <span className="text-blue-600 font-semibold">gcm_google_tool</span>
          <span className="text-emerald-600 font-medium">(3ms)</span>
        </div>

        {/* VPN Proxy 127.0.0.1:10081 Badge */}
        <div
          id="titlebar-proxy-badge"
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50/70 border border-blue-200 text-blue-800"
          title={`Google API 专用 VPN 代理: ${proxyConfig.proxyUrl} (时延 ${proxyConfig.latencyMs}ms) - 所有 Indexing/Merchant/Search Console 均强制由此代理访问`}
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-600">代理:</span>
          <span className="font-semibold text-blue-700">127.0.0.1:10081</span>
          <span className="text-emerald-600 font-medium">({proxyConfig.latencyMs}ms)</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>IPC:</span>
          <span className="text-emerald-600 font-semibold">{runtimeState.ipcLatencyMs} ms</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>Goroutines:</span>
          <span className="text-slate-900 font-medium">{runtimeState.activeGoroutines}</span>
          <span className="text-slate-300">/</span>
          <span>{runtimeState.memoryAllocMb} MB</span>
        </div>
      </div>

      {/* Right: Indexing Quota Pill, Credentials & Terminal Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Quota Badge */}
        <div
          id="titlebar-quota-badge"
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 shadow-xs"
          title={`今日已用 ${quota.usedToday}/${quota.dailyLimit} 配额 (剩余 ${quota.dailyLimit - quota.usedToday}，待处理队列 ${quota.queuedCount})`}
        >
          <Gauge className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-700 font-mono text-[11px]">
            配额: <span className="font-bold text-blue-600">{quota.usedToday}</span>/
            {quota.dailyLimit}
          </span>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                quotaPercentage > 85
                  ? 'bg-rose-500'
                  : quotaPercentage > 60
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Data Management Modal Trigger */}
        {onOpenDataManager && (
          <button
            id="btn-open-data-manager-titlebar"
            onClick={onOpenDataManager}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/80 transition-colors shadow-xs"
            title="打开数据管理中心：导入 CSV/URL、拉取 MSSQL、存量 XML 管理、备份还原"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>数据管理</span>
          </button>
        )}

        {/* Service Account Status */}
        <button
          id="btn-service-account-status"
          onClick={onOpenServiceAccountModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border shadow-xs ${
            serviceAccount.isConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
          }`}
          title="点击配置 Google Cloud Service Account 凭据"
        >
          {serviceAccount.isConfigured ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>{serviceAccount.isConfigured ? 'Service Account 已授权' : '凭证未配置'}</span>
        </button>

        {/* Live Terminal Log Drawer Toggle */}
        <button
          id="btn-toggle-terminal"
          onClick={onToggleTerminal}
          className={`p-1.5 rounded-md transition-colors border shadow-xs ${
            isTerminalOpen
              ? 'bg-blue-50 text-blue-600 border-blue-300'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
          title="切换实时 Go IPC / Google API 运行日志抽屉"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
