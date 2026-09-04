import {
  ProductDetailPage,
  MerchantProductItem,
  SitemapItem,
  SearchQueryRanking,
  IndexingSubmissionRecord,
  AutomationRule,
  QuotaStatus,
  ServiceAccountCredentials,
  MssqlConnectionConfig,
  MssqlTableStat,
  LocalPerformanceCacheStats,
  ProxyConfig,
  UrlVerificationItem,
  LocalSitemapFile,
  SystemActivityLog,
} from '../types';
import {
  sampleProducts,
  sampleMerchantProducts,
  sampleSitemaps,
  sampleRankings,
  sampleUrlVerifications,
  sampleLocalSitemapFiles,
} from '../data/sampleDataset';

const STORAGE_KEYS = {
  PRODUCTS: 'gcm_products',
  MERCHANT: 'gcm_merchant_items',
  SITEMAPS: 'gcm_sitemaps',
  RANKINGS: 'gcm_rankings',
  SUBMISSIONS: 'gcm_submissions',
  RULES: 'gcm_rules',
  QUOTA: 'gcm_quota',
  SERVICE_ACCOUNT: 'gcm_service_account',
  PROXY: 'gcm_proxy_config',
  MSSQL_CONFIG: 'gcm_mssql_config',
  LOCAL_SITEMAPS: 'gcm_local_sitemaps',
  URL_VERIFICATIONS: 'gcm_url_verifications',
  LOGS: 'gcm_logs',
};

export class StorageService {
  public static loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return fallback;
      return JSON.parse(stored) as T;
    } catch (e) {
      console.warn(`[StorageService] Failed to load ${key}:`, e);
      return fallback;
    }
  }

  public static saveToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`[StorageService] Failed to save ${key}:`, e);
    }
  }

  public static clearAllStorage(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }

  public static exportFullBackup(payload: Record<string, any>): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcm_google_tool_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Parse Product list from CSV or text lines
   * Supports:
   * 1. Comma / Tab separated: SKU, Name, URL, Category, Price, Stock
   * 2. Pure URL lines: https://www.globalchipmall.com/product/XYZ.html
   */
  public static parseProductImportText(text: string): ProductDetailPage[] {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const parsed: ProductDetailPage[] = [];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip header if line looks like header
      if (
        i === 0 &&
        (line.toLowerCase().includes('sku') ||
          line.toLowerCase().includes('product') ||
          line.toLowerCase().includes('url'))
      ) {
        continue;
      }

      // Check if pure URL
      if (line.startsWith('http://') || line.startsWith('https://')) {
        const url = line.trim();
        // Extract SKU from URL (e.g. /product/STM32F407VGT6.html -> STM32F407VGT6)
        const match = url.match(/\/([^\/?#]+?)(?:\.html|\/)?$/i);
        const sku = match ? match[1].toUpperCase() : `SKU-${Date.now()}-${i + 1}`;
        parsed.push({
          id: `pdp-imp-${Date.now()}-${i + 1}`,
          sku,
          name: `${sku} Electronic Component (GlobalChipMall)`,
          url,
          category: '电子元器件与集成电路 (IC)',
          price: 1.0,
          currency: 'USD',
          inStock: true,
          stockCount: 1000,
          pageViews30d: 0,
          uniqueVisitors30d: 0,
          bounceRate: 0,
          avgSessionDurationSec: 0,
          organicClicks30d: 0,
          organicImpressions30d: 0,
          avgCtr: 0,
          avgSearchPosition: 0,
          conversions30d: 0,
          conversionRate: 0,
          indexStatus: 'DISCOVERED_NOT_INDEXED',
          lastCrawledAt: now,
          schemaValid: true,
          merchantSyncStatus: 'NOT_SUBMITTED',
          merchantPrice: 1.0,
          merchantInStock: true,
        });
        continue;
      }

      // Delimited (comma or tab)
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map((p) => p.trim());

      if (parts.length >= 2) {
        const sku = parts[0];
        const name = parts[1] || sku;
        const url =
          parts[2] ||
          `https://www.globalchipmall.com/product/${encodeURIComponent(sku)}.html`;
        const category = parts[3] || '电子元器件 (IC)';
        const price = parseFloat(parts[4]) || 1.0;
        const stock = parseInt(parts[5], 10) || 500;

        parsed.push({
          id: `pdp-imp-${Date.now()}-${i + 1}`,
          sku,
          name,
          url,
          category,
          price,
          currency: 'USD',
          inStock: stock > 0,
          stockCount: stock,
          pageViews30d: 0,
          uniqueVisitors30d: 0,
          bounceRate: 0,
          avgSessionDurationSec: 0,
          organicClicks30d: 0,
          organicImpressions30d: 0,
          avgCtr: 0,
          avgSearchPosition: 0,
          conversions30d: 0,
          conversionRate: 0,
          indexStatus: 'DISCOVERED_NOT_INDEXED',
          lastCrawledAt: now,
          schemaValid: true,
          merchantSyncStatus: 'NOT_SUBMITTED',
          merchantPrice: price,
          merchantInStock: stock > 0,
        });
      }
    }

    return parsed;
  }

  /**
   * Parse an XML Sitemap string into LocalSitemapFile and extract UrlVerificationItems
   */
  public static parseSitemapXml(
    fileName: string,
    rawXml: string
  ): { file: LocalSitemapFile; items: UrlVerificationItem[] } {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawXml, 'text/xml');

    const urlNodes = xmlDoc.getElementsByTagName('url');
    const items: UrlVerificationItem[] = [];
    let initialLastmod = new Date().toISOString();

    for (let i = 0; i < urlNodes.length; i++) {
      const locNode = urlNodes[i].getElementsByTagName('loc')[0];
      const lastmodNode = urlNodes[i].getElementsByTagName('lastmod')[0];
      const url = locNode?.textContent?.trim() || '';

      if (url) {
        const match = url.match(/\/([^\/?#]+?)(?:\.html|\/)?$/i);
        const sku = match ? match[1].toUpperCase() : `SKU-${i + 1}`;
        if (lastmodNode?.textContent) {
          initialLastmod = lastmodNode.textContent.trim();
        }

        items.push({
          id: `verify-xml-${Date.now()}-${i + 1}`,
          sku,
          name: `${sku} 规格详情页`,
          url,
          httpStatus: 200,
          latencyMs: 85,
          sslValid: true,
          canonicalMatch: true,
          schemaValid: true,
          verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          indexingEligible: true,
          remarks: '来自本地 XML 站点地图导入，待执行并发验证',
        });
      }
    }

    const file: LocalSitemapFile = {
      id: `sm-local-${Date.now()}`,
      fileName,
      filePath: `/var/www/globalchipmall/sitemaps/${fileName}`,
      fileSizeKb: Math.max(1, Math.round(new Blob([rawXml]).size / 1024)),
      urlCount: urlNodes.length,
      currentLastmodTag: initialLastmod,
      isRefreshed: false,
      sitemapUrl: `https://www.globalchipmall.com/${fileName}`,
      rawXml,
    };

    return { file, items };
  }

  /**
   * Generate an XML Sitemap string from product detail pages
   */
  public static generateXmlFromProducts(
    products: ProductDetailPage[],
    fileName: string = 'sitemap_products.xml'
  ): LocalSitemapFile {
    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    products.forEach((p) => {
      xmlLines.push('  <url>');
      xmlLines.push(`    <loc>${p.url}</loc>`);
      xmlLines.push(`    <lastmod>${nowIso}</lastmod>`);
      xmlLines.push('    <changefreq>daily</changefreq>');
      xmlLines.push('    <priority>0.9</priority>');
      xmlLines.push('  </url>');
    });

    xmlLines.push('</urlset>');
    const rawXml = xmlLines.join('\n');

    return {
      id: `sm-gen-${Date.now()}`,
      fileName,
      filePath: `/var/www/globalchipmall/sitemaps/${fileName}`,
      fileSizeKb: Math.max(1, Math.round(new Blob([rawXml]).size / 1024)),
      urlCount: products.length,
      currentLastmodTag: nowIso,
      isRefreshed: true,
      sitemapUrl: `https://www.globalchipmall.com/${fileName}`,
      rawXml,
    };
  }
}
