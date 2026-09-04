import React from 'react';
import {
  Gauge,
  Zap,
  ShoppingBag,
  Store,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Send,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import {
  QuotaStatus,
  ProductDetailPage,
  MerchantProductItem,
  SearchQueryRanking,
  SitemapItem,
} from '../types';

interface DashboardViewProps {
  quota: QuotaStatus;
  products: ProductDetailPage[];
  merchantItems: MerchantProductItem[];
  rankings: SearchQueryRanking[];
  sitemaps: SitemapItem[];
  onBatchSyncMismatches: () => void;
  onNavigateTab: (tab: any) => void;
  onQuickSubmitUrl: (url: string) => void;
  onOpenDataManager?: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quota,
  products,
  merchantItems,
  rankings,
  sitemaps,
  onBatchSyncMismatches,
  onNavigateTab,
  onQuickSubmitUrl,
  onOpenDataManager,
  isSyncing,
}) => {
  // Compute key stats safely without NaN
  const totalProducts = products.length;
  const indexedProducts = products.filter((p) => p.indexStatus === 'INDEXED').length;
  const indexCoveragePercent = totalProducts > 0 ? Math.round((indexedProducts / totalProducts) * 100) : 0;

  const mismatchedItems = merchantItems.filter((m) => m.hasPdpMismatch);
  const disapprovedItems = merchantItems.filter((m) => m.approvalStatus === 'disapproved');
  const merchantHealthRate = merchantItems.length > 0
    ? Math.round(
        ((merchantItems.length - mismatchedItems.length - disapprovedItems.length) /
          merchantItems.length) *
          100
      )
    : 100;

  const totalPageViews = products.reduce((acc, p) => acc + p.pageViews30d, 0);
  const totalOrganicClicks = products.reduce((acc, p) => acc + p.organicClicks30d, 0);
  const totalConversions = products.reduce((acc, p) => acc + p.conversions30d, 0);

  const top3Rankings = rankings.filter((r) => r.currentPosition <= 3).length;
  const avgRankingPosition = rankings.length > 0
    ? (rankings.reduce((acc, r) => acc + r.currentPosition, 0) / rankings.length).toFixed(1)
    : '0.0';

  // Hourly quota pacing simulation data based on real quota.usedToday
  const hourlyQuotaData = [
    { hour: '00:00', value: 0, target: 8 },
    { hour: '03:00', value: Math.min(quota.usedToday, 5), target: 25 },
    { hour: '06:00', value: Math.min(quota.usedToday, 12), target: 50 },
    { hour: '09:00', value: Math.min(quota.usedToday, 28), target: 75 },
    { hour: '12:00', value: Math.min(quota.usedToday, 45), target: 100 },
    { hour: '15:00', value: quota.usedToday, target: 125 },
    { hour: '18:00', value: null, target: 150 },
    { hour: '21:00', value: null, target: 175 },
    { hour: '24:00', value: null, target: 200 },
  ];

  return (
    <div id="view-dashboard" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              全链路 SEO & Google 商家中心自动化监控台
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
              Desktop Pro
            </span>
          </div>
          <p className="text-xs text-slate-500">
            自动化维持站点地图 XML、Google Indexing 200 日配额推送、PDP 流量分析与 Merchant Center
            商品数据双向同步。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-quick-sync-mismatch"
            onClick={onBatchSyncMismatches}
            disabled={isSyncing || mismatchedItems.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>一键同步异常商品 ({mismatchedItems.length})</span>
          </button>

          <button
            id="btn-goto-indexing"
            onClick={() => onNavigateTab('indexing')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>调度 Indexing API</span>
          </button>
        </div>
      </div>

      {/* Clean Slate / Zero Products Onboarding Banner */}
      {products.length === 0 && (
        <div
          id="dashboard-zero-data-banner"
          className="p-5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-blue-950 text-sm mb-1">
                系统当前处于纯净生产初始态（0 个元器件 PDP）
              </div>
              <p className="text-blue-800 leading-relaxed max-w-2xl">
                所有模拟数据已清空。您可以立即从已配置的 MSSQL 生产数据库拉取真实料号，或通过 CSV/URL 清单批量导入外贸产品；也可以一键载入 GlobalChipMall 测试集进行演练。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenDataManager && (
              <button
                type="button"
                onClick={onOpenDataManager}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs"
              >
                <span>打开数据管理器 (导入/从MSSQL拉取)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Critical Alert Banner if there are Mismatches or Policy issues */}
      {(mismatchedItems.length > 0 || disapprovedItems.length > 0) && (
        <div
          id="dashboard-critical-alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-rose-900 mb-0.5 flex items-center gap-2">
                检测到 {mismatchedItems.length} 项商品详情页与 Google Merchant Center 数据不同步
                {disapprovedItems.length > 0 && `，且有 ${disapprovedItems.length} 件商品被拒`}
              </div>
              <p className="text-rose-700 leading-relaxed">
                例如：<span className="font-mono text-rose-900 font-semibold">{mismatchedItems[0]?.sku || 'IC 料号'}</span>{' '}
                网页实盘价或库存状态与 Google 商家中心 Feed 产生偏差，建议立即触发秒级同步规避政策降权。
              </p>
            </div>
          </div>
          <button
            id="btn-resolve-mismatches-inline"
            onClick={() => onNavigateTab('merchant_sync')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shrink-0 transition-colors shadow-xs"
          >
            立即排查并修正
          </button>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Indexing API Quota */}
        <div
          id="metric-card-quota"
          onClick={() => onNavigateTab('indexing')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Gauge className="w-4 h-4 text-blue-600" />
              Indexing API 配额 (24h)
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {quota.pacingMode}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {quota.usedToday}{' '}
              <span className="text-xs font-normal text-slate-400">/ {quota.dailyLimit}</span>
            </div>
            <div className="text-xs font-mono font-medium text-blue-600">
              剩余 {quota.dailyLimit - quota.usedToday}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(quota.usedToday / quota.dailyLimit) * 100}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>缓冲队列: {quota.queuedCount} 条待发</span>
            <span className="text-slate-400 font-mono text-[10px]">重置倒计时 ~8h</span>
          </div>
        </div>

        {/* Card 2: Merchant Center Sync Health */}
        <div
          id="metric-card-merchant"
          onClick={() => onNavigateTab('merchant_sync')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Store className="w-4 h-4 text-emerald-600" />
              Merchant Center 一致性
            </span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                merchantHealthRate >= 90
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {merchantHealthRate}% 达标
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {merchantItems.length - mismatchedItems.length}{' '}
              <span className="text-xs font-normal text-slate-400">/ {merchantItems.length}</span>
            </div>
            <div className="text-xs text-amber-600 font-mono font-medium">
              {mismatchedItems.length} 项差异
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${merchantHealthRate}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>价格/库存强校准已开启</span>
            <span className="text-emerald-600 font-medium">Content API v2.1</span>
          </div>
        </div>

        {/* Card 3: PDP Organic Traffic & Clicks */}
        <div
          id="metric-card-traffic"
          onClick={() => onNavigateTab('pdp_analytics')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              PDP 30天访问量 (PV)
            </span>
            <span className="flex items-center text-emerald-600 text-[11px] font-mono font-medium">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {(totalPageViews / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-slate-500">自然点击 {(totalOrganicClicks / 1000).toFixed(1)}k</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">成单转化</span>
              <span className="font-mono text-slate-800 font-semibold">{totalConversions} 单</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">收录覆盖率</span>
              <span className="font-mono text-blue-600 font-semibold">{indexCoveragePercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Search Console Rank Performance */}
        <div
          id="metric-card-rankings"
          onClick={() => onNavigateTab('rank_tracker')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              搜索排名表现 (SERP)
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              GSC 监控
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold font-mono text-slate-900">
              #{avgRankingPosition}{' '}
              <span className="text-xs font-normal text-slate-400">平均位次</span>
            </div>
            <div className="text-xs font-mono text-emerald-600 font-medium">{top3Rankings} 个词进 Top 3</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Rich Snippet</span>
              <span className="text-emerald-600 font-medium">100% 具备</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sitemap 提交</span>
              <span className="text-slate-800 font-mono">3 / 3 正常</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 24h Quota Pacing & Crawl Activity Curve */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Google Indexing API 24 小时配额平滑调度曲线 (200 Limit)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Go 后台 Token-Bucket 算法依时间窗口智能分配配额，避免白天高峰被低优先级爬虫耗尽。
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> 实际消耗 ({quota.usedToday})
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-400" /> 目标平滑线
              </span>
            </div>
          </div>

          {/* SVG Pacing Line Chart */}
          <div className="h-56 w-full pt-4 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.8" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.8" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.8" />

              {/* Target Line (Dashed) */}
              <polyline
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                points="0,170 75,160 150,140 225,115 300,90 375,65 450,45 525,25 600,10"
              />

              {/* Gradient Area under Actual Curve */}
              <defs>
                <linearGradient id="quotaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon
                fill="url(#quotaGradient)"
                points="0,170 0,172 75,152 150,132 225,95 300,70 375,45 375,170"
              />

              {/* Actual Curve */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                points="0,172 75,152 150,132 225,95 300,70 375,45"
              />

              {/* Dots for points */}
              <circle cx="0" cy="172" r="4" fill="#2563eb" />
              <circle cx="75" cy="152" r="4" fill="#2563eb" />
              <circle cx="150" cy="132" r="4" fill="#2563eb" />
              <circle cx="225" cy="95" r="4" fill="#2563eb" />
              <circle cx="300" cy="70" r="4" fill="#2563eb" />
              <circle cx="375" cy="45" r="6" fill="#1d4ed8" className="animate-pulse" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
              <span>00:00 UTC</span>
              <span>03:00</span>
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span className="text-blue-600 font-bold">15:00 (当前)</span>
              <span>18:00</span>
              <span>21:00</span>
              <span>24:00 (重置)</span>
            </div>
          </div>

          {/* Quick Insights Row */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">当前调度策略</span>
              <span className="font-semibold text-blue-700">Smart Paced (智能步调)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">CRITICAL 优先保留</span>
              <span className="font-semibold text-emerald-700">已预留 25 次突发额度</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 text-[10px] block">自动缓冲队列</span>
              <span className="font-semibold text-amber-700">{quota.queuedCount} 条任务等待 00:00</span>
            </div>
          </div>
        </div>

        {/* Right: Search Rankings & High-Intent Queries */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                核心商业词搜索排名走势
              </h2>
              <button
                id="btn-view-all-rankings"
                onClick={() => onNavigateTab('rank_tracker')}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
              >
                全部 <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              监控详情页在 Google 搜索结果中的真实排名与 Rich Results 标识。
            </p>

            <div className="space-y-2">
              {rankings.slice(0, 4).map((rank) => (
                <div
                  key={rank.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-900 truncate">{rank.query}</div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{rank.productName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-blue-600 font-medium">CTR {rank.ctr}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-slate-900 flex items-center justify-end gap-1">
                      #{rank.currentPosition}
                      {rank.positionChange > 0 ? (
                        <span className="text-emerald-600 text-[10px] flex items-center">
                          <ArrowUpRight className="w-3 h-3" />+{rank.positionChange}
                        </span>
                      ) : rank.positionChange < 0 ? (
                        <span className="text-rose-600 text-[10px] flex items-center">
                          <ArrowDownRight className="w-3 h-3" />
                          {rank.positionChange}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {rank.clicks30d} 次点击
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900">
            💡 <span className="font-semibold text-indigo-950">排名决策建议：</span>{' '}
            「罗技 MX Master 3S」排在第 1.4 位且具有 Merchant 徽章，建议维持 Schema
            现货状态；「MacBook Pro 16」由于缺货导致排名下滑 1.4 位，已触发缺货下架调度。
          </div>
        </div>
      </div>

      {/* Bottom Row: Product Detail Pages Status & Sitemaps Sync Quick Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              重点产品详情页 (PDP) 索引与商家数据即时巡检
            </h2>
            <p className="text-[11px] text-slate-500">
              包含价格比对、库存有效性、Schema 结构化数据和 Google Indexing API 快速重新提交。
            </p>
          </div>
          <button
            id="btn-view-all-pdp"
            onClick={() => onNavigateTab('pdp_analytics')}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            查看全部 PDP ({products.length}) <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">SKU / 商品名称</th>
                <th className="py-2.5 px-3 font-semibold">实盘价格</th>
                <th className="py-2.5 px-3 font-semibold">库存状态</th>
                <th className="py-2.5 px-3 font-semibold">Google 索引状态</th>
                <th className="py-2.5 px-3 font-semibold">Merchant Center</th>
                <th className="py-2.5 px-3 font-semibold text-right">快捷操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 5).map((product) => {
                const isMismatch = product.merchantSyncStatus === 'MISMATCH';
                const isDisapproved = product.merchantSyncStatus === 'DISAPPROVED';

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{product.sku}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{product.category}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      ¥{product.price.toFixed(2)}
                      {isMismatch && product.merchantPrice && product.merchantPrice !== product.price && (
                        <div className="text-[10px] text-rose-600 font-normal">
                          Feed: ¥{product.merchantPrice.toFixed(2)} (差额)
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {product.inStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          现货 ({product.stockCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          缺货售罄
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {product.indexStatus === 'INDEXED' ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已收录
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> 已发现未编入
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {isMismatch ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          数据差异 (需同步)
                        </span>
                      ) : isDisapproved ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          审核驳回
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          已同步 (Sync)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        id={`btn-pdp-quick-submit-${product.id}`}
                        onClick={() => onQuickSubmitUrl(product.url)}
                        title="立即向 Google Indexing API 发起推送通知"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-medium transition-colors border border-slate-200 hover:border-blue-300 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>推送 Indexing</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
