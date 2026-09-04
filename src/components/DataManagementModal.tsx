import React, { useState } from 'react';
import {
  Database,
  Upload,
  FileText,
  FileCode,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ProductDetailPage,
  LocalSitemapFile,
  UrlVerificationItem,
  MssqlConnectionConfig,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  sampleProducts,
  sampleMerchantProducts,
  sampleSitemaps,
  sampleRankings,
  sampleUrlVerifications,
  sampleLocalSitemapFiles,
} from '../data/sampleDataset';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  productsCount: number;
  sitemapsCount: number;
  mssqlConfig: MssqlConnectionConfig;
  onImportProducts: (newProducts: ProductDetailPage[], mode: 'APPEND' | 'REPLACE') => void;
  onImportSitemapXml: (file: LocalSitemapFile, items: UrlVerificationItem[]) => void;
  onFetchFromMssql: () => Promise<void>;
  onClearAllData: () => void;
  onLoadSampleData: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
  isFetchingMssql: boolean;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  productsCount,
  sitemapsCount,
  mssqlConfig,
  onImportProducts,
  onImportSitemapXml,
  onFetchFromMssql,
  onClearAllData,
  onLoadSampleData,
  onExportBackup,
  onRestoreBackup,
  isFetchingMssql,
}) => {
  const [activeTab, setActiveTab] = useState<'import_products' | 'import_sitemap' | 'mssql' | 'clear_reset'>(
    'import_products'
  );

  // Products import state
  const [productImportText, setProductImportText] = useState('');
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [parsedPreview, setParsedPreview] = useState<ProductDetailPage[]>([]);

  // Sitemap import state
  const [sitemapFileName, setSitemapFileName] = useState('sitemap_products.xml');
  const [sitemapXmlText, setSitemapXmlText] = useState('');
  const [sitemapParseSummary, setSitemapParseSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle parsing products preview
  const handlePreviewProducts = (text: string) => {
    setProductImportText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }
    const items = StorageService.parseProductImportText(text);
    setParsedPreview(items);
  };

  const handleFileUploadProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handlePreviewProducts(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImportProducts = () => {
    if (parsedPreview.length === 0) return;
    onImportProducts(parsedPreview, importMode);
    setProductImportText('');
    setParsedPreview([]);
    onClose();
  };

  // Handle XML sitemap upload
  const handleFileUploadSitemap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSitemapFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSitemapXmlText(content);
      try {
        const { file: parsedFile, items } = StorageService.parseSitemapXml(file.name, content);
        setSitemapParseSummary(`解析成功：找到 ${parsedFile.urlCount} 个 <url> 节点，提取 ${items.length} 个待体检链接`);
      } catch (err) {
        setSitemapParseSummary('XML 解析失败，请确认文件格式有效');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImportSitemap = () => {
    if (!sitemapXmlText.trim()) return;
    try {
      const { file, items } = StorageService.parseSitemapXml(sitemapFileName, sitemapXmlText);
      onImportSitemapXml(file, items);
      setSitemapXmlText('');
      setSitemapParseSummary(null);
      onClose();
    } catch (e) {
      alert('无法解析 XML 站点地图，请检查标签完整性');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">数据源管理与生产数据就绪</h2>
              <p className="text-xs text-slate-500">
                当前系统已装载产品: <span className="font-bold text-blue-600">{productsCount}</span> 条 | 站点地图: <span className="font-bold text-blue-600">{sitemapsCount}</span> 个
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-2 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('import_products')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import_products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>批量导入产品 (CSV/URL)</span>
          </button>

          <button
            onClick={() => setActiveTab('import_sitemap')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import_sitemap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>导入本地 XML 站点地图</span>
          </button>

          <button
            onClick={() => setActiveTab('mssql')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'mssql'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>从 MSSQL 数据库拉取</span>
          </button>

          <button
            onClick={() => setActiveTab('clear_reset')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'clear_reset'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>清空 / 重置 / 备份</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: Import Products */}
          {activeTab === 'import_products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">批量导入 GlobalChipMall 元器件产品 PDP</h3>
                  <p className="text-slate-500 text-[11px]">
                    支持直接粘贴产品 URL 清单、CSV（逗号分隔）或 TSV（制表符分隔），系统将自动解析 SKU 并构建 PDP 对象。
                  </p>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer border border-blue-200 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传 .csv / .txt 文件</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.json"
                    onChange={handleFileUploadProducts}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <textarea
                  value={productImportText}
                  onChange={(e) => handlePreviewProducts(e.target.value)}
                  placeholder={`示例 1: 纯 URL 列表\nhttps://www.globalchipmall.com/product/STM32F407VGT6.html\nhttps://www.globalchipmall.com/product/TPS5430DDAR.html\n\n示例 2: CSV 格式 (SKU,名称,URL,分类,美元价格,库存)\nSTM32F407VGT6,ST 32-bit ARM MCU,https://www.globalchipmall.com/product/STM32F407VGT6.html,嵌入式MCU,6.45,12500`}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Quick Template Fill Button */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>快速填充测试样例:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sampleTxt = `STM32F407VGT6,STMicroelectronics 32-bit ARM Cortex-M4 MCU LQFP-100,https://www.globalchipmall.com/product/STM32F407VGT6.html,嵌入式微控制器,6.45,12500\nTMS320F28335PGFA,Texas Instruments C2000 32-Bit Real-Time DSC LQFP-176,https://www.globalchipmall.com/product/TMS320F28335PGFA.html,数字信号处理器,18.80,4600\nW25Q128JVSIM,Winbond 128Mb SPI NOR Flash SOIC-8,https://www.globalchipmall.com/product/W25Q128JVSIM.html,存储器芯片,0.88,85000`;
                    handlePreviewProducts(sampleTxt);
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  填入 3 条元器件外贸实盘数据
                </button>
              </div>

              {/* Preview Table */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 border border-blue-200 rounded-xl bg-blue-50/40 p-3">
                  <div className="flex items-center justify-between font-semibold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      已就绪待导入产品: {parsedPreview.length} 条
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] flex items-center gap-1 text-slate-700">
                        <input
                          type="radio"
                          name="import_mode"
                          checked={importMode === 'APPEND'}
                          onChange={() => setImportMode('APPEND')}
                        />
                        追加到现有列表
                      </label>
                      <label className="text-[11px] flex items-center gap-1 text-slate-700">
                        <input
                          type="radio"
                          name="import_mode"
                          checked={importMode === 'REPLACE'}
                          onChange={() => setImportMode('REPLACE')}
                        />
                        覆盖当前所有产品
                      </label>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-2">型号 (SKU)</th>
                          <th className="py-1.5 px-2">产品名称</th>
                          <th className="py-1.5 px-2">单价 (USD)</th>
                          <th className="py-1.5 px-2">库存</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {parsedPreview.slice(0, 10).map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 font-bold text-blue-600">{p.sku}</td>
                            <td className="py-1 px-2 truncate max-w-xs">{p.name}</td>
                            <td className="py-1 px-2">${p.price.toFixed(2)}</td>
                            <td className="py-1 px-2">{p.stockCount.toLocaleString()} PCS</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleConfirmImportProducts}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>确认导入 {parsedPreview.length} 个产品</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Import Local Sitemap XML */}
          {activeTab === 'import_sitemap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">上传并解析本地存量 XML 站点地图</h3>
                  <p className="text-slate-500 text-[11px]">
                    导入外贸站现有站点地图（例如 sitemap_products_mcu.xml），系统将解析全部 URL 并自动装载入时间戳刷新器与链接体检队列。
                  </p>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer border border-emerald-200 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>选择本地 .xml 文件</span>
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleFileUploadSitemap}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  站点地图文件名 (将生成于 /var/www/globalchipmall/sitemaps/ 路径):
                </label>
                <input
                  type="text"
                  value={sitemapFileName}
                  onChange={(e) => setSitemapFileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  XML 文件内容 (或直接从剪贴板粘贴 XML 代码):
                </label>
                <textarea
                  value={sitemapXmlText}
                  onChange={(e) => setSitemapXmlText(e.target.value)}
                  placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://www.globalchipmall.com/product/STM32F407VGT6.html</loc>\n    <lastmod>2026-08-20T10:00:00Z</lastmod>\n  </url>\n</urlset>`}
                  rows={7}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              {sitemapParseSummary && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center justify-between">
                  <span>{sitemapParseSummary}</span>
                  <button
                    onClick={handleConfirmImportSitemap}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    确认装载该站点地图
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Fetch from MSSQL */}
          {activeTab === 'mssql' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  从 Microsoft SQL Server 生产数据库灌装数据
                </h3>
                <p className="text-slate-500 text-[11px]">
                  直接连接目标库 <code className="font-mono text-blue-600">{mssqlConfig.host}:{mssqlConfig.port} / {mssqlConfig.database}</code>，读取 <code className="font-mono text-blue-600">dbo.gcm_pdps</code>、<code className="font-mono text-blue-600">dbo.gcm_sitemaps</code> 及 <code className="font-mono text-blue-600">dbo.gcm_configs</code>。
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">服务器状态</span>
                    <span className="font-bold text-emerald-600">{mssqlConfig.connectionStatus}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">延迟 (Ping)</span>
                    <span className="font-bold text-blue-600">{mssqlConfig.lastPingLatencyMs}ms</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">连接用户</span>
                    <span className="font-bold text-slate-800">{mssqlConfig.user}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200">
                    <span className="text-slate-400 text-[10px] block font-sans">目标数据库</span>
                    <span className="font-bold text-slate-800">{mssqlConfig.database}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <div>
                  <div className="font-bold text-blue-900">执行 MSSQL 生产库拉取与装配</div>
                  <div className="text-[11px] text-blue-700">将数据库中的真实料号、库存量、实盘价格与 Google 抓取历史灌入系统</div>
                </div>
                <button
                  onClick={async () => {
                    await onFetchFromMssql();
                    onClose();
                  }}
                  disabled={isFetchingMssql}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isFetchingMssql ? 'animate-spin' : ''}`} />
                  <span>{isFetchingMssql ? '正在从 MSSQL 拉取中...' : '立即从 MSSQL 拉取数据'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Clear, Reset, Backup */}
          {activeTab === 'clear_reset' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>彻底清空所有业务与模拟数据 (Clean Slate)</span>
                </div>
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  一键清空系统内的所有产品 PDP 列表、商家中心 Feed、站点地图记录、排名监控关键词、今日 Indexing API 上报历史与系统日志，将配额恢复为纯净的 200/200 次可用初始态。
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('确定要清空全部数据并重置为纯净生产空态吗？')) {
                        onClearAllData();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>执行清空：重置为纯净生产空态</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>载入 GlobalChipMall 标准测试模板数据集</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  若需演示或测试功能，可一键装载包括 STM32F407、TMS320F28335、NOR Flash、PMIC 等元器件外贸真实场景的基准演示数据。
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSampleData();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>载入 GlobalChipMall 标准样本集</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">系统完整数据备份与还原</div>
                    <div className="text-[11px] text-slate-500">导出包含配置、凭据与所有料号的 JSON 备份快照文件</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onExportBackup}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>导出系统备份 (.json)</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 transition-colors shadow-xs cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>恢复备份</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onRestoreBackup(file);
                            onClose();
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};
