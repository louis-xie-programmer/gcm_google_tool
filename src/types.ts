/**
 * Data types for Google SEO & Merchant Automation PC Application (Wails v2 + Go)
 */

export type IndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED';

export type IndexingPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IndexingSubmissionRecord {
  id: string;
  url: string;
  type: IndexingNotificationType;
  priority: IndexingPriority;
  status: 'SUCCESS' | 'QUEUED' | 'RATE_LIMITED' | 'FAILED';
  httpStatus: number;
  submittedAt: string;
  latencyMs: number;
  errorMessage?: string;
  quotaConsumed: number;
}

export interface QuotaStatus {
  dailyLimit: number;
  usedToday: number;
  queuedCount: number;
  resetTimeUtc: string;
  rateLimitPerMinute: number;
  usedThisMinute: number;
  pacingMode: 'AGGRESSIVE' | 'SMART_PACED' | 'CONSERVATIVE';
}

export interface SitemapItem {
  id: string;
  sitemapUrl?: string;
  url?: string;
  type: 'sitemap_index' | 'pdp_sitemap' | 'category_sitemap' | 'news_sitemap' | 'PRODUCTS_XML';
  totalUrls: number;
  indexedCount?: number;
  indexedUrls?: number;
  submittedAt?: string;
  lastSubmittedAt?: string;
  lastGoogleCrawl?: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  issuesCount?: number;
  pingGoogleStatus?: string;
  lastPingGoogleAt?: string;
  lastResponseStatus?: number;
  autoPingEnabled?: boolean;
  warnings?: string[];
}

export interface ProductDetailPage {
  id: string;
  sku: string;
  name: string;
  title?: string;
  url: string;
  category: string;
  price: number;
  currency: string;
  inStock: boolean;
  stockCount: number;
  // Traffic metrics
  pageViews30d: number;
  uniqueVisitors30d: number;
  bounceRate: number; // percentage e.g. 42.5
  avgSessionDurationSec: number;
  organicClicks30d: number;
  organicImpressions30d: number;
  avgCtr: number; // percentage
  avgSearchPosition: number;
  conversions30d: number;
  conversionRate: number; // percentage
  // Google Indexing & Search status
  indexStatus: 'INDEXED' | 'DISCOVERED_NOT_INDEXED' | 'CRAWLED_NOT_INDEXED' | 'EXCLUDED';
  lastCrawledAt: string;
  schemaValid: boolean;
  schemaErrors?: string[];
  // Google Merchant Center sync status
  merchantSyncStatus: 'SYNCED' | 'MISMATCH' | 'DISAPPROVED' | 'NOT_SUBMITTED' | 'PRICE_MISMATCH' | 'STOCK_MISMATCH';
  merchantPrice?: number;
  merchantInStock?: boolean;
}

export interface MerchantProductItem {
  id: string;
  sku: string;
  title: string;
  link?: string;
  pdpUrl?: string;
  imageLink?: string;
  price?: number;
  pdpPrice?: number;
  merchantPrice?: number;
  salePrice?: number;
  currency: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  pdpInStock?: boolean;
  merchantInStock?: boolean;
  condition?: 'new' | 'refurbished' | 'used';
  brand?: string;
  category?: string;
  gtin?: string;
  approvalStatus: 'approved' | 'disapproved' | 'pending';
  destinationStatuses?: {
    destination: string; // Shopping, Free Listings, etc.
    status: 'approved' | 'disapproved' | 'pending';
  }[];
  itemLevelIssues?: {
    code: string;
    description: string;
    severity: 'error' | 'warning';
    attributeName?: string;
  }[];
  lastSyncTime?: string;
  lastSyncedAt?: string;
  hasPdpMismatch: boolean;
  mismatchReason?: string;
  mismatchDetails?: string;
  clicks30d?: number;
  impressions30d?: number;
}

export interface SearchQueryRanking {
  id: string;
  query: string;
  targetUrl: string;
  productName: string;
  currentPosition: number;
  previousPosition: number;
  positionChange?: number; // e.g. +2, -1
  clicks30d: number;
  impressions30d: number;
  ctr: number;
  monthlySearchVolume: number;
  serpFeatures: ('Product Snippet' | 'Merchant Badge' | 'Image Pack' | 'FAQ' | 'Popular Products' | 'In Stock Badge' | 'Datasheet Rich Snippet')[];
  intent: 'Transactional' | 'Commercial' | 'Informational' | 'Navigational';
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerEvent:
    | 'PRODUCT_PRICE_CHANGED'
    | 'PRODUCT_OUT_OF_STOCK'
    | 'PRODUCT_RESTOCKED'
    | 'NEW_PDP_PUBLISHED'
    | 'SEARCH_RANKING_DROPPED'
    | 'MERCHANT_DISAPPROVAL'
    | 'SITEMAP_UPDATED';
  eventTrigger?: string;
  actions: {
    actionType:
      | 'NOTIFY_GOOGLE_INDEXING_API'
      | 'SYNC_MERCHANT_CENTER_API'
      | 'PING_SITEMAP_SEARCH_CONSOLE'
      | 'TRIGGER_SEO_AUDIT'
      | 'SEND_DESKTOP_NOTIFICATION';
    params?: Record<string, any>;
  }[];
  enabled: boolean;
  executionCount: number;
  lastTriggeredAt?: string;
}

export interface SystemActivityLog {
  id: string;
  timestamp: string;
  module:
    | 'IndexingAPI'
    | 'MerchantCenter'
    | 'Sitemap'
    | 'RankTracker'
    | 'WailsIPC'
    | 'Automation'
    | 'Proxy'
    | 'MSSQL'
    | 'System';
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: string;
}

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  scopes: string[];
  isConfigured: boolean;
  lastValidated?: string;
}

export interface WailsRuntimeState {
  version: string;
  goVersion: string;
  platform: 'windows' | 'darwin' | 'linux';
  arch: string;
  ipcLatencyMs: number;
  activeGoroutines: number;
  memoryAllocMb: number;
  uptimeSeconds: number;
  mode: 'DESKTOP_WAILS_BRIDGE' | 'HYBRID_SIMULATION';
}

/**
 * MSSQL Database & Local Performance Storage Types for gcm_google_tool
 */
export interface MssqlConnectionConfig {
  host: string;
  port: number;
  database: string; // 'gcm_google_tool'
  user: string;
  password?: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  maxOpenConns: number;
  maxIdleConns: number;
  connMaxLifetimeMinutes: number;
  connectionTimeoutMs?: number;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  serverVersion: string;
  lastPingLatencyMs: number;
  latencyMs?: number;
  errorMessage?: string;
}

export interface MssqlTableStat {
  tableName: string;
  schema: string;
  rowCount: number;
  sizeKb: number;
  indexCount?: number;
  primaryKey: string;
  lastUpdated: string;
  description: string;
}

export interface LocalCacheKeyItem {
  key: string;
  category: 'CONFIG' | 'PDP' | 'SITEMAP' | 'SERP' | 'RATE_LIMIT';
  sizeBytes: number;
  ttlRemainingSec: number;
  hitCount: number;
  lastAccessed: string;
}

export interface LocalPerformanceCacheStats {
  totalEntries: number;
  totalKeys?: number;
  memoryUsageKb: number;
  maxMemoryMb: number;
  hitCount: number;
  missCount: number;
  hitRatio: number; // e.g. 94.8
  evictionPolicy: 'LRU' | 'LRU_TTL' | 'WRITE_THROUGH';
  defaultTtlSeconds?: number;
  ttlSeconds?: number;
  keys: LocalCacheKeyItem[];
}

export interface MssqlConfigRecord {
  configKey: string;
  configValue: string;
  category: 'GOOGLE_CREDENTIALS' | 'INDEXING_QUOTA' | 'MERCHANT_SYNC' | 'SYSTEM_CORE';
  isEncrypted: boolean;
  updatedAt: string;
}

export interface MssqlPdpRecord {
  sku: string;
  url: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  stockCount: number;
  organicClicks30d: number;
  organicImpressions30d: number;
  avgCtr: number;
  indexStatus: string;
  merchantSyncStatus: string;
  lastSyncedAt: string;
}

export interface MssqlSitemapRecord {
  sitemapUrl: string;
  sitemapType: string;
  totalUrls: number;
  indexedCount: number;
  lastCrawlTime: string;
  status: string;
  autoPing: boolean;
  updatedAt: string;
}

export interface MssqlPerfCacheRecord {
  cacheKey: string;
  cacheGroup: string;
  payloadJson: string;
  sizeBytes: number;
  expiresAt: string;
  hitCount: number;
  createdAt: string;
}

/**
 * Local VPN Proxy Configuration for Google APIs
 * Target: http://127.0.0.1:10081
 */
export interface ProxyConfig {
  enabled: boolean;
  proxyUrl: string; // e.g. 'http://127.0.0.1:10081'
  status: 'CONNECTED' | 'DISCONNECTED' | 'TESTING' | 'ERROR';
  latencyMs: number;
  lastChecked: string;
  routedApis: string[];
  errorMessage?: string;
}

/**
 * Electronic Component Product URL HTTP Health & Access Status Verification
 * For https://www.globalchipmall.com/
 */
export interface UrlVerificationItem {
  id: string;
  sku: string;
  mpn?: string; // Manufacturer Part Number
  brand?: string; // e.g. ST, TI, ADI, NXP
  url: string;
  name: string;
  httpStatus: number; // 200, 301, 404, 500
  latencyMs: number;
  verifiedAt: string;
  sslValid: boolean;
  canonicalMatch: boolean;
  canonicalUrl?: string;
  schemaValid: boolean;
  indexingEligible: boolean; // Safe to submit to Google Indexing (200 OK + canonical match)
  remarks?: string;
}

/**
 * Local Existing Sitemap XML File for timestamp refresh & maintenance
 */
export interface LocalSitemapFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSizeBytes?: number;
  fileSizeKb?: number;
  urlCount: number;
  lastModifiedOnDisk?: string;
  lastModified?: string;
  currentLastmodTag: string;
  updatedLastmodTag?: string;
  rawXml: string;
  isRefreshed: boolean;
  lastmodRefreshedAt?: string;
  sitemapUrl?: string;
}
