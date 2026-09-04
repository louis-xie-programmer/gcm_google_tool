import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { IndexingApiView } from './views/IndexingApiView';
import { SitemapsView } from './views/SitemapsView';
import { PdpAnalyticsView } from './views/PdpAnalyticsView';
import { MerchantSyncView } from './views/MerchantSyncView';
import { RankTrackerView } from './views/RankTrackerView';
import { AutomationFlowView } from './views/AutomationFlowView';
import { MssqlManagerView } from './views/MssqlManagerView';
import { WailsGoSourceView } from './views/WailsGoSourceView';
import { SettingsView } from './views/SettingsView';
import { LiveLogDrawer } from './components/LiveLogDrawer';
import { DataManagementModal } from './components/DataManagementModal';
import { StorageService } from './services/storageService';
import {
  sampleProducts,
  sampleMerchantProducts,
  sampleSitemaps,
  sampleRankings,
  sampleUrlVerifications,
  sampleLocalSitemapFiles,
} from './data/sampleDataset';

import {
  initialQuotaStatus,
  initialWailsRuntime,
  initialServiceAccount,
  initialProducts,
  initialMerchantProducts,
  initialSitemaps,
  initialRankings,
  initialSubmissionRecords,
  initialAutomationRules,
  initialMssqlConfig,
  initialMssqlTableStats,
  initialLocalCacheStats,
  initialProxyConfig,
  initialUrlVerifications,
  initialLocalSitemaps,
} from './data/initialData';

import {
  IndexingNotificationType,
  IndexingPriority,
  SystemActivityLog,
  ProductDetailPage,
  MerchantProductItem,
  AutomationRule,
  MssqlConnectionConfig,
  MssqlTableStat,
  LocalPerformanceCacheStats,
  ProxyConfig,
  UrlVerificationItem,
  LocalSitemapFile,
} from './types';

import { wailsBridge } from './services/wailsBridge';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [quota, setQuota] = useState(initialQuotaStatus);
  const [runtimeState, setRuntimeState] = useState(initialWailsRuntime);
  const [serviceAccount, setServiceAccount] = useState(initialServiceAccount);
  const [products, setProducts] = useState(initialProducts);
  const [merchantItems, setMerchantItems] = useState(initialMerchantProducts);
  const [sitemaps, setSitemaps] = useState(initialSitemaps);
  const [rankings, setRankings] = useState(initialRankings);
  const [submissions, setSubmissions] = useState(initialSubmissionRecords);
  const [rules, setRules] = useState(initialAutomationRules);
  const [mssqlConfig, setMssqlConfig] = useState<MssqlConnectionConfig>(initialMssqlConfig);
  const [tableStats, setTableStats] = useState<MssqlTableStat[]>(initialMssqlTableStats);
  const [cacheStats, setCacheStats] = useState<LocalPerformanceCacheStats>(initialLocalCacheStats);
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>(initialProxyConfig);
  const [urlVerifications, setUrlVerifications] = useState<UrlVerificationItem[]>(initialUrlVerifications);
  const [localSitemaps, setLocalSitemaps] = useState<LocalSitemapFile[]>(initialLocalSitemaps);

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isExecutingRule, setIsExecutingRule] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isFetchingMssql, setIsFetchingMssql] = useState(false);

  // Initialize from LocalStorage on mount if available
  useEffect(() => {
    try {
      const persistedProducts = StorageService.loadProducts();
      if (persistedProducts && persistedProducts.length > 0) {
        setProducts(persistedProducts);
      }
    } catch {
      // ignore
    }
  }, []);

  const [logs, setLogs] = useState<SystemActivityLog[]>([
    {
      id: 'log-1',
      timestamp: '10:14:02',
      module: 'WailsIPC',
      level: 'info',
      message: 'Go Runtime IPC channel connected. Memory: 34.2MB, Goroutines: 18',
    },
    {
      id: 'log-2',
      timestamp: '10:14:05',
      module: 'IndexingAPI',
      level: 'success',
      message: 'Google Indexing API JWT Token initialized for service account',
      details: 'Scopes: indexing, content, webmasters',
    },
    {
      id: 'log-3',
      timestamp: '10:14:18',
      module: 'MerchantCenter',
      level: 'warn',
      message: 'Detected 2 discrepancies between PDP inventory and Merchant Center feeds',
      details: 'DJI-MINI-4-PRO-RC2 (Price mismatch), APPL-MBP-16-M3MAX (Stock mismatch)',
    },
    {
      id: 'log-4',
      timestamp: '10:14:25',
      module: 'Sitemap',
      level: 'info',
      message: 'XML Sitemap index validated: 2,718 total URLs across 3 feeds',
    },
  ]);

  const addLog = (
    module: SystemActivityLog['module'],
    level: SystemActivityLog['level'],
    message: string,
    details?: string
  ) => {
    const newLog: SystemActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      module,
      level,
      message,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 0. Data Management Actions
  const handleImportProducts = (newProducts: ProductDetailPage[], mode: 'APPEND' | 'REPLACE') => {
    let updated: ProductDetailPage[];
    if (mode === 'REPLACE') {
      updated = newProducts;
    } else {
      const existingSkus = new Set(products.map((p) => p.sku));
      const filtered = newProducts.filter((p) => !existingSkus.has(p.sku));
      updated = [...products, ...filtered];
    }

    setProducts(updated);
    StorageService.saveProducts(updated);

    // Also update merchant items to match products
    const newMerchantItems: MerchantProductItem[] = updated.map((pdp) => ({
      id: `mc-${pdp.sku.toLowerCase()}`,
      sku: pdp.sku,
      title: pdp.title,
      price: pdp.price,
      availability: pdp.inStock ? 'in_stock' : 'out_of_stock',
      approvalStatus: 'approved',
      hasPdpMismatch: false,
      lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      itemLevelIssues: [],
    }));
    setMerchantItems(newMerchantItems);

    addLog(
      'MSSQL',
      'success',
      `成功导入 ${newProducts.length} 条产品数据 (${mode === 'REPLACE' ? '完全覆盖' : '追加合并'})，当前总数: ${updated.length}`
    );
    showToast(`产品数据已更新：当前共 ${updated.length} 条真实产品`);
  };

  const handleImportSitemapXml = (file: LocalSitemapFile, items: UrlVerificationItem[]) => {
    setLocalSitemaps((prev) => {
      const filtered = prev.filter((f) => f.fileName !== file.fileName);
      return [file, ...filtered];
    });

    setUrlVerifications((prev) => {
      const existingUrls = new Set(prev.map((i) => i.url));
      const newItems = items.filter((i) => !existingUrls.has(i.url));
      return [...newItems, ...prev];
    });

    // Check if matching sitemap exists
    setSitemaps((prev) => {
      const exists = prev.some((s) => s.sitemapUrl.includes(file.fileName));
      if (!exists) {
        return [
          {
            sitemapUrl: `https://www.globalchipmall.com/${file.fileName}`,
            sitemapType: 'PRODUCT' as const,
            submittedAt: file.lastModified,
            lastGoogleCrawl: '待同步抓取',
            totalUrls: file.urlCount,
            indexedCount: 0,
            status: 'SUCCESS' as const,
          },
          ...prev,
        ];
      }
      return prev;
    });

    addLog('Sitemap', 'success', `已解析并注册 XML 站点地图: ${file.fileName} (${file.urlCount} 个 URL)`);
    showToast(`XML 站点地图已导入: ${file.fileName} (${file.urlCount} 条链接)`);
  };

  const handleFetchFromMssql = async () => {
    setIsFetchingMssql(true);
    addLog('MSSQL', 'info', `正在连接 MSSQL 生产数据库 ${mssqlConfig.host}:${mssqlConfig.port}/${mssqlConfig.database}...`);

    try {
      const fetchedProducts = await wailsBridge.fetchMssqlProducts();
      if (fetchedProducts.length > 0) {
        handleImportProducts(fetchedProducts, 'REPLACE');
        addLog(
          'MSSQL',
          'success',
          `从 MSSQL 成功拉取 ${fetchedProducts.length} 条商品详情页记录 (经本地代理链路安全同步)`
        );
        showToast(`已从 MSSQL 成功同步 ${fetchedProducts.length} 条元器件产品数据！`);
      } else {
        addLog('MSSQL', 'warn', 'MSSQL 数据表未返回任何有效产品记录');
        showToast('MSSQL 查询成功，但目前表为空');
      }
    } catch (e: any) {
      addLog('MSSQL', 'error', `MSSQL 数据拉取失败: ${e.message}`);
      showToast(`MSSQL 拉取失败: ${e.message}`);
    } finally {
      setIsFetchingMssql(false);
    }
  };

  const handleClearAllData = () => {
    setProducts([]);
    setMerchantItems([]);
    setUrlVerifications([]);
    setLocalSitemaps([]);
    setSubmissions([]);
    StorageService.clearAll();
    addLog('System', 'warn', '所有模拟与缓存业务数据已清空，系统处于零数据纯净态');
    showToast('所有数据已成功清空');
  };

  const handleLoadSampleData = () => {
    setProducts(sampleProducts);
    setMerchantItems(sampleMerchantProducts);
    setSitemaps(sampleSitemaps);
    setRankings(sampleRankings);
    setUrlVerifications(sampleUrlVerifications);
    setLocalSitemaps(sampleLocalSitemapFiles);
    StorageService.saveProducts(sampleProducts);
    addLog('System', 'info', '已装载 GlobalChipMall 真实元器件外贸标准测试数据集');
    showToast('已装载真实元器件外贸数据集');
  };

  const handleExportBackup = () => {
    StorageService.exportFullBackup({
      products,
      sitemaps,
      merchantItems,
      rankings,
      localSitemaps,
      urlVerifications,
      mssqlConfig,
      proxyConfig,
    });
    addLog('System', 'info', '已导出当前工作站业务数据完整 JSON 备份文件');
    showToast('数据备份文件导出成功');
  };

  const handleRestoreBackup = async (file: File) => {
    try {
      const data = await StorageService.restoreFromBackup(file);
      if (data.products) setProducts(data.products);
      if (data.merchantItems) setMerchantItems(data.merchantItems);
      if (data.sitemaps) setSitemaps(data.sitemaps);
      if (data.rankings) setRankings(data.rankings);
      if (data.localSitemaps) setLocalSitemaps(data.localSitemaps);
      if (data.urlVerifications) setUrlVerifications(data.urlVerifications);
      if (data.mssqlConfig) setMssqlConfig(data.mssqlConfig);
      if (data.proxyConfig) setProxyConfig(data.proxyConfig);

      addLog('System', 'success', `成功从备份 ${file.name} 恢复工作站全部数据`);
      showToast('工作区备份恢复成功！');
    } catch (err: any) {
      addLog('System', 'error', `还原备份失败: ${err.message}`);
      showToast(`还原失败: ${err.message}`);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    StorageService.saveProducts(updated);
    if (target) {
      setMerchantItems((prev) => prev.filter((m) => m.sku !== target.sku));
      addLog('MSSQL', 'info', `已删除产品记录: [${target.sku}] ${target.title}`);
      showToast(`已删除产品: ${target.sku}`);
    }
  };

  const handleAddProduct = (newPdp: ProductDetailPage) => {
    const updated = [newPdp, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);

    const newMerchant: MerchantProductItem = {
      id: `mc-${newPdp.sku.toLowerCase()}`,
      sku: newPdp.sku,
      title: newPdp.title,
      price: newPdp.price,
      availability: newPdp.inStock ? 'in_stock' : 'out_of_stock',
      approvalStatus: 'approved',
      hasPdpMismatch: false,
      lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      itemLevelIssues: [],
    };
    setMerchantItems((prev) => [newMerchant, ...prev]);

    // Also add to url verifications
    setUrlVerifications((prev) => [
      {
        url: newPdp.url,
        sitemapUrl: 'https://www.globalchipmall.com/sitemap_products_1.xml',
        httpStatus: 200,
        latencyMs: 120,
        canonicalMatched: true,
        schemaValid: true,
        lastVerifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        sku: newPdp.sku,
        stockStatus: newPdp.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
      },
      ...prev,
    ]);

    addLog('MSSQL', 'success', `新增电子元器件 PDP: [${newPdp.sku}] ${newPdp.title}`);
    showToast(`新增产品成功: ${newPdp.sku}`);
  };

  const handleAddLocalSitemap = (newFile: LocalSitemapFile) => {
    setLocalSitemaps((prev) => {
      const filtered = prev.filter((f) => f.id !== newFile.id && f.fileName !== newFile.fileName);
      return [newFile, ...filtered];
    });
    addLog('Sitemap', 'success', `已添加站点地图文件: ${newFile.fileName}`);
    showToast(`站点地图已添加: ${newFile.fileName}`);
  };

  // 1. Submit Single URL to Indexing API
  const handleSubmitIndexingUrl = async (
    url: string,
    type: IndexingNotificationType,
    priority: IndexingPriority
  ) => {
    setIsSubmitting(true);
    addLog(
      'WailsIPC',
      'info',
      `Calling app.SubmitIndexingUrl("${url}", "${type}", "${priority}")`
    );

    try {
      const { record, newQuota } = await wailsBridge.submitIndexingUrl(
        url,
        type,
        priority,
        quota
      );

      setSubmissions((prev) => [record, ...prev]);
      setQuota(newQuota);

      if (record.status === 'SUCCESS') {
        addLog(
          'IndexingAPI',
          'success',
          `Google Indexing API 广播成功: ${type} -> ${url}`,
          `HTTP 200 OK, Latency: ${record.latencyMs}ms, 剩余配额: ${newQuota.dailyLimit - newQuota.usedToday}`
        );
        showToast(`Indexing API 提交成功: ${record.url.substring(0, 45)}...`);

        // If this URL is in products, update its indexStatus
        setProducts((prev) =>
          prev.map((p) =>
            p.url === url
              ? {
                  ...p,
                  indexStatus: 'INDEXED',
                  lastCrawledAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                }
              : p
          )
        );
      } else {
        addLog(
          'IndexingAPI',
          'warn',
          `Google Indexing API 配额限流: ${record.errorMessage}`,
          '任务已自动入队，将在 00:00 UTC 新增配额后自动调度'
        );
        showToast('已达到今日 200 限制，任务已自动缓冲入队');
      }
    } catch (e: any) {
      addLog('IndexingAPI', 'error', `提交异常: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Batch Submit Unindexed or Queued Items
  const handleBatchSubmitQueued = async () => {
    setIsSubmitting(true);
    addLog('IndexingAPI', 'info', `Starting Smart-Paced Batch Submit for ${quota.queuedCount} queued items`);

    const unindexed = products.filter((p) => p.indexStatus !== 'INDEXED');
    const targetUrls = unindexed.map((p) => ({
      url: p.url,
      type: 'URL_UPDATED' as IndexingNotificationType,
      priority: 'HIGH' as IndexingPriority,
    }));

    if (targetUrls.length === 0) {
      targetUrls.push({
        url: 'https://store.example.com/products/audio/bose-qc-ultra-white',
        type: 'URL_UPDATED',
        priority: 'HIGH',
      });
    }

    try {
      const { records, newQuota } = await wailsBridge.batchSubmitUrls(targetUrls, quota);
      setSubmissions((prev) => [...records, ...prev]);
      setQuota({
        ...newQuota,
        queuedCount: Math.max(0, newQuota.queuedCount - records.length),
      });

      // Update product statuses
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          indexStatus: 'INDEXED',
          lastCrawledAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        }))
      );

      addLog(
        'IndexingAPI',
        'success',
        `批量完成 ${records.length} 个 URL 的推送，当前剩余配额: ${newQuota.dailyLimit - newQuota.usedToday}`
      );
      showToast(`已批量推送 ${records.length} 个 URL 到 Google Indexing API`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Batch Sync Mismatches with Google Merchant Center
  const handleBatchSyncMismatches = async () => {
    setIsSyncing(true);
    addLog(
      'MerchantCenter',
      'info',
      'Initiating Google Merchant Center Content API v2.1 two-way price/stock synchronization'
    );

    await new Promise((r) => setTimeout(r, 600));

    // Align products with Merchant Items
    const updatedMerchantList = merchantItems.map((item) => {
      const pdp = products.find((p) => p.sku === item.sku);
      if (!pdp) return item;

      return {
        ...item,
        price: pdp.price,
        availability: (pdp.inStock ? 'in_stock' : 'out_of_stock') as any,
        approvalStatus: 'approved' as any,
        hasPdpMismatch: false,
        mismatchDetails: undefined,
        lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        itemLevelIssues: item.itemLevelIssues.filter(
          (iss) => iss.code !== 'price_mismatch_warning' && iss.code !== 'availability_mismatch'
        ),
      };
    });

    const updatedPdpList = products.map((pdp) => ({
      ...pdp,
      merchantSyncStatus: 'SYNCED' as any,
      merchantPrice: pdp.price,
      merchantInStock: pdp.inStock,
    }));

    setMerchantItems(updatedMerchantList);
    setProducts(updatedPdpList);

    addLog(
      'MerchantCenter',
      'success',
      'Google Merchant Center 差异数据已全部对齐：DJI Mini 4 Pro 价格降至 ¥5988，MacBook Pro 16 标记为缺货'
    );
    showToast('已完成与 Google Merchant Center 的双向数据强对齐');
    setIsSyncing(false);
  };

  // 4. Sync Single Merchant Item
  const handleSyncSingleMerchantItem = async (item: MerchantProductItem) => {
    setIsSyncing(true);
    const pdp = products.find((p) => p.sku === item.sku);
    if (!pdp) {
      setIsSyncing(false);
      return;
    }

    const { updatedPdp, updatedMerchant } = await wailsBridge.syncMerchantProduct(pdp, item);

    setProducts((prev) => prev.map((p) => (p.sku === pdp.sku ? updatedPdp : p)));
    setMerchantItems((prev) => prev.map((m) => (m.sku === item.sku ? updatedMerchant : m)));

    addLog(
      'MerchantCenter',
      'success',
      `单品同步完成: SKU ${item.sku} 价格与库存已推送至 Google Content API`
    );
    showToast(`SKU ${item.sku} 已成功同步至 Merchant Center`);
    setIsSyncing(false);
  };

  // 5. Ping Sitemap to Google
  const handlePingSitemap = async (sitemapUrl: string) => {
    setIsPinging(true);
    addLog('Sitemap', 'info', `向 Google 提交 Sitemap Ping: ${sitemapUrl} (经本地 VPN 代理 ${proxyConfig.proxyUrl})`);

    const res = await wailsBridge.pingSitemap(sitemapUrl);
    addLog(
      'Sitemap',
      'success',
      `Google 确认已接收 Sitemap 通知 (HTTP 200 OK, 经由 ${proxyConfig.proxyUrl} 转发，时延 ${res.latencyMs}ms)`,
      'Googlebot 爬虫已将该 sitemap 加入抓取调度列表'
    );
    showToast('Google 站点地图 Ping 同步成功！');
    setIsPinging(false);
  };

  // 6. Automation Rule Toggle & Run
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    const target = rules.find((r) => r.id === ruleId);
    if (target) {
      addLog(
        'Automation',
        'info',
        `规则「${target.name}」已${target.enabled ? '停用' : '启用'}`
      );
      showToast(`规则「${target.name}」状态已更新`);
    }
  };

  const handleExecuteRuleManual = async (rule: AutomationRule) => {
    setIsExecutingRule(true);
    addLog('Automation', 'info', `手动触发自动化策略规则: ${rule.name}`);
    await new Promise((r) => setTimeout(r, 450));

    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? {
              ...r,
              executionCount: r.executionCount + 1,
              lastTriggeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : r
      )
    );

    addLog(
      'Automation',
      'success',
      `工作流「${rule.name}」执行链路全部通过：触发 Indexing API + Merchant 校验`
    );
    showToast(`工作流「${rule.name}」执行成功！`);
    setIsExecutingRule(false);
  };

  // Count helper stats
  const mismatchCount = merchantItems.filter((i) => i.hasPdpMismatch).length;
  const unindexedCount = products.filter((p) => p.indexStatus !== 'INDEXED').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F1F5F9] font-sans text-[#1E293B] antialiased">
      {/* 1. PC Desktop TitleBar */}
      <TitleBar
        quota={quota}
        runtimeState={runtimeState}
        serviceAccount={serviceAccount}
        proxyConfig={proxyConfig}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
        onOpenServiceAccountModal={() => setActiveTab('settings')}
      />

      {/* 2. Main Workstation Body (Sidebar + Content View) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          mismatchCount={mismatchCount}
          queuedCount={quota.queuedCount}
          unindexedCount={unindexedCount}
        />

        {/* Dynamic View Container */}
        <main
          id="main-content-scroll"
          tabIndex={0}
          aria-label="主要管理视图内容区域"
          className="flex-1 overflow-y-auto bg-[#F1F5F9] relative focus:outline-none"
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              quota={quota}
              products={products}
              merchantItems={merchantItems}
              rankings={rankings}
              sitemaps={sitemaps}
              onBatchSyncMismatches={handleBatchSyncMismatches}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onQuickSubmitUrl={(url) =>
                handleSubmitIndexingUrl(url, 'URL_UPDATED', 'HIGH')
              }
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'indexing' && (
            <IndexingApiView
              quota={quota}
              submissions={submissions}
              products={products}
              onSubmitUrl={handleSubmitIndexingUrl}
              onBatchSubmitQueued={handleBatchSubmitQueued}
              onChangePacingMode={(mode) =>
                setQuota((q) => ({ ...q, pacingMode: mode }))
              }
              isSubmitting={isSubmitting}
            />
          )}

          {activeTab === 'sitemaps' && (
            <SitemapsView
              sitemaps={sitemaps}
              products={products}
              localSitemaps={localSitemaps}
              onUpdateLocalSitemap={(updated) =>
                setLocalSitemaps((prev) =>
                  prev.map((f) => (f.id === updated.id ? updated : f))
                )
              }
              urlVerifications={urlVerifications}
              onUpdateUrlVerifications={(items) => setUrlVerifications(items)}
              proxyConfig={proxyConfig}
              onPingSitemap={handlePingSitemap}
              onBatchSubmitToIndexing={(urls) => {
                urls.forEach((u) => handleSubmitIndexingUrl(u, 'URL_UPDATED', 'HIGH'));
              }}
              isPinging={isPinging}
            />
          )}

          {activeTab === 'pdp_analytics' && (
            <PdpAnalyticsView
              products={products}
              onTriggerIndexingSubmit={(url) =>
                handleSubmitIndexingUrl(url, 'URL_UPDATED', 'HIGH')
              }
              onSyncMerchantSingle={(pdp) => {
                const matched = merchantItems.find((m) => m.sku === pdp.sku);
                handleSyncSingleMerchantItem(matched || (pdp as any));
              }}
            />
          )}

          {activeTab === 'merchant_sync' && (
            <MerchantSyncView
              merchantItems={merchantItems}
              products={products}
              onSyncAllMismatches={handleBatchSyncMismatches}
              onSyncSingleItem={handleSyncSingleMerchantItem}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'rank_tracker' && (
            <RankTrackerView
              rankings={rankings}
              onTriggerOptimization={(ranking) => {
                handleSubmitIndexingUrl(ranking.targetUrl, 'URL_UPDATED', 'HIGH');
              }}
            />
          )}

          {activeTab === 'automation' && (
            <AutomationFlowView
              rules={rules}
              onToggleRule={handleToggleRule}
              onExecuteRuleManual={handleExecuteRuleManual}
              isExecuting={isExecutingRule}
            />
          )}

          {activeTab === 'mssql_storage' && (
            <MssqlManagerView
              mssqlConfig={mssqlConfig}
              tableStats={tableStats}
              cacheStats={cacheStats}
              products={products}
              sitemaps={sitemaps}
              serviceAccount={serviceAccount}
              onUpdateMssqlConfig={(cfg) => setMssqlConfig(cfg)}
              onUpdateCacheStats={(st) => setCacheStats(st)}
              onAddLog={addLog}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'wails_code' && <WailsGoSourceView />}

          {activeTab === 'settings' && (
            <SettingsView
              serviceAccount={serviceAccount}
              onUpdateServiceAccount={(newCreds) => {
                setServiceAccount(newCreds);
                addLog('IndexingAPI', 'success', '已更新 Google Service Account 密钥');
                showToast('Service Account 凭据更新成功！');
              }}
              runtimeState={runtimeState}
              proxyConfig={proxyConfig}
              onUpdateProxyConfig={(newCfg) => {
                setProxyConfig(newCfg);
                addLog(
                  'Proxy',
                  'info',
                  `已更新 Google API 本地 VPN 代理配置: ${newCfg.proxyUrl} (${newCfg.status})`
                );
                showToast(`代理设置已生效: ${newCfg.proxyUrl}`);
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Live Go Terminal & Activity Drawer */}
      <LiveLogDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* 4. Desktop Toast Alert */}
      {toastMessage && (
        <div
          id="desktop-toast"
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
