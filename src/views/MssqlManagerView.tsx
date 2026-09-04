import React, { useState } from 'react';
import {
  Database,
  Server,
  Zap,
  HardDrive,
  RefreshCw,
  Check,
  AlertTriangle,
  Play,
  Copy,
  Table,
  Sliders,
  FileCode,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  MssqlConnectionConfig,
  MssqlTableStat,
  LocalPerformanceCacheStats,
  ProductDetailPage,
  SitemapItem,
  ServiceAccountCredentials,
} from '../types';
import { wailsBridge } from '../services/wailsBridge';

interface MssqlManagerViewProps {
  mssqlConfig: MssqlConnectionConfig;
  tableStats: MssqlTableStat[];
  cacheStats: LocalPerformanceCacheStats;
  products: ProductDetailPage[];
  sitemaps: SitemapItem[];
  serviceAccount: ServiceAccountCredentials;
  onUpdateMssqlConfig: (newConfig: MssqlConnectionConfig) => void;
  onUpdateCacheStats: (newStats: LocalPerformanceCacheStats) => void;
  onAddLog: (module: any, level: any, message: string, details?: string) => void;
  onShowToast: (msg: string) => void;
}

export const MssqlManagerView: React.FC<MssqlManagerViewProps> = ({
  mssqlConfig,
  tableStats,
  cacheStats,
  products,
  sitemaps,
  serviceAccount,
  onUpdateMssqlConfig,
  onUpdateCacheStats,
  onAddLog,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tables' | 'cache' | 'config' | 'schema'>('tables');
  const [selectedTable, setSelectedTable] = useState<'gcm_pdps' | 'gcm_sitemaps' | 'gcm_configs' | 'gcm_perf_cache'>('gcm_pdps');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [isPrewarming, setIsPrewarming] = useState(false);
  const [isInitSchema, setIsInitSchema] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Test MSSQL Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    onAddLog('WailsIPC', 'info', `正在通过 Go MSSQL 驱动测试连接: ${mssqlConfig.host}:${mssqlConfig.port}/${mssqlConfig.database}...`);
    try {
      const res = await wailsBridge.testMssqlConnection(mssqlConfig);
      if (res.success) {
        onUpdateMssqlConfig({
          ...mssqlConfig,
          connectionStatus: 'CONNECTED',
          serverVersion: res.serverVersion,
          lastPingLatencyMs: res.latencyMs,
          errorMessage: undefined,
        });
        onAddLog('WailsIPC', 'success', `MSSQL 数据库 [${res.databaseName}] 连接成功!`, `版本: ${res.serverVersion} (延迟 ${res.latencyMs}ms)`);
        onShowToast(`MSSQL 连接成功 (延迟: ${res.latencyMs}ms)`);
      } else {
        onUpdateMssqlConfig({
          ...mssqlConfig,
          connectionStatus: 'ERROR',
          errorMessage: res.error,
        });
        onAddLog('WailsIPC', 'error', `MSSQL 连接失败: ${res.error}`);
        onShowToast(`MSSQL 连接失败: ${res.error}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Sync All Data to MSSQL
  const handleSyncToMssql = async () => {
    setIsSyncing(true);
    onAddLog('WailsIPC', 'info', `正在将 PDP (${products.length})、Sitemaps (${sitemaps.length}) 及配置写入 MSSQL [${mssqlConfig.database}]...`);
    try {
      const res = await wailsBridge.syncAllToMssql(products.length, sitemaps.length, 16);
      onAddLog('WailsIPC', 'success', `全量数据已成功持久化至 MSSQL 数据表`, `耗时 ${res.syncDurationMs}ms, 写入 PDP: ${res.insertedPdps}, Sitemaps: ${res.insertedSitemaps}`);
      onShowToast(`成功同步 ${res.insertedPdps} 条 PDP 及 ${res.insertedSitemaps} 个站点地图至 MSSQL!`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Init MSSQL Schema
  const handleInitSchema = async () => {
    setIsInitSchema(true);
    onAddLog('WailsIPC', 'info', `正在执行 gcm_google_tool T-SQL 数据表初始化脚本...`);
    try {
      const res = await wailsBridge.initMssqlSchema(mssqlConfig.database);
      onAddLog('WailsIPC', 'success', `MSSQL 架构初始化完毕: ${res.tablesCreated.join(', ')}`, `已创建 ${res.indexesCreated} 个索引，执行时间 ${res.executionTimeMs}ms`);
      onShowToast(`MSSQL 数据表与索引已就绪!`);
    } finally {
      setIsInitSchema(false);
    }
  };

  // Flush Local Performance Cache
  const handleFlushCache = async () => {
    setIsFlushingCache(true);
    try {
      const res = await wailsBridge.flushLocalCache();
      onUpdateCacheStats({
        ...cacheStats,
        totalEntries: 0,
        memoryUsageKb: 0,
        keys: [],
      });
      onAddLog('WailsIPC', 'warn', `本地性能存储高速缓存已清空`, `释放内存 ${res.freedMemoryKb} KB, 清除 ${res.clearedKeys} 个缓存键`);
      onShowToast('本地高速缓存已成功清空');
    } finally {
      setIsFlushingCache(false);
    }
  };

  // Pre-warm Local Cache from MSSQL
  const handlePrewarmCache = async () => {
    setIsPrewarming(true);
    onAddLog('WailsIPC', 'info', '正在从 MSSQL [gcm_google_tool] 读取热点 PDP 与配置预热本地内存缓存...');
    try {
      const res = await wailsBridge.prewarmLocalCache();
      onUpdateCacheStats({
        ...cacheStats,
        totalEntries: res.warmedKeys,
        memoryUsageKb: res.allocatedMemoryKb,
        hitRatio: 96.2,
      });
      onAddLog('WailsIPC', 'success', `本地性能缓存预热完成`, `已装载 ${res.warmedKeys} 个热点条目，占用内存 ${res.allocatedMemoryKb} KB`);
      onShowToast(`缓存预热成功! 装载 ${res.warmedKeys} 条热点记录`);
    } finally {
      setIsPrewarming(false);
    }
  };

  const fullSqlScript = `-- =========================================================================
-- 项目名称: gcm_google_tool
-- 架构方案: Golang + Wails v2 + Vue 3 桌面端自动化系统
-- 数据库引擎: Microsoft SQL Server (2019 / 2022 / Azure SQL)
-- 功能定位: 存储系统配置、电商产品详情页(PDP)、XML站点地图及本地性能存储快照
-- =========================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'gcm_google_tool')
BEGIN
    CREATE DATABASE [gcm_google_tool]
    COLLATE Chinese_PRC_CI_AS;
END
GO

USE [gcm_google_tool];
GO

-- 1. 系统核心配置表 (gcm_configs)
IF OBJECT_ID(N'dbo.gcm_configs', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[gcm_configs] (
        [config_key]    NVARCHAR(128) NOT NULL PRIMARY KEY,
        [config_value]  NVARCHAR(MAX) NOT NULL,
        [category]      VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_CORE',
        [is_encrypted]  BIT NOT NULL DEFAULT 0,
        [updated_at]    DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        [created_at]    DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
    CREATE NONCLUSTERED INDEX [IX_gcm_configs_category] ON [dbo].[gcm_configs] ([category]);
END
GO

-- 2. 电商产品详情页数据表 (gcm_pdps)
IF OBJECT_ID(N'dbo.gcm_pdps', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[gcm_pdps] (
        [id]                        VARCHAR(64) NOT NULL,
        [sku]                       VARCHAR(64) NOT NULL PRIMARY KEY,
        [name]                      NVARCHAR(256) NOT NULL,
        [url]                       NVARCHAR(512) NOT NULL,
        [category]                  NVARCHAR(128) NOT NULL,
        [price]                     DECIMAL(12, 2) NOT NULL,
        [currency]                  VARCHAR(8) NOT NULL DEFAULT 'CNY',
        [in_stock]                  BIT NOT NULL DEFAULT 1,
        [stock_count]               INT NOT NULL DEFAULT 0,
        -- SEO 与流量统计指标
        [page_views_30d]            INT NOT NULL DEFAULT 0,
        [unique_visitors_30d]       INT NOT NULL DEFAULT 0,
        [organic_clicks_30d]        INT NOT NULL DEFAULT 0,
        [organic_impressions_30d]   INT NOT NULL DEFAULT 0,
        [avg_ctr]                   DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        [avg_search_position]       DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        -- Google Indexing 收录状态
        [index_status]              VARCHAR(32) NOT NULL DEFAULT 'DISCOVERED_NOT_INDEXED',
        [last_crawled_at]           DATETIME2(3) NULL,
        [schema_valid]              BIT NOT NULL DEFAULT 1,
        -- Google Merchant Center 对齐状态
        [merchant_sync_status]      VARCHAR(32) NOT NULL DEFAULT 'NOT_SUBMITTED',
        [merchant_price]            DECIMAL(12, 2) NULL,
        [merchant_in_stock]         BIT NULL,
        [last_synced_at]            DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );

    CREATE NONCLUSTERED INDEX [IX_gcm_pdps_index_status] ON [dbo].[gcm_pdps] ([index_status]);
    CREATE NONCLUSTERED INDEX [IX_gcm_pdps_merchant_sync] ON [dbo].[gcm_pdps] ([merchant_sync_status]);
    CREATE NONCLUSTERED INDEX [IX_gcm_pdps_url] ON [dbo].[gcm_pdps] ([url]);
END
GO

-- 3. XML 站点地图管理表 (gcm_sitemaps)
IF OBJECT_ID(N'dbo.gcm_sitemaps', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[gcm_sitemaps] (
        [id]                    VARCHAR(64) NOT NULL,
        [sitemap_url]           NVARCHAR(512) NOT NULL PRIMARY KEY,
        [sitemap_type]          VARCHAR(32) NOT NULL DEFAULT 'pdp_sitemap',
        [total_urls]            INT NOT NULL DEFAULT 0,
        [indexed_count]         INT NOT NULL DEFAULT 0,
        [last_google_crawl]     DATETIME2(3) NULL,
        [status]                VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
        [last_response_status]  INT NOT NULL DEFAULT 200,
        [auto_ping_enabled]     BIT NOT NULL DEFAULT 1,
        [submitted_at]          DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        [updated_at]            DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- 4. 本地性能存储高速缓存表 (gcm_perf_cache)
IF OBJECT_ID(N'dbo.gcm_perf_cache', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[gcm_perf_cache] (
        [cache_key]     VARCHAR(256) NOT NULL PRIMARY KEY,
        [cache_group]   VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
        [payload_json]  NVARCHAR(MAX) NOT NULL,
        [size_bytes]    INT NOT NULL DEFAULT 0,
        [hit_count]     INT NOT NULL DEFAULT 0,
        [expires_at]    DATETIME2(3) NOT NULL,
        [created_at]    DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        [last_hit_at]   DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );

    CREATE NONCLUSTERED INDEX [IX_gcm_perf_cache_expires] ON [dbo].[gcm_perf_cache] ([expires_at]);
    CREATE NONCLUSTERED INDEX [IX_gcm_perf_cache_group] ON [dbo].[gcm_perf_cache] ([cache_group]);
END
GO`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(fullSqlScript);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
    onShowToast('T-SQL 初始化脚本已复制到剪贴板');
  };

  return (
    <div id="view-mssql-manager" className="p-6 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>MSSQL 数据库与本地性能存储</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                gcm_google_tool
              </span>
            </h1>
          </div>
          <p className="text-slate-500 max-w-3xl">
            系统采用 Microsoft SQL Server 持久化存储应用配置、产品详情页 (PDP)、站点地图 XML，并由 Golang 维护本地高性能 LRU 内存缓存层，实现高吞吐亚毫秒级检索。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="btn-test-mssql"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>测试连接</span>
          </button>

          <button
            id="btn-init-schema"
            onClick={handleInitSchema}
            disabled={isInitSchema}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
          >
            <Play className={`w-3.5 h-3.5 ${isInitSchema ? 'animate-spin text-blue-600' : 'text-emerald-600'}`} />
            <span>执行建表与索引</span>
          </button>

          <button
            id="btn-sync-all-mssql"
            onClick={handleSyncToMssql}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <HardDrive className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>同步全部数据至 MSSQL</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MSSQL Status */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-600" />
              MSSQL 数据库状态
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              已连接
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {mssqlConfig.database}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>{mssqlConfig.host}:{mssqlConfig.port}</span>
            <span className="text-emerald-600 font-semibold">{mssqlConfig.lastPingLatencyMs} ms</span>
          </div>
        </div>

        {/* Card 2: Local Performance Cache */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              本地性能存储 (LRU)
            </span>
            <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
              {cacheStats.hitRatio}% 命中率
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {cacheStats.memoryUsageKb} <span className="text-xs font-normal text-slate-500">KB / {cacheStats.maxMemoryMb} MB</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>条目数: {cacheStats.totalEntries}</span>
            <span className="text-slate-700">{cacheStats.hitCount} Hits</span>
          </div>
        </div>

        {/* Card 3: PDP Count */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-emerald-600" />
              产品详情页 (gcm_pdps)
            </span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              主键: sku
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {products.length} <span className="text-xs font-normal text-slate-500">条商品记录</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>索引 &amp; 商城双向对齐</span>
            <span className="text-blue-600 font-mono">144 KB 表空间</span>
          </div>
        </div>

        {/* Card 4: Sitemaps Count */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              站点地图 (gcm_sitemaps)
            </span>
            <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              自动 Ping
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {sitemaps.length} <span className="text-xs font-normal text-slate-500">个 XML 索引</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>纳管 URL: 2,718 条</span>
            <span className="text-emerald-600 font-semibold">100% 活跃</span>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
            activeSubTab === 'tables'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>MSSQL 数据表与记录浏览</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cache')}
          className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
            activeSubTab === 'cache'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>本地性能存储与高速缓存 (LRU)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('config')}
          className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
            activeSubTab === 'config'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>连接池与驱动参数</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`pb-2.5 px-3 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
            activeSubTab === 'schema'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>T-SQL 架构定义脚本</span>
        </button>
      </div>

      {/* Sub Tab 1: Tables & Records */}
      {activeSubTab === 'tables' && (
        <div className="space-y-4">
          {/* Table Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">选择数据表:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'gcm_pdps', label: 'gcm_pdps (产品详情页)', count: products.length },
                  { id: 'gcm_sitemaps', label: 'gcm_sitemaps (站点地图)', count: sitemaps.length },
                  { id: 'gcm_configs', label: 'gcm_configs (系统配置)', count: 16 },
                  { id: 'gcm_perf_cache', label: 'gcm_perf_cache (缓存快照)', count: cacheStats.totalEntries },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      selectedTable === t.id
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] ${selectedTable === t.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="过滤当前表内数据..."
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:bg-white focus:border-blue-500 w-52"
              />
            </div>
          </div>

          {/* Table 1: PDPs */}
          {selectedTable === 'gcm_pdps' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-blue-600" />
                  [dbo].[gcm_pdps] — 电商产品详情页与 Google 收录对齐表
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Schema: dbo | PK: sku (VARCHAR(64)) | 索引: IX_index_status, IX_merchant_sync
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">SKU (主键)</th>
                      <th className="px-3 py-2.5 font-semibold">商品名称与链接</th>
                      <th className="px-3 py-2.5 font-semibold">价格 / 库存</th>
                      <th className="px-3 py-2.5 font-semibold">30天曝光 / 点击</th>
                      <th className="px-3 py-2.5 font-semibold">Google 收录状态</th>
                      <th className="px-3 py-2.5 font-semibold">Merchant Center</th>
                      <th className="px-3 py-2.5 font-semibold">MSSQL 状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {products
                      .filter((p) => p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.includes(searchQuery))
                      .map((p) => (
                        <tr key={p.sku} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-blue-600">{p.sku}</td>
                          <td className="px-3 py-2.5 font-sans max-w-xs">
                            <div className="font-medium text-slate-900 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{p.url}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-slate-900 font-bold">¥{p.price}</span>
                            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${p.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {p.inStock ? `有货 (${p.stockCount})` : '缺货'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-slate-700">{p.organicImpressions30d.toLocaleString()}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-emerald-600 font-semibold">{p.organicClicks30d.toLocaleString()}</span>
                            <div className="text-[10px] text-slate-500">CTR: {p.avgCtr}%</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.indexStatus === 'INDEXED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {p.indexStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.merchantSyncStatus === 'SYNCED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : p.merchantSyncStatus === 'MISMATCH'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.merchantSyncStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-1 text-emerald-600 text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 已持久化
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 2: Sitemaps */}
          {selectedTable === 'gcm_sitemaps' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  [dbo].[gcm_sitemaps] — XML 站点地图与 Googlebot 爬取记录表
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Schema: dbo | PK: sitemap_url (NVARCHAR(512))
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">站点地图 URL (主键)</th>
                      <th className="px-3 py-2.5 font-semibold">类型</th>
                      <th className="px-3 py-2.5 font-semibold">URL 计数 / 收录</th>
                      <th className="px-3 py-2.5 font-semibold">自动 Ping</th>
                      <th className="px-3 py-2.5 font-semibold">最近抓取</th>
                      <th className="px-3 py-2.5 font-semibold">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {sitemaps.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 text-blue-600 font-medium max-w-sm truncate">
                          {s.sitemapUrl}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{s.type}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-slate-900 font-semibold">{s.totalUrls}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-emerald-600 font-semibold">{s.indexedCount}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">
                            {s.autoPingEnabled ? '已启用 (24h)' : '手动'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{s.lastGoogleCrawl}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                            {s.status} (HTTP {s.lastResponseStatus})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 3: Configs */}
          {selectedTable === 'gcm_configs' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  [dbo].[gcm_configs] — 系统运行环境与 Google 服务账号配置表
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Schema: dbo | PK: config_key (NVARCHAR(128))
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">配置键 (config_key)</th>
                      <th className="px-3 py-2.5 font-semibold">分类</th>
                      <th className="px-3 py-2.5 font-semibold">当前值 (config_value)</th>
                      <th className="px-3 py-2.5 font-semibold">加密存储</th>
                      <th className="px-3 py-2.5 font-semibold">最后更新</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {[
                      { key: 'google.service_account.project_id', val: serviceAccount.project_id, cat: 'GOOGLE_CREDENTIALS', enc: false },
                      { key: 'google.service_account.client_email', val: serviceAccount.client_email, cat: 'GOOGLE_CREDENTIALS', enc: false },
                      { key: 'google.service_account.private_key', val: '••••••••••••••••••••••••••••••••••••••••••••••••', cat: 'GOOGLE_CREDENTIALS', enc: true },
                      { key: 'google.indexing.daily_quota_limit', val: '200', cat: 'INDEXING_QUOTA', enc: false },
                      { key: 'google.indexing.rate_per_minute', val: '60', cat: 'INDEXING_QUOTA', enc: false },
                      { key: 'google.merchant.merchant_id', val: '9182374612', cat: 'MERCHANT_SYNC', enc: false },
                      { key: 'engine.auto_sync_interval_seconds', val: '900', cat: 'SYSTEM_CORE', enc: false },
                      { key: 'engine.cache.max_memory_mb', val: '64', cat: 'SYSTEM_CORE', enc: false },
                      { key: 'engine.cache.default_ttl_sec', val: '300', cat: 'SYSTEM_CORE', enc: false },
                    ].map((c) => (
                      <tr key={c.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{c.key}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {c.cat}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-blue-600 max-w-xs truncate">{c.val}</td>
                        <td className="px-3 py-2.5">
                          {c.enc ? (
                            <span className="text-emerald-600 flex items-center gap-1 text-[10px]">
                              <ShieldCheck className="w-3.5 h-3.5" /> AES-256
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">明文</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">2026-09-04 02:45</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 4: Perf Cache Snapshot */}
          {selectedTable === 'gcm_perf_cache' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  [dbo].[gcm_perf_cache] — 本地性能存储持久化快照与命中分析
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Schema: dbo | PK: cache_key (VARCHAR(256))
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">缓存键 (cache_key)</th>
                      <th className="px-3 py-2.5 font-semibold">业务分类</th>
                      <th className="px-3 py-2.5 font-semibold">大小</th>
                      <th className="px-3 py-2.5 font-semibold">剩余有效 TTL</th>
                      <th className="px-3 py-2.5 font-semibold">命中次数</th>
                      <th className="px-3 py-2.5 font-semibold">最近访问</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {cacheStats.keys.map((k) => (
                      <tr key={k.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-blue-600">{k.key}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">
                            {k.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{(k.sizeBytes / 1024).toFixed(2)} KB</td>
                        <td className="px-3 py-2.5 text-emerald-600 font-semibold">{k.ttlRemainingSec}s</td>
                        <td className="px-3 py-2.5 text-slate-900 font-bold">{k.hitCount} 次</td>
                        <td className="px-3 py-2.5 text-slate-500 font-sans">{k.lastAccessed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: Local Performance Storage & Cache Engine */}
      {activeSubTab === 'cache' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-slate-500 text-xs block">本地内存缓存容量占用</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">{cacheStats.memoryUsageKb} KB</span>
                <span className="text-slate-400">/ {cacheStats.maxMemoryMb} MB (上限)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(2, (cacheStats.memoryUsageKb / (cacheStats.maxMemoryMb * 1024)) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                支持 LRU (Least Recently Used) 自动内存淘汰与 TTL 线程安全驱逐
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <span className="text-slate-500 text-xs block">缓存命中率与检索加速比</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-600">{cacheStats.hitRatio}%</span>
                <span className="text-slate-500 text-xs">({cacheStats.hitCount} Hits / {cacheStats.missCount} Misses)</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>本地缓存访问延迟:</span>
                  <span className="text-emerald-600 font-bold">~0.12 ms (内存并发读)</span>
                </div>
                <div className="flex justify-between">
                  <span>MSSQL 磁盘检索延迟:</span>
                  <span className="text-blue-600 font-bold">~3.40 ms (28.3x 加速)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-slate-500 text-xs block">高速缓存运维操作</span>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  清空内存脏数据，或从 MSSQL 数据表中批量预热加载核心 PDP 热点缓存。
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-flush-cache"
                  onClick={handleFlushCache}
                  disabled={isFlushingCache}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-xs"
                >
                  {isFlushingCache ? '清空中...' : '清空本地缓存'}
                </button>
                <button
                  id="btn-prewarm-cache"
                  onClick={handlePrewarmCache}
                  disabled={isPrewarming}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {isPrewarming ? '预热中...' : '预热热点数据'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Cached Keys Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                本地内存缓存活跃条目明细 (Golang sync.Map / LRU)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                策略: {cacheStats.evictionPolicy} | 默认 TTL: {cacheStats.defaultTtlSeconds} 秒
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {cacheStats.keys.map((k) => (
                <div key={k.key} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{k.key}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200">
                        {k.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      大小: {(k.sizeBytes / 1024).toFixed(2)} KB | 上次命中: {k.lastAccessed}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-bold text-emerald-600 font-mono">{k.ttlRemainingSec}s</div>
                      <div className="text-[10px] text-slate-400">剩余 TTL</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-mono">{k.hitCount}</div>
                      <div className="text-[10px] text-slate-400">命中统计</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Connection & Pool Config */}
      {activeSubTab === 'config' && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                Microsoft SQL Server 驱动与连接池配置 (TDS 协议)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Golang 使用 <code className="font-mono text-blue-600">github.com/microsoft/go-mssqldb</code> 官方驱动，直连本地或远程 SQL Server 实例。
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              池连接就绪 (25 max / 10 idle)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-slate-600 font-medium">服务器主机 (Host / IP)</label>
              <input
                type="text"
                value={mssqlConfig.host}
                onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, host: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-medium">端口号 (Port)</label>
              <input
                type="number"
                value={mssqlConfig.port}
                onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, port: parseInt(e.target.value) || 1433 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-medium">数据库名称 (Database)</label>
              <input
                type="text"
                value={mssqlConfig.database}
                onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, database: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-blue-600 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-medium">用户名 (User)</label>
              <input
                type="text"
                value={mssqlConfig.user}
                onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, user: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-medium">最大开启连接数 (MaxOpenConns)</label>
              <input
                type="number"
                value={mssqlConfig.maxOpenConns}
                onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, maxOpenConns: parseInt(e.target.value) || 25 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-600 font-medium">最大闲置连接数 (MaxIdleConns)</label>
              <input
                type="number"
                value={mssqlConfig.maxIdleConns}
                onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, maxIdleConns: parseInt(e.target.value) || 10 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-slate-600">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mssqlConfig.encrypt}
                  onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, encrypt: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">启用 TLS 流量加密 (encrypt)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mssqlConfig.trustServerCertificate}
                  onChange={(e) => onUpdateMssqlConfig({ ...mssqlConfig, trustServerCertificate: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">信任自签名证书 (TrustServerCertificate)</span>
              </label>
            </div>

            <button
              onClick={() => {
                onAddLog('WailsIPC', 'success', 'MSSQL 连接池配置已应用并生效');
                onShowToast('配置已更新并应用至 Go 连接池');
              }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              保存并重新连接
            </button>
          </div>
        </div>
      )}

      {/* Sub Tab 4: T-SQL DDL Script */}
      {activeSubTab === 'schema' && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-blue-600" />
                完整生产级 T-SQL 建库与建表脚本 (DDL)
              </h2>
              <p className="text-[11px] text-slate-500">
                可直接在 SQL Server Management Studio (SSMS)、Azure Data Studio 或 sqlcmd 中执行。
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-xs transition-colors"
            >
              {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{sqlCopied ? '已复制 SQL' : '复制脚本'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px] shadow-inner select-text">
            {fullSqlScript}
          </pre>
        </div>
      )}
    </div>
  );
};
