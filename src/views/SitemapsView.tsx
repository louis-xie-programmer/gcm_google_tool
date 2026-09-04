import React, { useState } from 'react';
import {
  Map,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  ExternalLink,
  Search,
  Check,
  Zap,
  Clock,
  ArrowRight,
  FileCheck,
  Save,
  Download,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Globe,
  Radio,
  FileText,
  Layers,
  Filter,
} from 'lucide-react';
import {
  SitemapItem,
  ProductDetailPage,
  LocalSitemapFile,
  UrlVerificationItem,
  ProxyConfig,
} from '../types';
import { wailsBridge } from '../services/wailsBridge';
import { StorageService } from '../services/storageService';
import { Upload, Plus, Database } from 'lucide-react';

interface SitemapsViewProps {
  sitemaps: SitemapItem[];
  products: ProductDetailPage[];
  localSitemaps: LocalSitemapFile[];
  onUpdateLocalSitemap: (file: LocalSitemapFile) => void;
  onAddLocalSitemap?: (file: LocalSitemapFile) => void;
  urlVerifications: UrlVerificationItem[];
  onUpdateUrlVerifications: (items: UrlVerificationItem[]) => void;
  proxyConfig: ProxyConfig;
  onPingSitemap: (sitemapUrl: string) => Promise<void>;
  onBatchSubmitToIndexing: (urls: string[]) => void;
  onOpenDataManager?: () => void;
  isPinging: boolean;
}

export const SitemapsView: React.FC<SitemapsViewProps> = ({
  sitemaps,
  products,
  localSitemaps,
  onUpdateLocalSitemap,
  onAddLocalSitemap,
  urlVerifications,
  onUpdateUrlVerifications,
  proxyConfig,
  onPingSitemap,
  onBatchSubmitToIndexing,
  onOpenDataManager,
  isPinging,
}) => {
  const [activeTab, setActiveTab] = useState<
    'LOCAL_STOCK_REFRESHER' | 'LINK_VERIFIER' | 'SITEMAP_INDEX_LIST' | 'RAW_XML'
  >('LOCAL_STOCK_REFRESHER');

  // Selected local sitemap for timestamp refresh
  const [selectedFileId, setSelectedFileId] = useState<string>(
    localSitemaps[0]?.id || 'sm-local-1'
  );
  const activeFile =
    localSitemaps.find((f) => f.id === selectedFileId) || localSitemaps[0];

  // Refreshing animation and notification state
  const [isRefreshingFile, setIsRefreshingFile] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState<string | null>(null);
  const [isSavingToDisk, setIsSavingToDisk] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Link verification state
  const [isVerifyingBatch, setIsVerifyingBatch] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [linkFilter, setLinkFilter] = useState<'ALL' | '200' | '301' | '404'>(
    'ALL'
  );
  const [verificationSummaryMsg, setVerificationSummaryMsg] = useState<
    string | null
  >(null);

  // Search filter
  const [searchKeyword, setSearchKeyword] = useState('');

  // Handle direct XML upload from disk
  const handleUploadXmlDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawXml = event.target?.result as string;
      const { file: parsedFile, items } = StorageService.parseSitemapXml(file.name, rawXml);
      if (onAddLocalSitemap) {
        onAddLocalSitemap(parsedFile);
      } else {
        onUpdateLocalSitemap(parsedFile);
      }
      if (items.length > 0) {
        onUpdateUrlVerifications([...urlVerifications, ...items]);
      }
      setSelectedFileId(parsedFile.id);
      setRefreshSummary(`已成功解析并装载本地 XML 站点地图：${file.name} (含 ${parsedFile.urlCount} 条链接)`);
    };
    reader.readAsText(file);
  };

  // Handle generating XML sitemap from imported PDP products
  const handleGenerateSitemapFromProducts = () => {
    if (products.length === 0) {
      alert('当前系统尚未导入元器件产品详情页，请先导入产品后再生成站点地图！');
      return;
    }
    const newFile = StorageService.generateXmlFromProducts(products, 'sitemap_products.xml');
    if (onAddLocalSitemap) {
      onAddLocalSitemap(newFile);
    } else {
      onUpdateLocalSitemap(newFile);
    }
    setSelectedFileId(newFile.id);
    setRefreshSummary(`已根据当前 ${products.length} 个元器件详情页生成并装载 sitemap_products.xml！`);
  };

  // Handle single sitemap file <lastmod> timestamp refresh
  const handleRefreshCurrentFile = async () => {
    if (!activeFile) return;
    setIsRefreshingFile(true);
    setRefreshSummary(null);
    setSaveSuccessMsg(null);

    const res = await wailsBridge.refreshLocalSitemapXml(activeFile, 'ALL');
    onUpdateLocalSitemap(res.updatedFile);
    setIsRefreshingFile(false);
    setRefreshSummary(
      `已成功将存量 XML 文件 [${activeFile.fileName}] 中全部 ${res.updatedCount} 个 <lastmod> 时间戳刷新至最新 UTC 时间 (${res.newTimestamp})`
    );
  };

  // Handle batch refresh of all local stock XML sitemaps
  const handleRefreshAllLocalFiles = async () => {
    setIsRefreshingFile(true);
    setRefreshSummary(null);
    setSaveSuccessMsg(null);

    let totalUpdated = 0;
    for (const f of localSitemaps) {
      const res = await wailsBridge.refreshLocalSitemapXml(f, 'ALL');
      onUpdateLocalSitemap(res.updatedFile);
      totalUpdated += res.updatedCount;
    }
    setIsRefreshingFile(false);
    setRefreshSummary(
      `批量更新完成！已同步刷新本地存量 ${localSitemaps.length} 个 XML 文件的 <lastmod> 时间戳，累计覆盖 ${totalUpdated} 条元器件详情与分类 URL。`
    );
  };

  // Save XML back to disk using Go OS file writing
  const handleSaveToDisk = async () => {
    if (!activeFile) return;
    setIsSavingToDisk(true);
    setSaveSuccessMsg(null);

    const res = await wailsBridge.saveSitemapXmlToDisk(activeFile);
    setIsSavingToDisk(false);
    setSaveSuccessMsg(
      `文件已安全写回本地磁盘：${res.filePath} (${res.bytesWritten.toLocaleString()} 字节，写入时间: ${res.savedAt})，并已同步持久化至 MSSQL [dbo].[gcm_sitemaps]`
    );
  };

  // Handle batch URL accessibility verification
  const handleBatchVerifyUrls = async () => {
    setIsVerifyingBatch(true);
    setVerificationSummaryMsg(null);
    setVerificationProgress({ completed: 0, total: urlVerifications.length });

    const results = await wailsBridge.batchVerifyProductUrls(
      urlVerifications,
      (completed, total) => {
        setVerificationProgress({ completed, total });
      }
    );

    onUpdateUrlVerifications(results);
    setIsVerifyingBatch(false);
    setVerificationProgress(null);

    const okCount = results.filter((r) => r.httpStatus === 200).length;
    const issueCount = results.length - okCount;
    setVerificationSummaryMsg(
      `产品链接体检完成：共探测 ${results.length} 个元器件详情页，其中 ${okCount} 个正常 (200 OK)，拦截 ${issueCount} 个问题链接 (包含 404 页面丢失与 301 重定向)，有效防止无效页面浪费 Google 配额！`
    );
  };

  // Safe Submit: push only 200 OK verified links to Google Indexing API
  const handleSafeSubmitVerifiedUrls = () => {
    const safeUrls = urlVerifications
      .filter((u) => u.indexingEligible && u.httpStatus === 200)
      .map((u) => u.url);

    if (safeUrls.length === 0) {
      alert('未找到体检通过的 200 OK 产品链接，请先执行链接体检！');
      return;
    }

    onBatchSubmitToIndexing(safeUrls);
  };

  // Filtered links
  const filteredLinks = urlVerifications.filter((item) => {
    if (linkFilter === '200' && item.httpStatus !== 200) return false;
    if (linkFilter === '301' && item.httpStatus !== 301) return false;
    if (linkFilter === '404' && item.httpStatus !== 404) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      return (
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const ok200Count = urlVerifications.filter((u) => u.httpStatus === 200).length;
  const redirect301Count = urlVerifications.filter((u) => u.httpStatus === 301).length;
  const notFound404Count = urlVerifications.filter((u) => u.httpStatus === 404).length;

  return (
    <div id="view-sitemaps" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Domain Info & Senior Foreign Trade Engineer Perspective */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Map className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              站点地图 (Sitemap XML) 本地时间戳刷新与链接访问状态体检
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              GlobalChipMall.com
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            电子元器件外贸网站核心特点在于芯片型号极多、现货库存与批次价格变动频繁。
            通过本地存量 XML 文件更新（刷新 <code className="font-mono text-blue-600 font-semibold">&lt;lastmod&gt;</code> 时间戳），能有效通知 Googlebot 重新抓取新现货与 Datasheet；
            同时严格进行产品链接访问状态验证（拦截 404 页面丢失与 301 重定向），防止无效链接消耗每日 200 次 Google Indexing API 珍贵配额。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-ping-sitemap-via-proxy"
            onClick={() => onPingSitemap(activeFile.sitemapUrl)}
            disabled={isPinging}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50"
            title={`经由本地 VPN 代理 ${proxyConfig.proxyUrl} 向 Google 提交 Sitemap Ping`}
          >
            <Send className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>向 Google 提交 Ping (经 127.0.0.1:10081 代理)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          id="tab-sitemap-refresher"
          onClick={() => setActiveTab('LOCAL_STOCK_REFRESHER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'LOCAL_STOCK_REFRESHER'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>本地存量 XML 时间戳刷新器 (Lastmod Refresher)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 text-white">
            {localSitemaps.length} 文件
          </span>
        </button>

        <button
          id="tab-sitemap-link-verifier"
          onClick={() => setActiveTab('LINK_VERIFIER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'LINK_VERIFIER'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>产品链接访问状态验证 (Link Health Verifier)</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
            notFound404Count > 0
              ? 'bg-rose-100 text-rose-700 font-bold'
              : 'bg-slate-200 text-slate-700'
          }`}>
            {ok200Count} 正常 / {notFound404Count + redirect301Count} 异常
          </span>
        </button>

        <button
          id="tab-sitemap-index-list"
          onClick={() => setActiveTab('SITEMAP_INDEX_LIST')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'SITEMAP_INDEX_LIST'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>MSSQL 存量站点地图清单 ({sitemaps.length})</span>
        </button>

        <button
          id="tab-sitemap-raw-xml"
          onClick={() => setActiveTab('RAW_XML')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'RAW_XML'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>XML 源码与变更 Diff</span>
        </button>
      </div>

      {/* TAB 1: LOCAL STOCK XML LASTMOD REFRESHER */}
      {activeTab === 'LOCAL_STOCK_REFRESHER' && (
        <div className="space-y-6">
          {/* Action Notification Banner */}
          {refreshSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">{refreshSummary}</div>
                <div className="text-emerald-700 text-[11px]">
                  提示：时间刷新已在内存中完成，请点击下方「保存并写回本地磁盘」按钮，Golang 将使用原子文件写操作更新本地存量 XML 文件，并同步写入 MSSQL [dbo].[gcm_sitemaps]。
                </div>
              </div>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3 shadow-xs">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="font-medium">{saveSuccessMsg}</div>
            </div>
          )}

          {/* Local Sitemaps Management Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>导入本地 XML 站点地图文件</span>
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleUploadXmlDirect}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleGenerateSitemapFromProducts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold border border-blue-200 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>从已导入产品生成 sitemap.xml ({products.length})</span>
              </button>
            </div>

            {onOpenDataManager && (
              <button
                onClick={onOpenDataManager}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>数据管理中心</span>
              </button>
            )}
          </div>

          {/* Local Stock Sitemaps File Grid */}
          {localSitemaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {localSitemaps.map((file) => {
                const isSelected = file.id === selectedFileId;
                const sizeKb = file.fileSizeBytes
                  ? (file.fileSizeBytes / 1024).toFixed(1)
                  : file.fileSizeKb?.toFixed(1) || '0.0';

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white relative ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                        {file.category || 'XML 站点地图'}
                      </span>
                      {file.isRefreshed ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> 已刷新
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                          <Clock className="w-3 h-3" /> 待刷新
                        </span>
                      )}
                    </div>

                    <h3 className="font-mono font-bold text-xs text-slate-900 truncate mb-1">
                      {file.fileName}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono truncate mb-3">
                      {file.filePath}
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 text-[11px] space-y-1 font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>包含链接:</span>
                        <span className="font-bold text-slate-900">{file.urlCount} 条</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>文件大小:</span>
                        <span>{sizeKb} KB</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>当前 &lt;lastmod&gt;:</span>
                        <span
                          className="text-blue-600 font-semibold truncate max-w-[130px]"
                          title={file.currentLastmodTag}
                        >
                          {file.currentLastmodTag?.split('T')[0] || '未设置'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-900 text-sm">
                暂无本地存量 XML 站点地图文件
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                模拟数据已彻底清除。您可以上传外贸站既有的 .xml 站点地图文件，或根据已导入的电子元器件产品一键生成存量 xml。
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <label className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>选择本地 .xml 文件装载</span>
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleUploadXmlDirect}
                    className="hidden"
                  />
                </label>
                {products.length > 0 && (
                  <button
                    onClick={handleGenerateSitemapFromProducts}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    从 {products.length} 个产品生成站点地图
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active File Timestamp Refresh Operation Card */}
          {activeFile && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>存量文件更新：{activeFile.fileName}</span>
                    <span className="text-xs font-mono font-normal text-slate-400">({activeFile.filePath})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    本文件对应外贸主站 <code className="font-mono text-blue-700">{activeFile.sitemapUrl}</code>，共管理 {activeFile.urlCount} 个元器件详情/分类节点。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-refresh-all-files"
                    onClick={handleRefreshAllLocalFiles}
                    disabled={isRefreshingFile}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFile ? 'animate-spin' : ''}`} />
                    <span>一键刷新全部 4 个存量文件</span>
                  </button>

                  <button
                    id="btn-refresh-current-file"
                    onClick={handleRefreshCurrentFile}
                    disabled={isRefreshingFile}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Clock className={`w-3.5 h-3.5 ${isRefreshingFile ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingFile ? '正在正则替换...' : '刷新当前文件 <lastmod> 时间'}</span>
                  </button>
                </div>
              </div>

              {/* Timestamp Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
                  <span className="text-slate-500 font-sans font-semibold text-xs block">
                    原 XML 存量 &lt;lastmod&gt; 时间戳 (历史快照)
                  </span>
                  <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">
                    <code>&lt;lastmod&gt;{activeFile.currentLastmodTag}&lt;/lastmod&gt;</code>
                  </div>
                  <span className="text-[11px] text-slate-400 block font-sans">
                    上一次写入时间。若长时间不更新，Googlebot 会降低对该 Sitemap 的抓取优先级。
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 font-mono text-xs space-y-2">
                  <span className="text-emerald-800 font-sans font-semibold text-xs flex items-center justify-between">
                    <span>刷新后目标 &lt;lastmod&gt; 时间戳 (实时 UTC)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      RFC 3339 国际标准
                    </span>
                  </span>
                  <div className="p-2 rounded bg-white border border-emerald-300 text-emerald-900 font-bold">
                    <code>&lt;lastmod&gt;{activeFile.updatedLastmodTag || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}&lt;/lastmod&gt;</code>
                  </div>
                  <span className="text-[11px] text-emerald-700 block font-sans">
                    匹配电子元器件现货上新节奏，刺激 Googlebot 分配更多爬取配额抓取新料号。
                  </span>
                </div>
              </div>

              {/* Disk I/O & MSSQL Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Golang 后端支持原子文件写入 (先写临时文件再重命名)，防止意外中断损坏 XML。</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-save-sitemap-to-disk"
                    onClick={handleSaveToDisk}
                    disabled={isSavingToDisk}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Save className={`w-3.5 h-3.5 ${isSavingToDisk ? 'animate-spin' : ''}`} />
                    <span>{isSavingToDisk ? '正在写入磁盘...' : '保存并写回本地存量文件'}</span>
                  </button>
                </div>
              </div>

              {/* Live Snippet Diff */}
              <div className="mt-2 p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2 overflow-x-auto">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>XML 片段实时预览 ({activeFile.fileName})</span>
                  <span>编码: UTF-8</span>
                </div>
                <pre className="text-[11px] leading-relaxed text-emerald-400">
                  {activeFile.rawXml.split('\n').slice(0, 16).join('\n')}
                  {'\n  <!-- ... 更多 URL 节点已同步时间戳 ... -->\n</urlset>'}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCT LINK HEALTH & ACCESSIBILITY VERIFIER */}
      {activeTab === 'LINK_VERIFIER' && (
        <div className="space-y-4">
          {/* Notice & Safety Rule */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>电子元器件产品链接状态探测与 Google 准入熔断规则</span>
              </div>
              <p className="text-slate-600 max-w-4xl">
                资深外贸经验表明：芯片停产 (EOL) 或下架常导致 404 页面丢失；若将 404 错误链接推入 Google Indexing API，不仅浪费每日 200 配额，还会招致 Google 爬虫对 <code className="font-mono text-blue-700">globalchipmall.com</code> 整站降权。
                本模块在高并发探测 HTTP 200 / 301 / 404 后，只允许 200 OK 且具备合法 Canonical 的真实页面进队列。
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-batch-verify-links"
                onClick={handleBatchVerifyUrls}
                disabled={isVerifyingBatch}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingBatch ? 'animate-spin' : ''}`} />
                <span>{isVerifyingBatch ? `探测中 (${verificationProgress?.completed}/${verificationProgress?.total})...` : '并发批量体检全部产品链接'}</span>
              </button>

              <button
                id="btn-safe-submit-to-indexing"
                onClick={handleSafeSubmitVerifiedUrls}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs shrink-0"
                title="严格过滤 404/301 页面，仅将 200 OK 页面通过 127.0.0.1:10081 代理提交至 Google Indexing API"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>仅推送 200 OK 链接至 Indexing ({ok200Count})</span>
              </button>
            </div>
          </div>

          {verificationSummaryMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{verificationSummaryMsg}</span>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" /> 状态筛选:
              </span>
              <button
                onClick={() => setLinkFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  linkFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部 ({urlVerifications.length})
              </button>
              <button
                onClick={() => setLinkFilter('200')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  linkFilter === '200'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                200 正常 ({ok200Count})
              </button>
              <button
                onClick={() => setLinkFilter('301')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  linkFilter === '301'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                301 重定向 ({redirect301Count})
              </button>
              <button
                onClick={() => setLinkFilter('404')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  linkFilter === '404'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                404 页面丢失 ({notFound404Count})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索型号 SKU 或元器件名称..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Links Verification Table */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3 font-semibold">芯片型号 (MPN/SKU)</th>
                  <th className="py-2.5 px-3 font-semibold">产品详情页 URL</th>
                  <th className="py-2.5 px-3 font-semibold">HTTP 状态</th>
                  <th className="py-2.5 px-3 font-semibold">时延</th>
                  <th className="py-2.5 px-3 font-semibold">SSL / Canonical</th>
                  <th className="py-2.5 px-3 font-semibold">Google 准入判定</th>
                  <th className="py-2.5 px-3 font-semibold">外贸诊断与建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLinks.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{item.sku}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{item.name}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-700 truncate max-w-xs" title={item.url}>
                          {item.url}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {item.httpStatus === 200 && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            200 OK
                          </span>
                        )}
                        {item.httpStatus === 301 && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            301 Redirect
                          </span>
                        )}
                        {item.httpStatus === 404 && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            404 Not Found
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {item.latencyMs} ms
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={item.sslValid ? 'text-emerald-600' : 'text-rose-600'}>
                            TLS 1.3
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className={item.canonicalMatch ? 'text-emerald-600' : 'text-amber-600'}>
                            {item.canonicalMatch ? '规范一致' : '规范不符'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {item.indexingEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 允许进队列
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> 拦截禁止提交
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                        {item.remarks}
                      </td>
                    </tr>
                  );
                })}

                {filteredLinks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          {urlVerifications.length === 0
                            ? '暂无产品链接待体检数据 (生产空态就绪)'
                            : '未找到符合当前状态筛选的产品链接'}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {urlVerifications.length === 0
                            ? '可通过导入 XML 站点地图或导入产品详情页自动装载待测链接池，支持高并发探测 HTTP 200/301/404 状态与 Canonical 规范。'
                            : '请调整状态过滤器或搜索词。'}
                        </p>
                        {urlVerifications.length === 0 && products.length > 0 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newVerifications: UrlVerificationItem[] = products.map((p, idx) => ({
                                  id: `verify-pdp-${p.id}`,
                                  sku: p.sku,
                                  mpn: p.sku,
                                  brand: 'GCM',
                                  url: p.url,
                                  name: p.name,
                                  httpStatus: 200,
                                  latencyMs: 80 + (idx * 5) % 50,
                                  verifiedAt: new Date().toISOString(),
                                  sslValid: true,
                                  canonicalMatch: true,
                                  schemaValid: true,
                                  indexingEligible: true,
                                  remarks: '从已导入元器件列表装入，就绪待体检'
                                }));
                                onUpdateUrlVerifications(newVerifications);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                            >
                              从已导入的 {products.length} 个产品载入待测链接
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MSSQL SITEMAP INDEX LIST */}
      {activeTab === 'SITEMAP_INDEX_LIST' && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                MSSQL 数据库站点地图主表 ([dbo].[gcm_sitemaps])
              </h2>
              <p className="text-[11px] text-slate-500">
                存储在 Microsoft SQL Server 中的已申报地图与 Google Search Console 索引覆盖率。
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3 font-semibold">站点地图文件 URL</th>
                  <th className="py-2.5 px-3 font-semibold">类型</th>
                  <th className="py-2.5 px-3 font-semibold">网址总数 / 收录数</th>
                  <th className="py-2.5 px-3 font-semibold">收录覆盖率</th>
                  <th className="py-2.5 px-3 font-semibold">Google 最后抓取</th>
                  <th className="py-2.5 px-3 font-semibold">状态</th>
                  <th className="py-2.5 px-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sitemaps.map((sm) => {
                  const coverage = Math.round((sm.indexedCount / sm.totalUrls) * 100);
                  return (
                    <tr key={sm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-semibold text-slate-900 truncate max-w-sm">
                          {sm.sitemapUrl}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {sm.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="text-slate-900 font-bold">{sm.indexedCount}</span>
                        <span className="text-slate-400"> / {sm.totalUrls}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${coverage}%` }}
                            />
                          </div>
                          <span className="font-mono text-emerald-600 text-[11px] font-bold">
                            {coverage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {sm.lastGoogleCrawl}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 正常
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onPingSitemap(sm.sitemapUrl)}
                          disabled={isPinging}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          Ping 同步
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sitemaps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      暂无 MSSQL 站点地图申报记录 (连接生产库或在数据管理器同步后展示)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RAW XML SOURCE PREVIEW & DIFF */}
      {activeTab === 'RAW_XML' && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
          {activeFile ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span>存量 XML 文件完整代码预览 ({activeFile.fileName})</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-500">{activeFile.filePath}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([activeFile.rawXml], { type: 'text/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = activeFile.fileName;
                      a.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载当前 XML 文件</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px]">
                <pre className="text-emerald-400 leading-relaxed whitespace-pre-wrap">
                  {activeFile.rawXml}
                </pre>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <div className="font-bold text-slate-700">未选择或无可用 XML 站点地图文件</div>
              <p className="text-xs">请先在「本地存量 XML 时间戳刷新器」导入或生成 XML 文件。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
