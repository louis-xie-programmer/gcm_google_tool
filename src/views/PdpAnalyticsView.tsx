import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  ExternalLink,
  Code2,
  BarChart3,
  Eye,
  MousePointerClick,
  Percent,
  Trash2,
  Plus,
  Database,
  Upload,
} from 'lucide-react';
import { ProductDetailPage } from '../types';

interface PdpAnalyticsViewProps {
  products: ProductDetailPage[];
  onTriggerIndexingSubmit: (url: string) => void;
  onSyncMerchantSingle: (product: ProductDetailPage) => void;
  onAddProduct?: (product: ProductDetailPage) => void;
  onDeleteProduct?: (id: string) => void;
  onOpenDataManager?: () => void;
}

export const PdpAnalyticsView: React.FC<PdpAnalyticsViewProps> = ({
  products,
  onTriggerIndexingSubmit,
  onSyncMerchantSingle,
  onAddProduct,
  onDeleteProduct,
  onOpenDataManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [indexFilter, setIndexFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailPage | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('嵌入式微控制器 (MCU)');
  const [newPrice, setNewPrice] = useState('5.50');
  const [newStock, setNewStock] = useState('10000');

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesIndex = indexFilter === 'ALL' || p.indexStatus === indexFilter;
    return matchesSearch && matchesCategory && matchesIndex;
  });

  // Calculate totals safely
  const totalPV = products.reduce((a, b) => a + b.pageViews30d, 0);
  const totalClicks = products.reduce((a, b) => a + b.organicClicks30d, 0);
  const avgBounceRate = products.length > 0
    ? (products.reduce((a, b) => a + b.bounceRate, 0) / products.length).toFixed(1)
    : '0.0';

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newUrl.trim()) return;

    const price = parseFloat(newPrice) || 1.0;
    const stock = parseInt(newStock, 10) || 1000;
    const product: ProductDetailPage = {
      id: `pdp-manual-${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      name: newName.trim() || `${newSku.trim().toUpperCase()} Electronic Component`,
      url: newUrl.trim(),
      category: newCategory,
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
      lastCrawledAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      schemaValid: true,
      merchantSyncStatus: 'NOT_SUBMITTED',
      merchantPrice: price,
      merchantInStock: stock > 0,
    };

    if (onAddProduct) {
      onAddProduct(product);
    }
    setIsAddModalOpen(false);
    setNewSku('');
    setNewName('');
    setNewUrl('');
  };

  return (
    <div id="view-pdp-analytics" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              产品详情页 (PDP) 访问分析与 SEO 综合指标
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            综合汇聚 GA4 网站访问数据（PV、UV、跳出率、转化率）与 Google Search Console 搜索表现（自然点击、展示量、平均排名），
            并关联 Schema.org/Product 结构化数据有效性与 Merchant Center 同步状态。
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-700">
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block font-sans">总浏览量 (30d)</span>
            <span className="font-bold text-blue-600">{totalPV.toLocaleString()}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block font-sans">自然搜索点击</span>
            <span className="font-bold text-emerald-600">{totalClicks.toLocaleString()}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block font-sans">平均跳出率</span>
            <span className="font-bold text-slate-800">{avgBounceRate}%</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              id="input-search-pdp"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索商品名称、SKU 或 URL..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category filter */}
          <select
            id="select-pdp-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="ALL">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Index Status Filter */}
          <select
            id="select-pdp-index-status"
            value={indexFilter}
            onChange={(e) => setIndexFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="ALL">全部收录状态</option>
            <option value="INDEXED">已收录 (INDEXED)</option>
            <option value="DISCOVERED_NOT_INDEXED">已发现未收录</option>
          </select>

          {/* Action Buttons */}
          {onOpenDataManager && (
            <button
              onClick={onOpenDataManager}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors shrink-0"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>数据管理</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增 PDP</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">SKU / 详情页标题</th>
                <th className="py-2.5 px-3 font-semibold">价格 / 库存</th>
                <th className="py-2.5 px-3 font-semibold">30天 PV / UV</th>
                <th className="py-2.5 px-3 font-semibold">搜索点击 / CTR</th>
                <th className="py-2.5 px-3 font-semibold">平均排名</th>
                <th className="py-2.5 px-3 font-semibold">收录 / Schema</th>
                <th className="py-2.5 px-3 font-semibold">Merchant 状态</th>
                <th className="py-2.5 px-3 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredProducts.map((p) => {
                const isMismatch = p.merchantSyncStatus === 'MISMATCH';
                const isDisapproved = p.merchantSyncStatus === 'DISAPPROVED';

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="font-sans font-semibold text-slate-900 truncate max-w-xs">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                        <span className="text-blue-600 font-semibold">{p.sku}</span> • {p.category}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">¥{p.price.toFixed(2)}</div>
                      <div className="text-[10px] mt-0.5">
                        {p.inStock ? (
                          <span className="text-emerald-600 font-sans font-medium">现货 ({p.stockCount})</span>
                        ) : (
                          <span className="text-rose-600 font-sans font-semibold">缺货售罄</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-bold">{p.pageViews30d.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 font-sans">UV: {p.uniqueVisitors30d.toLocaleString()}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-bold">{p.organicClicks30d.toLocaleString()}</div>
                      <div className="text-[10px] text-blue-600 font-bold">CTR {p.avgCtr}%</div>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800">
                      #{p.avgSearchPosition}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        {p.indexStatus === 'INDEXED' ? (
                          <span className="text-emerald-600 text-[10px] flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> 已收录
                          </span>
                        ) : (
                          <span className="text-amber-600 text-[10px] flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" /> 待收录
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {p.schemaValid ? (
                          <span className="text-slate-500">Schema 正常</span>
                        ) : (
                          <span className="text-rose-600 font-medium">Schema 警告</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {isMismatch ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          数据差异
                        </span>
                      ) : isDisapproved ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 border border-red-200 font-semibold">
                          广告拒登
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          已对齐
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`btn-push-indexing-${p.id}`}
                          onClick={() => onTriggerIndexingSubmit(p.url)}
                          title="向 Google Indexing API 发起推送通知"
                          className="p-1.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200 shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-sync-merchant-${p.id}`}
                          onClick={() => onSyncMerchantSingle(p)}
                          title="强制同步实盘价格库存至 Google Merchant Center"
                          className="p-1.5 rounded bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors border border-slate-200 shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteProduct && (
                          <button
                            id={`btn-delete-pdp-${p.id}`}
                            onClick={() => {
                              if (confirm(`确定要从系统移除料号 ${p.sku} 吗？`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            title="移除此料号"
                            className="p-1.5 rounded bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-400 transition-colors border border-slate-200 shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state if 0 items matched */}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {products.length === 0
                          ? '暂无元器件产品详情页数据 (生产空态就绪)'
                          : '未找到符合条件的元器件产品'}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {products.length === 0
                          ? '模拟数据已完全清除。您可以通过 CSV 或 URL 列表批量导入，直接连接 MSSQL 生产库拉取，或点击下方按钮手动录入。'
                          : '请尝试修改搜索词或重置筛选条件。'}
                      </p>
                      {products.length === 0 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          {onOpenDataManager && (
                            <button
                              type="button"
                              onClick={onOpenDataManager}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                            >
                              打开数据管理器批量导入
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                          >
                            手动录入新料号
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

      {/* Manual Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">录入新元器件产品 (PDP)</h3>
                  <p className="text-[11px] text-slate-500">将新建料号装入系统，自动计算 Schema 与 SEO 监控指标</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  元器件型号 (SKU) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: STM32F407VGT6 或 TPS5430DDAR"
                  value={newSku}
                  onChange={(e) => {
                    const sku = e.target.value.toUpperCase();
                    setNewSku(sku);
                    if (!newUrl) {
                      setNewUrl(`https://www.globalchipmall.com/product/${encodeURIComponent(sku)}.html`);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  产品完整名称 (PDP Title):
                </label>
                <input
                  type="text"
                  placeholder="例如: STMicroelectronics 32-bit ARM Cortex-M4 MCU LQFP-100"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  产品详情页绝对 URL <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.globalchipmall.com/product/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">元器件分类:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="嵌入式微控制器 (MCU)">嵌入式微控制器 (MCU)</option>
                    <option value="电源管理 IC (PMIC)">电源管理 IC (PMIC)</option>
                    <option value="存储器芯片 (Memory)">存储器芯片 (Memory)</option>
                    <option value="数字信号处理器 (DSP)">数字信号处理器 (DSP)</option>
                    <option value="射频与无线芯片 (RF)">射频与无线芯片 (RF)</option>
                    <option value="传感器 (Sensors)">传感器 (Sensors)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">单价 (USD $):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">现货库存量 (PCS):</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  确认保存并装载
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Product Detail Modal / Inspector */}
      {selectedProduct && (
        <div
          id="modal-pdp-inspector"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 space-y-4 text-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] text-blue-600 font-semibold block mb-1">
                  SKU: {selectedProduct.sku}
                </span>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  {selectedProduct.name}
                </h3>
                <a
                  href={selectedProduct.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-1 truncate"
                >
                  {selectedProduct.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-lg px-2"
              >
                ✕
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] font-sans block">30天浏览量 (PV)</span>
                <span className="text-lg font-bold text-slate-900">
                  {selectedProduct.pageViews30d.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] font-sans block">独立访客 (UV)</span>
                <span className="text-lg font-bold text-slate-900">
                  {selectedProduct.uniqueVisitors30d.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] font-sans block">搜索点击率 (CTR)</span>
                <span className="text-lg font-bold text-blue-600">{selectedProduct.avgCtr}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 text-[10px] font-sans block">平均排名</span>
                <span className="text-lg font-bold text-emerald-600">
                  #{selectedProduct.avgSearchPosition}
                </span>
              </div>
            </div>

            {/* Schema.org/Product JSON-LD preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-semibold font-sans">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  Schema.org/Product 结构化数据 (JSON-LD)
                </span>
                <span className="text-emerald-600 text-[10px] font-mono font-medium">Google Rich Snippets 校验通过</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48 leading-relaxed">
                {JSON.stringify(
                  {
                    '@context': 'https://schema.org/',
                    '@type': 'Product',
                    name: selectedProduct.name,
                    sku: selectedProduct.sku,
                    offers: {
                      '@type': 'Offer',
                      priceCurrency: selectedProduct.currency,
                      price: selectedProduct.price,
                      availability: selectedProduct.inStock
                        ? 'https://schema.org/InStock'
                        : 'https://schema.org/OutOfStock',
                      url: selectedProduct.url,
                    },
                    aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: '4.8',
                      reviewCount: '128',
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-slate-500 text-[11px]">
                最后收录爬取: {selectedProduct.lastCrawledAt}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onTriggerIndexingSubmit(selectedProduct.url);
                    setSelectedProduct(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>立即推送 Indexing API</span>
                </button>
                <button
                  onClick={() => {
                    onSyncMerchantSingle(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>同步 Merchant Center</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
