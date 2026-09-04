import {
  ProductDetailPage,
  MerchantProductItem,
  SitemapItem,
  SearchQueryRanking,
  AutomationRule,
  IndexingSubmissionRecord,
  QuotaStatus,
  ServiceAccountCredentials,
  WailsRuntimeState,
  MssqlConnectionConfig,
  MssqlTableStat,
  LocalPerformanceCacheStats,
  ProxyConfig,
  UrlVerificationItem,
  LocalSitemapFile,
  SystemActivityLog,
} from '../types';

export {
  sampleProducts,
  sampleMerchantProducts,
  sampleSitemaps,
  sampleRankings,
  sampleUrlVerifications,
  sampleLocalSitemapFiles,
} from './sampleDataset';

/**
 * Clean Production Quota State (Full 200/day quota available)
 */
export const initialQuotaStatus: QuotaStatus = {
  dailyLimit: 200,
  usedToday: 0,
  queuedCount: 0,
  resetTimeUtc: '00:00:00 UTC (24h 00m remaining)',
  rateLimitPerMinute: 60,
  usedThisMinute: 0,
  pacingMode: 'SMART_PACED',
};

export const initialWailsRuntime: WailsRuntimeState = {
  version: 'v2.8.2',
  goVersion: 'go1.22.4',
  platform: 'darwin',
  arch: 'arm64',
  ipcLatencyMs: 1.2,
  activeGoroutines: 18,
  memoryAllocMb: 32.4,
  uptimeSeconds: 120,
  mode: 'DESKTOP_WAILS_BRIDGE',
};

/**
 * Local VPN Proxy Configuration
 * Routes all Google APIs via http://127.0.0.1:10081
 */
export const initialProxyConfig: ProxyConfig = {
  enabled: true,
  proxyUrl: 'http://127.0.0.1:10081',
  status: 'CONNECTED',
  latencyMs: 22,
  lastChecked: new Date().toISOString().replace('T', ' ').substring(0, 19),
  routedApis: [
    'Google Indexing API (https://indexing.googleapis.com:443)',
    'Google Search Console API (https://searchconsole.googleapis.com:443)',
    'Google Merchant Center Content API (https://shoppingcontent.googleapis.com:443)',
    'Google OAuth2 Token Service (https://oauth2.googleapis.com:443)',
  ],
};

/**
 * Google Service Account Credentials Template (GlobalChipMall)
 */
export const initialServiceAccount: ServiceAccountCredentials = {
  type: 'service_account',
  project_id: 'gcm-globalchipmall-seo-prod',
  private_key_id: '4f882a99c71b933c06e1074a2b919d38',
  client_email: 'google-indexing-bot@gcm-globalchipmall-seo-prod.iam.gserviceaccount.com',
  client_id: '109847291039485729102',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/indexing',
    'https://www.googleapis.com/auth/content',
    'https://www.googleapis.com/auth/webmasters',
  ],
  isConfigured: true,
  lastValidated: new Date().toISOString().replace('T', ' ').substring(0, 19),
};

/**
 * Clean State: 0 Products loaded initially
 * (Can be populated via MSSQL fetch, CSV/URL import, or sample template)
 */
export const initialProducts: ProductDetailPage[] = [];

/**
 * Clean State: 0 Merchant products loaded initially
 */
export const initialMerchantProducts: MerchantProductItem[] = [];

/**
 * Clean State: 0 Sitemaps registered initially
 */
export const initialSitemaps: SitemapItem[] = [];

/**
 * Clean State: 0 Search query rankings registered initially
 */
export const initialRankings: SearchQueryRanking[] = [];

/**
 * Clean State: 0 Indexing submissions today
 */
export const initialSubmissionRecords: IndexingSubmissionRecord[] = [];

/**
 * URL Verification Items (Clean state)
 */
export const initialUrlVerifications: UrlVerificationItem[] = [];

/**
 * Local Stock XML Sitemap Files (Clean state)
 */
export const initialLocalSitemapFiles: LocalSitemapFile[] = [];
export const initialLocalSitemaps: LocalSitemapFile[] = initialLocalSitemapFiles;

/**
 * Automation Rules Definitions (Ready for triggers)
 */
export const initialAutomationRules: AutomationRule[] = [
  {
    id: 'rule-01',
    name: '电子元器件缺货/到货即刻提交 Indexing',
    description: '当元器件由现货转为缺货或原厂原包到货入库时，优先调用 Google Indexing API 更新快照',
    triggerEvent: 'PRODUCT_OUT_OF_STOCK',
    actions: [
      {
        actionType: 'NOTIFY_GOOGLE_INDEXING_API',
        params: { priority: 'HIGH', notificationType: 'URL_UPDATED' },
      },
    ],
    enabled: true,
    executionCount: 0,
  },
  {
    id: 'rule-02',
    name: '美元实盘单价变动即刻同步 Merchant Center',
    description: '当海外原厂美元标价调整 > $0.05 触发实时 Content API 同步与 Indexing 更新',
    triggerEvent: 'PRODUCT_PRICE_CHANGED',
    actions: [
      {
        actionType: 'SYNC_MERCHANT_CENTER_API',
      },
      {
        actionType: 'NOTIFY_GOOGLE_INDEXING_API',
        params: { notificationType: 'URL_UPDATED' },
      },
    ],
    enabled: true,
    executionCount: 0,
  },
  {
    id: 'rule-03',
    name: '新上架元器件详情页自动推送收录',
    description: '当新上架 IC 芯片 SKU 审核通过且 HTTP 状态码为 200 时，刷新存量 xml 并通知 Googlebot',
    triggerEvent: 'NEW_PDP_PUBLISHED',
    actions: [
      {
        actionType: 'PING_SITEMAP_SEARCH_CONSOLE',
      },
      {
        actionType: 'NOTIFY_GOOGLE_INDEXING_API',
        params: { priority: 'HIGH' },
      },
    ],
    enabled: true,
    executionCount: 0,
  },
  {
    id: 'rule-04',
    name: '核心词 SERP 排名异动预警与诊断',
    description: '关键词排名发生负向波动时记录至分析报告并执行 SEO 审计',
    triggerEvent: 'SEARCH_RANKING_DROPPED',
    actions: [
      {
        actionType: 'TRIGGER_SEO_AUDIT',
      },
      {
        actionType: 'SEND_DESKTOP_NOTIFICATION',
      },
    ],
    enabled: false,
    executionCount: 0,
  },
];

/**
 * Microsoft SQL Server (MSSQL) Connection Configuration
 */
export const initialMssqlConfig: MssqlConnectionConfig = {
  host: '192.168.1.120',
  port: 1433,
  database: 'gcm_google_tool',
  user: 'sa',
  password: '•••GcmSql2022SecurePass•••',
  encrypt: true,
  trustServerCertificate: true,
  connectionTimeoutMs: 15000,
  maxOpenConns: 25,
  maxIdleConns: 10,
  connMaxLifetimeMinutes: 5,
  connectionStatus: 'CONNECTED',
  serverVersion: 'Microsoft SQL Server 2022 (RTM) - 16.0.1000.6',
  lastPingLatencyMs: 3,
  latencyMs: 3,
};

export const initialMssqlTableStats: MssqlTableStat[] = [
  {
    tableName: 'gcm_pdps',
    schema: 'dbo',
    rowCount: 0,
    sizeKb: 0,
    indexCount: 6,
    primaryKey: 'id (NVARCHAR(64))',
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
    description: 'GlobalChipMall 电子元器件产品详情页核心业务宽表 (SKU、价格、库存、SEO 指标)',
  },
  {
    tableName: 'gcm_sitemaps',
    schema: 'dbo',
    rowCount: 0,
    sizeKb: 0,
    indexCount: 3,
    primaryKey: 'id (NVARCHAR(64))',
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
    description: 'XML 站点地图登记表与 Google Search Console 提交历史',
  },
  {
    tableName: 'gcm_configs',
    schema: 'dbo',
    rowCount: 4,
    sizeKb: 32,
    indexCount: 2,
    primaryKey: 'config_key (NVARCHAR(64))',
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
    description: '系统全局持久化配置表 (Google Service Account 凭据、代理端口、调度策略)',
  },
  {
    tableName: 'gcm_perf_cache',
    schema: 'dbo',
    rowCount: 0,
    sizeKb: 0,
    indexCount: 2,
    primaryKey: 'cache_key (NVARCHAR(128))',
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
    description: '本地高性能 LRU 缓存热点元器件持久化镜像 (断电保护与快速热启动)',
  },
];

export const initialCacheStats: LocalPerformanceCacheStats = {
  totalEntries: 0,
  totalKeys: 0,
  memoryUsageKb: 0,
  maxMemoryMb: 64,
  hitCount: 0,
  missCount: 0,
  hitRatio: 100,
  evictionPolicy: 'LRU',
  ttlSeconds: 3600,
  keys: [],
};

export const initialLocalCacheStats = initialCacheStats;

export const initialSystemLogs: SystemActivityLog[] = [
  {
    id: 'log-init-1',
    timestamp: new Date().toTimeString().substring(0, 8),
    module: 'WailsIPC',
    level: 'info',
    message: 'Go 1.22 Runtime IPC 通道已就绪 (Wails v2.8.2 | Darwin/arm64)',
    details: '桌面端双向桥接启动，已连接至前端 Vue 3/TypeScript 界面',
  },
  {
    id: 'log-init-2',
    timestamp: new Date().toTimeString().substring(0, 8),
    module: 'Proxy',
    level: 'success',
    message: '本地 VPN 代理已挂载: http://127.0.0.1:10081 (Google API 流量已强制重定向)',
    details: '已接管 Google Indexing API, Search Console API 与 Merchant Center API',
  },
  {
    id: 'log-init-3',
    timestamp: new Date().toTimeString().substring(0, 8),
    module: 'WailsIPC',
    level: 'info',
    message: '系统数据已初始化为生产空态，随时可通过「从 MSSQL 拉取」或「批量导入」载入真实料号',
  },
];
