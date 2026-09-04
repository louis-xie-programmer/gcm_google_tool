import React, { useState } from 'react';
import {
  Store,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Image,
} from 'lucide-react';
import { MerchantProductItem, ProductDetailPage } from '../types';

interface MerchantSyncViewProps {
  merchantItems: MerchantProductItem[];
  products: ProductDetailPage[];
  onSyncAllMismatches: () => void;
  onSyncSingleItem: (item: MerchantProductItem) => void;
  isSyncing: boolean;
}

export const MerchantSyncView: React.FC<MerchantSyncViewProps> = ({
  merchantItems,
  products,
  onSyncAllMismatches,
  onSyncSingleItem,
  isSyncing,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'MISMATCH_ONLY' | 'DISAPPROVED'>('ALL');
  const [selectedItem, setSelectedItem] = useState<MerchantProductItem | null>(null);

  const mismatchedItems = merchantItems.filter((i) => i.hasPdpMismatch);
  const disapprovedItems = merchantItems.filter((i) => i.approvalStatus === 'disapproved');

  const filteredItems = merchantItems.filter((item) => {
    if (filterMode === 'MISMATCH_ONLY') return item.hasPdpMismatch;
    if (filterMode === 'DISAPPROVED') return item.approvalStatus === 'disapproved';
    return true;
  });

  return (
    <div id="view-merchant-sync" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Google Merchant Center (商家中心) 商品同步与搜索一致性
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            维护 Google Content API for Shopping v2.1 商品 Feed 数据。确保网页实盘价格、库存状态与 Google Shopping
            广告及自然免费展示 (Free Product Listings) 保持秒级一致，避免因价格不一致导致的商家账户封禁。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-sync-all-merchant"
            onClick={onSyncAllMismatches}
            disabled={isSyncing || mismatchedItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>一键同步所有差异 ({mismatchedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Discrepancy & Health KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>实盘价格与 Feed 价格一致率</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {Math.round(((merchantItems.length - mismatchedItems.length) / merchantItems.length) * 100)}%
          </div>
          <p className="text-[11px] text-slate-500">
            {mismatchedItems.length > 0 ? (
              <span className="text-rose-600 font-semibold">{mismatchedItems.length} 件商品存在价格或库存不同步</span>
            ) : (
              <span className="text-emerald-600 font-medium">全站商品标价完全一致</span>
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Free Listings 审批通过率</span>
            <Store className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {merchantItems.filter((i) => i.approvalStatus === 'approved').length} / {merchantItems.length}
          </div>
          <p className="text-[11px] text-slate-500">
            {disapprovedItems.length > 0 ? (
              <span className="text-red-600 font-semibold">{disapprovedItems.length} 件商品被拒登 (违规排查中)</span>
            ) : (
              <span className="text-slate-500">无违规商品</span>
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Googlebot 爬虫即时对齐</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">自动同步已开启</div>
          <p className="text-[11px] text-slate-500">
            PDP 数据变动自动通过 Go 后台发布至 Content API
          </p>
        </div>
      </div>

      {/* Discrepancy Action Banner if detected */}
      {mismatchedItems.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>严重风险预警：检测到网页实盘与 Merchant Center 数据存在脱节</span>
          </div>
          <div className="space-y-1.5 pl-6 text-rose-800">
            {mismatchedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded border border-rose-200 shadow-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">{item.sku}</span>: {item.mismatchDetails}
                </div>
                <button
                  onClick={() => onSyncSingleItem(item)}
                  disabled={isSyncing}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium transition-colors shadow-xs"
                >
                  对齐同步
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merchant Products Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Merchant Center 商品 Feed 列表 ({merchantItems.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              包含 GTIN/条形码、货币币种、Shopping 审批状态与最后同步时间。
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部商品
            </button>
            <button
              onClick={() => setFilterMode('MISMATCH_ONLY')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'MISMATCH_ONLY'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              仅显示数据差异 ({mismatchedItems.length})
            </button>
            <button
              onClick={() => setFilterMode('DISAPPROVED')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'DISAPPROVED'
                  ? 'bg-white text-red-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              仅显示驳回 ({disapprovedItems.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">SKU / Merchant 标题</th>
                <th className="py-2.5 px-3 font-semibold">Feed 价格</th>
                <th className="py-2.5 px-3 font-semibold">网页实盘价格</th>
                <th className="py-2.5 px-3 font-semibold">库存状态</th>
                <th className="py-2.5 px-3 font-semibold">Shopping 审批</th>
                <th className="py-2.5 px-3 font-semibold">最后同步时间</th>
                <th className="py-2.5 px-3 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredItems.map((item) => {
                const matchedPdp = products.find((p) => p.sku === item.sku);
                const hasPriceDiff = matchedPdp && matchedPdp.price !== item.price;
                const hasStockDiff = matchedPdp && (matchedPdp.inStock ? 'in_stock' : 'out_of_stock') !== item.availability;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="font-sans font-semibold text-slate-900 truncate max-w-sm">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="text-blue-600 font-semibold">{item.sku}</span>
                        <span>•</span>
                        <span>GTIN: {item.gtin}</span>
                        <span>•</span>
                        <span>{item.brand}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      ¥{item.price.toFixed(2)}
                    </td>

                    <td className="py-3 px-3">
                      {matchedPdp ? (
                        <div
                          className={`font-bold ${
                            hasPriceDiff ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          ¥{matchedPdp.price.toFixed(2)}
                          {hasPriceDiff && (
                            <span className="block text-[10px] font-normal text-rose-600 font-sans">
                              (存在 ¥{(item.price - matchedPdp.price).toFixed(2)} 差异)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {item.availability === 'in_stock' ? (
                        <span className="text-emerald-600 text-[10px] flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> 有货 (In Stock)
                        </span>
                      ) : (
                        <span className="text-rose-600 text-[10px] flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> 缺货 (Out of Stock)
                        </span>
                      )}
                      {hasStockDiff && (
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          网页已售罄！
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {item.approvalStatus === 'approved' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          通过 (Approved)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 border border-red-200 font-semibold">
                          拒登 (Disapproved)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {item.lastSyncTime}
                    </td>

                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`btn-sync-single-${item.sku}`}
                        onClick={() => onSyncSingleItem(item)}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[11px] font-medium transition-colors border border-slate-200 hover:border-emerald-300 shadow-xs"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>即时同步</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
