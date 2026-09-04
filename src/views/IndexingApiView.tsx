import React, { useState } from 'react';
import {
  Zap,
  Gauge,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Database,
} from 'lucide-react';
import {
  QuotaStatus,
  IndexingSubmissionRecord,
  IndexingNotificationType,
  IndexingPriority,
  ProductDetailPage,
} from '../types';

interface IndexingApiViewProps {
  quota: QuotaStatus;
  submissions: IndexingSubmissionRecord[];
  products: ProductDetailPage[];
  onSubmitUrl: (url: string, type: IndexingNotificationType, priority: IndexingPriority) => Promise<void>;
  onBatchSubmitQueued: () => Promise<void>;
  onChangePacingMode: (mode: 'AGGRESSIVE' | 'SMART_PACED' | 'CONSERVATIVE') => void;
  isSubmitting: boolean;
}

export const IndexingApiView: React.FC<IndexingApiViewProps> = ({
  quota,
  submissions,
  products,
  onSubmitUrl,
  onBatchSubmitQueued,
  onChangePacingMode,
  isSubmitting,
}) => {
  const [inputUrl, setInputUrl] = useState(
    products[0]?.url || 'https://www.globalchipmall.com/product/STM32F407VGT6.html'
  );
  const [notificationType, setNotificationType] = useState<IndexingNotificationType>('URL_UPDATED');
  const [priority, setPriority] = useState<IndexingPriority>('HIGH');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'RATE_LIMITED' | 'QUEUED'>('ALL');
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const quotaPercent = Math.round((quota.usedToday / quota.dailyLimit) * 100);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    await onSubmitUrl(inputUrl.trim(), notificationType, priority);
  };

  const handleInspectUrl = async () => {
    if (!inputUrl.trim()) return;
    setIsInspecting(true);
    await new Promise((r) => setTimeout(r, 600));
    const matched = products.find((p) => p.url === inputUrl.trim());

    setInspectionResult({
      url: inputUrl,
      verdict: matched ? (matched.indexStatus === 'INDEXED' ? 'PASS' : 'PARTIAL') : 'PASS',
      coverageState: matched ? matched.indexStatus : 'INDEXED',
      crawledAs: 'Googlebot Smartphone (Mobile First Indexing)',
      lastCrawlTime: matched?.lastCrawledAt || '2026-09-04 02:18:22 UTC',
      canonicalUrl: inputUrl,
      mobileUsability: 'Passed (Page is mobile friendly)',
      richResults: ['Product (Valid)', 'Breadcrumb (Valid)', 'Merchant Listings (Eligible)'],
    });
    setIsInspecting(false);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = sub.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="view-indexing-api" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Google Indexing API 调度与 200 每日配额优化管理
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Google Indexing API 针对具有 JobPosting 或 BroadcastEvent 的页面，并在电商实践中被广泛应用于商品下架、售罄缺货 (URL_DELETED) 及重要促销调价 (URL_UPDATED) 的极速索引感知。
            系统通过优先级调度与流量整形，确保 200 次免费额度发挥最大价值。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-batch-submit-queue"
            onClick={onBatchSubmitQueued}
            disabled={isSubmitting || quota.queuedCount === 0 || quota.usedToday >= quota.dailyLimit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>平滑派发队列任务 ({quota.queuedCount})</span>
          </button>
        </div>
      </div>

      {/* Quota Management & Pacing Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Gauge & Progress */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              当日配额使用进度
            </span>
            <span className="font-mono text-blue-600 font-bold">{quotaPercent}%</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">{quota.usedToday}</span>
            <span className="text-sm text-slate-400 font-mono">/ {quota.dailyLimit} 次调用</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                quotaPercent > 90
                  ? 'bg-rose-500'
                  : quotaPercent > 70
                  ? 'bg-amber-400'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(quotaPercent, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">剩余可用次数</span>
              <span className="font-mono text-emerald-600 font-bold">
                {quota.dailyLimit - quota.usedToday} 次
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">次日重置时间</span>
              <span className="font-mono text-slate-600 font-medium">00:00:00 UTC</span>
            </div>
          </div>
        </div>

        {/* Pacing Mode Strategy */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              配额调度策略 (Pacing Mode)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Token-Bucket 算法</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            避免非核心页在前半日耗尽 200 限制。系统自动为售罄缺货与紧急调价保留关键槽位。
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'SMART_PACED', label: '智能步调', desc: '按时段平滑 + 紧急优先' },
              { id: 'CONSERVATIVE', label: '保守防守', desc: '仅提交 CRITICAL 缺货' },
              { id: 'AGGRESSIVE', label: '即时抢跑', desc: '有任务立即全部发出' },
            ].map((mode) => (
              <button
                key={mode.id}
                id={`btn-pacing-${mode.id}`}
                onClick={() => onChangePacingMode(mode.id as any)}
                className={`p-2 rounded-lg text-left transition-all border ${
                  quota.pacingMode === mode.id
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="font-bold text-xs">{mode.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>当前策略已为突然售罄商品预留 25 个紧急名额</span>
          </div>
        </div>

        {/* Rate Limiting & Queue Health */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              分级缓冲池 (Queue)
            </span>
            <span className="font-mono text-xs text-blue-600 font-semibold">
              {quota.queuedCount} 条排队
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                CRITICAL (缺货/跳价)
              </span>
              <span className="font-mono text-slate-900 font-bold">即时推送 (0 延迟)</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                HIGH (新品上线)
              </span>
              <span className="font-mono text-slate-800">3 条待发</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                MEDIUM / LOW (常规巡检)
              </span>
              <span className="font-mono text-slate-500">11 条排队至夜间</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>分钟频率限制: 60 QPM</span>
            <span className="text-emerald-600 font-mono">当前 4 req/min (平稳)</span>
          </div>
        </div>
      </div>

      {/* Interactive URL Submitter & Inspector Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Form (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                发起实时 Indexing API 上报 (Go IPC 驱动)
              </h2>
              <p className="text-[11px] text-slate-500">
                调用 Go 后台 <code className="font-mono text-blue-600">app.SubmitIndexingUrl</code>，支持直接上报或检查状态。
              </p>
            </div>
            {/* Quick Presets */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>预设:</span>
              <button
                type="button"
                onClick={() => {
                  setInputUrl('https://store.example.com/products/audio/sony-wh1000xm5-black');
                  setNotificationType('URL_UPDATED');
                  setPriority('HIGH');
                }}
                className="hover:text-blue-600 underline"
              >
                耳机降价
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setInputUrl('https://store.example.com/products/laptops/apple-macbook-pro-16-m3max');
                  setNotificationType('URL_UPDATED');
                  setPriority('CRITICAL');
                }}
                className="hover:text-blue-600 underline"
              >
                MacBook缺货
              </button>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {/* Target URL */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                目标网页 URL (需与 Search Console 绑定的域名一致)
              </label>
              <div className="relative">
                <input
                  id="input-indexing-url"
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.globalchipmall.com/product/..."
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors placeholder-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Notification Type */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  通知动作类型 (Action Type)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-type-updated"
                    onClick={() => setNotificationType('URL_UPDATED')}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                      notificationType === 'URL_UPDATED'
                        ? 'bg-blue-50 text-blue-700 border-blue-400 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    URL_UPDATED
                    <span className="block text-[10px] opacity-75 font-normal">新增或内容变动</span>
                  </button>
                  <button
                    type="button"
                    id="btn-type-deleted"
                    onClick={() => setNotificationType('URL_DELETED')}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                      notificationType === 'URL_DELETED'
                        ? 'bg-rose-50 text-rose-700 border-rose-400 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    URL_DELETED
                    <span className="block text-[10px] opacity-75 font-normal">下架或 404 删除</span>
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  配额调度优先级 (Priority)
                </label>
                <select
                  id="select-indexing-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IndexingPriority)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="CRITICAL">CRITICAL - 突发缺货/重大价格变动 (即刻消耗配额)</option>
                  <option value="HIGH">HIGH - 新品详情页上架发布</option>
                  <option value="MEDIUM">MEDIUM - 站点地图日常同步发现</option>
                  <option value="LOW">LOW - 常规巡检重新爬取 (排队至空闲)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                id="btn-submit-indexing-now"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Go IPC 通信中...' : '提交推送通知 (URL Notification)'}</span>
              </button>

              <button
                type="button"
                id="btn-inspect-url-gsc"
                onClick={handleInspectUrl}
                disabled={isInspecting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 transition-colors shadow-xs"
              >
                <Search className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
                <span>URL 状态全面检查 (Inspect)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: URL Inspection Result (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-3 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                Google 实时收录与网页检查 (Inspection)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                GSC API
              </span>
            </div>

            {inspectionResult ? (
              <div className="space-y-2.5 pt-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 text-[10px]">检查目标</div>
                  <div className="font-mono text-blue-700 font-semibold truncate">
                    {inspectionResult.url}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">Google 收录裁定</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已在 Google 编入索引
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">移动设备易用性</span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      页面对移动设备友好
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] block">富媒体结果 (Rich Snippets)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectionResult.richResults.map((r: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200 font-mono"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
                  <span>最后抓取时间: {inspectionResult.lastCrawlTime}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Search className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p>在左侧输入任意 URL 并点击「URL 状态全面检查」</p>
                <p className="text-[11px] text-slate-500">
                  可快速诊断 Googlebot 爬取状态、规范网址 (Canonical) 及结构化数据支持情况
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              配额贴士：当商品短时间内多次变动，Wails 后台防抖机制会自动合并同一 URL 的 5 分钟内请求，仅消耗 1 次配额。
            </span>
          </div>
        </div>
      </div>

      {/* Submissions History Audit Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Indexing API 调用历史审计日志 ({submissions.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              记录每次推送的 HTTP 响应码、网络耗时、优先级和配额扣减情况。
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Filter */}
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 text-xs focus:outline-none"
            >
              <option value="ALL">全部状态</option>
              <option value="SUCCESS">成功 (200 OK)</option>
              <option value="RATE_LIMITED">触发限流 (429)</option>
              <option value="QUEUED">排队中 (Queued)</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                id="input-history-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 URL..."
                className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">记录 ID / 提交时间</th>
                <th className="py-2.5 px-3 font-semibold">目标 URL</th>
                <th className="py-2.5 px-3 font-semibold">动作类型</th>
                <th className="py-2.5 px-3 font-semibold">调度优先级</th>
                <th className="py-2.5 px-3 font-semibold">状态与 HTTP 返回码</th>
                <th className="py-2.5 px-3 font-semibold text-right">延迟 / 配额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-bold">{record.id}</div>
                      <div className="text-slate-400 text-[10px]">{record.submittedAt}</div>
                    </td>

                    <td className="py-3 px-3 max-w-md truncate text-slate-700" title={record.url}>
                      {record.url}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          record.type === 'URL_UPDATED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {record.type}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          record.priority === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                            : record.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {record.priority}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {record.status === 'SUCCESS' ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK (已广播)
                        </span>
                      ) : record.status === 'QUEUED' ? (
                        <span className="text-amber-600 flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> 排队缓冲中
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> 429 配额限流
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="text-slate-700">
                        {record.latencyMs > 0 ? `${record.latencyMs}ms` : '-'}
                      </div>
                      <div className="text-[10px] text-blue-600 font-bold">
                        -{record.quotaConsumed} Quota
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    未找到匹配的历史调用记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
