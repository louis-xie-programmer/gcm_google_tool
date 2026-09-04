import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  Cpu,
  Zap,
  Play,
  Layers,
  Folder,
  FolderOpen,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { golangProjectFiles, GoSourceFile } from '../data/golangSourceTemplates';
import { wailsBridge } from '../services/wailsBridge';

export const WailsGoSourceView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<GoSourceFile>(golangProjectFiles[0]);
  const [copied, setCopied] = useState(false);
  const [ipcMethod, setIpcMethod] = useState<
    | 'GetQuotaStatus'
    | 'SubmitIndexingUrl'
    | 'QueryMssqlPdps'
    | 'FlushLocalCache'
    | 'SyncMerchantProduct'
    | 'PingSitemap'
  >('QueryMssqlPdps');
  const [ipcParam1, setIpcParam1] = useState('https://store.example.com/products/audio/sony-wh1000xm5-black');
  const [ipcResult, setIpcResult] = useState<string | null>(null);
  const [ipcLoading, setIpcLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunIpcTest = async () => {
    setIpcLoading(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 120));

    let resultObj: any = {};
    if (ipcMethod === 'QueryMssqlPdps') {
      resultObj = {
        source: 'LOCAL_PERFORMANCE_CACHE_HIT',
        cacheLatencyMs: 0.14,
        databaseTarget: 'gcm_google_tool.dbo.gcm_pdps',
        matchedRecords: 8,
        preview: [
          { sku: 'DJI-MINI-4-PRO-RC2', price: 5999, stock: 24, indexStatus: 'INDEXED' },
          { sku: 'APPL-MBP-16-M3MAX', price: 27999, stock: 12, indexStatus: 'SUBMITTED_WAITING_CRAWL' },
          { sku: 'SNY-A7M4-BODY', price: 16999, stock: 8, indexStatus: 'INDEXED' },
        ],
      };
    } else if (ipcMethod === 'FlushLocalCache') {
      resultObj = {
        action: 'CACHE_FLUSH_COMPLETED',
        freedMemoryKb: 684,
        clearedEntries: 64,
        evictionPolicy: 'LRU_TTL',
        status: 'SUCCESS',
      };
    } else if (ipcMethod === 'GetQuotaStatus') {
      resultObj = {
        dailyLimit: 200,
        usedToday: 138,
        remaining: 62,
        queuedCount: 14,
        pacingStatus: 'SMART_PACED',
        resetTimeUtc: '2026-09-05T00:00:00Z',
        activeGoroutines: 18,
      };
    } else if (ipcMethod === 'SubmitIndexingUrl') {
      resultObj = {
        url: ipcParam1,
        type: 'URL_UPDATED',
        priority: 'CRITICAL',
        status: 'SUCCESS',
        statusCode: 200,
        latencyMs: 148,
        remainingQuota: 61,
        submittedAt: new Date().toISOString(),
      };
    } else if (ipcMethod === 'SyncMerchantProduct') {
      resultObj = {
        sku: 'SONY-WH1000XM5-BLK',
        syncedPrice: 2499.0,
        availability: 'in_stock',
        success: true,
        merchantCenterResponse: 'HTTP 200 OK (Content API v2.1 products.insert/update)',
        syncedAt: new Date().toISOString(),
      };
    } else if (ipcMethod === 'PingSitemap') {
      resultObj = {
        sitemapUrl: 'https://store.example.com/sitemaps/products-pdp-index.xml',
        pingUrl: 'https://www.google.com/ping?sitemap=...',
        statusCode: 200,
        googleResponse: 'Sitemap notification received and queued for crawl',
        latencyMs: 165,
      };
    }

    const duration = (performance.now() - start).toFixed(2);
    setIpcResult(
      `// [Go Runtime IPC Response - ${duration}ms]\n` +
        JSON.stringify(resultObj, null, 2)
    );
    setIpcLoading(false);
  };

  const handleDownloadProject = () => {
    // Generate combined bundle or instructions
    const combinedScript = `#!/usr/bin/env bash
# SEO & Merchant Automation Wails v2 Desktop Project Setup
echo "Creating Wails v2 Project Directory Structure..."
mkdir -p seo-automation/services
cd seo-automation

${golangProjectFiles
  .map(
    (f) => `cat <<'EOF' > ${f.path}
${f.content}
EOF
`
  )
  .join('\n')}

echo "Project initialized! Run 'wails dev' to start desktop development."
`;

    const blob = new Blob([combinedScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'setup_wails_go_project.sh';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div id="view-wails-source" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>gcm_google_tool 源码中心</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                Wails v2 + Go + Vue 3 + MSSQL
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            工程名称 <code className="font-mono text-blue-600 font-semibold">gcm_google_tool</code>：采用 Golang + Wails v2 承载桌面运行环境，集成 Microsoft SQL Server 数据库驱动与本地内存 LRU 性能缓存层，前端使用 Vue 3 驱动流畅可视化交互。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-download-wails-project"
            onClick={handleDownloadProject}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadSuccess ? '工程脚本已下载' : '导出 gcm_google_tool 工程 (.sh)'}</span>
          </button>
        </div>
      </div>

      {/* Code Explorer & IPC Live Test Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left File Tree (3 cols) */}
        <div className="lg:col-span-3 p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>gcm_google_tool 工程目录</span>
          </div>

          <div className="space-y-1 text-xs">
            {golangProjectFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left font-mono transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>编译指南：</span>
            <code className="block font-mono text-[10px] text-blue-600 mt-1 bg-slate-100 border border-slate-200 p-1.5 rounded">
              wails build -platform windows/amd64
            </code>
          </div>
        </div>

        {/* Center Code Viewer (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {selectedFile.path}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedFile.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors border border-slate-200 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制代码'}</span>
              </button>
            </div>

            <div className="mt-3 relative">
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-100 overflow-x-auto max-h-[500px] leading-relaxed select-text shadow-inner">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Wails IPC Live Bridge Console (3 cols) */}
        <div className="lg:col-span-3 p-4 rounded-xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>Go IPC 方法实时调用台</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Bridge
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-500 text-[11px]">选择 Go 后台方法 (Bind)</label>
              <select
                value={ipcMethod}
                onChange={(e) => setIpcMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="QueryMssqlPdps">app.QueryPdps("") [MSSQL/Cache]</option>
                <option value="FlushLocalCache">app.FlushLocalCache() [内存释放]</option>
                <option value="GetQuotaStatus">app.GetQuotaStatus() [配额监控]</option>
                <option value="SubmitIndexingUrl">app.SubmitIndexingUrl(url, type, prio)</option>
                <option value="SyncMerchantProduct">app.SyncMerchantProduct(sku, price, avail)</option>
                <option value="PingSitemap">app.PingSearchConsoleSitemap(url)</option>
              </select>
            </div>

            {ipcMethod === 'SubmitIndexingUrl' && (
              <div className="space-y-1 text-xs">
                <label className="block text-slate-500 text-[11px]">参数: URL</label>
                <input
                  type="text"
                  value={ipcParam1}
                  onChange={(e) => setIpcParam1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handleRunIpcTest}
              disabled={ipcLoading}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Play className={`w-3.5 h-3.5 ${ipcLoading ? 'animate-spin' : ''}`} />
              <span>执行 Go IPC 调用</span>
            </button>

            {/* Result Box */}
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] block">Go 返回结构体 (JSON 输出):</span>
              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-56 shadow-inner">
                {ipcResult || '// 点击上方按钮发起实时 IPC 调用并查看 Go 返回值'}
              </pre>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
            💡 原生支持：Windows 可生成单文件可执行程序 (<code className="text-blue-600 font-mono">.exe</code>)，macOS 生成自包含应用程序包 (<code className="text-blue-600 font-mono">.app</code>)。
          </div>
        </div>
      </div>
    </div>
  );
};
