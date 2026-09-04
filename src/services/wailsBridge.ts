import {
  IndexingSubmissionRecord,
  IndexingNotificationType,
  IndexingPriority,
  QuotaStatus,
  SystemActivityLog,
  ServiceAccountCredentials,
  ProductDetailPage,
  MerchantProductItem,
  ProxyConfig,
  UrlVerificationItem,
  LocalSitemapFile,
} from '../types';

type EventCallback = (data: any) => void;

class WailsBridgeService {
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor() {
    // Expose mock window.runtime and window.go if in browser
    if (typeof window !== 'undefined') {
      (window as any).runtime = {
        EventsOn: (eventName: string, callback: EventCallback) => this.on(eventName, callback),
        EventsEmit: (eventName: string, data: any) => this.emit(eventName, data),
        LogInfo: (msg: string) => console.log('[Go LogInfo]', msg),
        WindowMinimise: () => console.log('[Wails] Window Minimised'),
        WindowToggleMaximise: () => console.log('[Wails] Window Maximised/Restored'),
        Quit: () => console.log('[Wails] Quit called'),
      };
    }
  }

  public on(eventName: string, callback: EventCallback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  public emit(eventName: string, data: any) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }

  /**
   * Submit a URL to Google Indexing API
   */
  public async submitIndexingUrl(
    url: string,
    type: IndexingNotificationType,
    priority: IndexingPriority,
    currentQuota: QuotaStatus
  ): Promise<{ record: IndexingSubmissionRecord; newQuota: QuotaStatus }> {
    // Artificial Go IPC + HTTP/2 roundtrip latency
    const latency = Math.floor(Math.random() * 80) + 110;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const isQuotaExceeded = currentQuota.usedToday >= currentQuota.dailyLimit;

    if (isQuotaExceeded) {
      const record: IndexingSubmissionRecord = {
        id: `sub-${Date.now()}`,
        url,
        type,
        priority,
        status: 'RATE_LIMITED',
        httpStatus: 429,
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        latencyMs: latency,
        errorMessage: 'Quota exceeded (200 requests/day). Queued for 00:00 UTC window.',
        quotaConsumed: 0,
      };

      const newQuota: QuotaStatus = {
        ...currentQuota,
        queuedCount: currentQuota.queuedCount + 1,
      };

      this.emit('indexing:ratelimit', record);
      return { record, newQuota };
    }

    const record: IndexingSubmissionRecord = {
      id: `sub-${Date.now()}`,
      url,
      type,
      priority,
      status: 'SUCCESS',
      httpStatus: 200,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      latencyMs: latency,
      quotaConsumed: 1,
    };

    const newQuota: QuotaStatus = {
      ...currentQuota,
      usedToday: currentQuota.usedToday + 1,
      usedThisMinute: currentQuota.usedThisMinute + 1,
    };

    this.emit('indexing:success', record);
    return { record, newQuota };
  }

  /**
   * Batch submit multiple URLs
   */
  public async batchSubmitUrls(
    urls: { url: string; type: IndexingNotificationType; priority: IndexingPriority }[],
    currentQuota: QuotaStatus
  ): Promise<{ records: IndexingSubmissionRecord[]; newQuota: QuotaStatus }> {
    const records: IndexingSubmissionRecord[] = [];
    let updatedQuota = { ...currentQuota };

    for (const item of urls) {
      const { record, newQuota } = await this.submitIndexingUrl(
        item.url,
        item.type,
        item.priority,
        updatedQuota
      );
      records.push(record);
      updatedQuota = newQuota;
    }

    return { records, newQuota: updatedQuota };
  }

  /**
   * Sync single product to Google Merchant Center
   */
  public async syncMerchantProduct(
    product: ProductDetailPage,
    merchantItem?: MerchantProductItem
  ): Promise<{ updatedPdp: ProductDetailPage; updatedMerchant: MerchantProductItem }> {
    // Artificial latency
    await new Promise((resolve) => setTimeout(resolve, 200));

    const updatedPdp: ProductDetailPage = {
      ...product,
      merchantSyncStatus: 'SYNCED',
      merchantPrice: product.price,
      merchantInStock: product.inStock,
    };

    const updatedMerchant: MerchantProductItem = merchantItem
      ? {
          ...merchantItem,
          price: product.price,
          availability: product.inStock ? 'in_stock' : 'out_of_stock',
          approvalStatus: 'approved',
          hasPdpMismatch: false,
          mismatchDetails: undefined,
          lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          itemLevelIssues: merchantItem.itemLevelIssues.filter(
            (i) => i.code !== 'price_mismatch_warning' && i.code !== 'availability_mismatch'
          ),
        }
      : {
          id: `mc-${product.sku}`,
          sku: product.sku,
          title: product.name,
          link: product.url,
          imageLink: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          price: product.price,
          currency: product.currency,
          availability: product.inStock ? 'in_stock' : 'out_of_stock',
          condition: 'new',
          brand: product.name.split(' ')[0] || 'Generic',
          gtin: '69415659' + Math.floor(10000 + Math.random() * 90000),
          approvalStatus: 'approved',
          destinationStatuses: [
            { destination: 'Shopping ads', status: 'approved' },
            { destination: 'Free product listings', status: 'approved' },
          ],
          itemLevelIssues: [],
          lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          hasPdpMismatch: false,
        };

    return { updatedPdp, updatedMerchant };
  }

  /**
   * Ping Search Console Sitemap
   */
  public async pingSitemap(sitemapUrl: string): Promise<{ success: boolean; latencyMs: number }> {
    const latency = Math.floor(Math.random() * 120) + 160;
    await new Promise((resolve) => setTimeout(resolve, latency));
    return { success: true, latencyMs: latency };
  }

  /**
   * Parse & Validate Service Account JSON
   */
  public validateServiceAccountJson(jsonString: string): {
    valid: boolean;
    credentials?: ServiceAccountCredentials;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.client_email || !parsed.project_id || !parsed.private_key) {
        return {
          valid: false,
          error: '缺失关键字段：需包含 project_id, client_email 与 private_key',
        };
      }

      const credentials: ServiceAccountCredentials = {
        type: parsed.type || 'service_account',
        project_id: parsed.project_id,
        private_key_id: parsed.private_key_id || 'custom-key-id',
        client_email: parsed.client_email,
        client_id: parsed.client_id || 'custom-client-id',
        auth_uri: parsed.auth_uri || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/indexing',
          'https://www.googleapis.com/auth/content',
          'https://www.googleapis.com/auth/webmasters',
        ],
        isConfigured: true,
        lastValidated: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      return { valid: true, credentials };
    } catch (e: any) {
      return { valid: false, error: `JSON 语法解析失败: ${e.message}` };
    }
  }

  /**
   * Test MSSQL Database Connection (gcm_google_tool)
   */
  public async testMssqlConnection(config: {
    host: string;
    port: number;
    database: string;
    user: string;
  }): Promise<{
    success: boolean;
    latencyMs: number;
    serverVersion: string;
    databaseName: string;
    error?: string;
  }> {
    const latency = Math.floor(Math.random() * 8) + 3; // Ultra fast local socket / TDS protocol
    await new Promise((resolve) => setTimeout(resolve, latency + 120));

    if (!config.host || !config.database) {
      return {
        success: false,
        latencyMs: latency,
        serverVersion: '',
        databaseName: '',
        error: 'Host 与 Database 不能为空',
      };
    }

    return {
      success: true,
      latencyMs: latency,
      serverVersion: 'Microsoft SQL Server 2022 (RTM-CU12) - 16.0.4115.5 (X64) Developer Edition',
      databaseName: config.database || 'gcm_google_tool',
    };
  }

  /**
   * Run Database Schema Initialization / Migration
   */
  public async initMssqlSchema(databaseName: string = 'gcm_google_tool'): Promise<{
    success: boolean;
    tablesCreated: string[];
    indexesCreated: number;
    executionTimeMs: number;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 380));
    return {
      success: true,
      tablesCreated: ['gcm_configs', 'gcm_pdps', 'gcm_sitemaps', 'gcm_perf_cache'],
      indexesCreated: 11,
      executionTimeMs: 42,
    };
  }

  /**
   * Sync App Data into MSSQL Database
   */
  public async syncAllToMssql(
    pdpCount: number,
    sitemapCount: number,
    configCount: number
  ): Promise<{
    success: boolean;
    insertedPdps: number;
    insertedSitemaps: number;
    insertedConfigs: number;
    syncDurationMs: number;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 320));
    return {
      success: true,
      insertedPdps: pdpCount,
      insertedSitemaps: sitemapCount,
      insertedConfigs: configCount,
      syncDurationMs: 65,
    };
  }

  /**
   * Flush Local Performance Storage Cache
   */
  public async flushLocalCache(): Promise<{
    success: boolean;
    freedMemoryKb: number;
    clearedKeys: number;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 90));
    return {
      success: true,
      freedMemoryKb: 684,
      clearedKeys: 64,
    };
  }

  /**
   * Pre-warm Local Performance Cache from MSSQL
   */
  public async prewarmLocalCache(): Promise<{
    success: boolean;
    warmedKeys: number;
    allocatedMemoryKb: number;
    durationMs: number;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 210));
    return {
      success: true,
      warmedKeys: 64,
      allocatedMemoryKb: 684,
      durationMs: 38,
    };
  }

  /**
   * Test VPN Proxy Connection (Target: http://127.0.0.1:10081)
   * Handshakes with Google Indexing, Search Console, Merchant Center & OAuth2 Token
   */
  public async testProxyConnection(proxyUrl: string = 'http://127.0.0.1:10081'): Promise<{
    success: boolean;
    latencyMs: number;
    proxyUrl: string;
    checkedEndpoints: { endpoint: string; status: number; latencyMs: number }[];
    error?: string;
  }> {
    const latency = Math.floor(Math.random() * 15) + 18; // 18-33ms local proxy handshake
    await new Promise((resolve) => setTimeout(resolve, latency + 280));

    if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('socks5://')) {
      return {
        success: false,
        latencyMs: latency,
        proxyUrl,
        checkedEndpoints: [],
        error: '代理协议格式错误，必须为 http:// 或 socks5:// 开头',
      };
    }

    return {
      success: true,
      latencyMs: latency,
      proxyUrl,
      checkedEndpoints: [
        { endpoint: 'https://oauth2.googleapis.com/token', status: 200, latencyMs: latency + 12 },
        { endpoint: 'https://indexing.googleapis.com/$discovery/rest?version=v3', status: 200, latencyMs: latency + 8 },
        { endpoint: 'https://shoppingcontent.googleapis.com/content/v2.1', status: 200, latencyMs: latency + 15 },
        { endpoint: 'https://searchconsole.googleapis.com/v1/urlTesting', status: 200, latencyMs: latency + 10 },
      ],
    };
  }

  /**
   * Verify Electronic Component Product URL Access Status
   * Inspects HTTP Status Code (200, 301, 404), TLS 1.3 SSL, Canonical, and Schema.org
   */
  public async verifyProductUrl(item: UrlVerificationItem): Promise<UrlVerificationItem> {
    const latency = Math.floor(Math.random() * 40) + 95;
    await new Promise((resolve) => setTimeout(resolve, latency));

    // Simulated network probe for globalchipmall.com
    const isEol = item.url.includes('EOL') || item.url.includes('OBSOLETE');
    const isRedirect = item.url.includes('tray.html') || item.url.includes('-OLD');

    let httpStatus = 200;
    let indexingEligible = true;
    let remarks = 'HTTP 200 正常，响应快速且规范标记匹配';

    if (isEol) {
      httpStatus = 404;
      indexingEligible = false;
      remarks = 'HTTP 404 页面未找到，已自动拦截禁止推入 Indexing 队列';
    } else if (isRedirect) {
      httpStatus = 301;
      indexingEligible = false;
      remarks = 'HTTP 301 永久重定向，请直接向 Google 提交最终 Canonical 目标页面';
    }

    return {
      ...item,
      httpStatus,
      latencyMs: latency,
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      indexingEligible,
      remarks,
    };
  }

  /**
   * Batch Verify Product URLs Concurrently
   */
  public async batchVerifyProductUrls(
    items: UrlVerificationItem[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<UrlVerificationItem[]> {
    const results: UrlVerificationItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const verified = await this.verifyProductUrl(items[i]);
      results.push(verified);
      if (onProgress) {
        onProgress(i + 1, items.length);
      }
    }
    return results;
  }

  /**
   * Refresh Local Stock XML Sitemap <lastmod> Timestamps to Current UTC Time
   */
  public async refreshLocalSitemapXml(
    file: LocalSitemapFile,
    mode: 'ALL' | 'VERIFIED_ONLY' = 'ALL'
  ): Promise<{
    updatedFile: LocalSitemapFile;
    updatedCount: number;
    newTimestamp: string;
    diffSnippet: { before: string; after: string };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 260));

    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const oldTimestamp = file.currentLastmodTag;

    // Regex replace all <lastmod>...</lastmod> with nowIso
    const updatedXml = file.rawXml.replace(
      /<lastmod>[^<]+<\/lastmod>/g,
      `<lastmod>${nowIso}</lastmod>`
    );

    const updatedFile: LocalSitemapFile = {
      ...file,
      currentLastmodTag: nowIso,
      updatedLastmodTag: nowIso,
      rawXml: updatedXml,
      isRefreshed: true,
      lastmodRefreshedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    return {
      updatedFile,
      updatedCount: file.urlCount,
      newTimestamp: nowIso,
      diffSnippet: {
        before: `<lastmod>${oldTimestamp}</lastmod>`,
        after: `<lastmod>${nowIso}</lastmod>`,
      },
    };
  }

  /**
   * Save and Write Back Sitemap to Local Stock File on Disk via Go I/O
   */
  public async saveSitemapXmlToDisk(file: LocalSitemapFile): Promise<{
    success: boolean;
    filePath: string;
    bytesWritten: number;
    savedAt: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 140));
    return {
      success: true,
      filePath: file.filePath,
      bytesWritten: new Blob([file.rawXml]).size,
      savedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  }
}

export const wailsBridge = new WailsBridgeService();
