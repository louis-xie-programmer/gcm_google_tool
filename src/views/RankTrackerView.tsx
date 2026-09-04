import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  Tag,
  CheckCircle2,
  Filter,
  BarChart2,
  Target,
} from 'lucide-react';
import { SearchQueryRanking } from '../types';

interface RankTrackerViewProps {
  rankings: SearchQueryRanking[];
  onTriggerOptimization: (ranking: SearchQueryRanking) => void;
}

export const RankTrackerView: React.FC<RankTrackerViewProps> = ({
  rankings,
  onTriggerOptimization,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState('ALL');

  const filteredRankings = rankings.filter((r) => {
    const matchesSearch =
      r.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIntent = intentFilter === 'ALL' || r.intent === intentFilter;
    return matchesSearch && matchesIntent;
  });

  const top3Count = rankings.filter((r) => r.currentPosition <= 3).length;
  const top10Count = rankings.filter((r) => r.currentPosition <= 10).length;
  const totalImpressions = rankings.reduce((a, b) => a + b.impressions30d, 0);
  const totalClicks = rankings.reduce((a, b) => a + b.clicks30d, 0);
  const overallCtr = ((totalClicks / totalImpressions) * 100).toFixed(2);

  return (
    <div id="view-rank-tracker" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Google 搜索监控与 SERP 关键词排名跟踪
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            基于 Google Search Console 搜索表现数据，持续追踪商品核心交易词位次、点击率 (CTR) 及 Google 购物 Rich Snippet 展示资格。
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-700">
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block font-sans">Top 3 霸榜词</span>
            <span className="font-bold text-emerald-600">{top3Count} 个</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block font-sans">Top 10 首页词</span>
            <span className="font-bold text-blue-600">{top10Count} 个</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block font-sans">平均 CTR</span>
            <span className="font-bold text-indigo-600">{overallCtr}%</span>
          </div>
        </div>
      </div>

      {/* Rank Distribution Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-sans">
            <span>排名 1 - 3 位 (黄金展位)</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{top3Count} 词</div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(top3Count / rankings.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-sans">
            <span>排名 4 - 10 位 (首页中下部)</span>
            <BarChart2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {rankings.filter((r) => r.currentPosition > 3 && r.currentPosition <= 10).length} 词
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${
                  (rankings.filter((r) => r.currentPosition > 3 && r.currentPosition <= 10).length /
                    rankings.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-sans">
            <span>总曝光展示量 (30d)</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(totalImpressions / 1000).toFixed(1)}k
          </div>
          <p className="text-[10px] text-slate-500 font-sans">Google 自然搜索曝光量</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-sans">
            <span>总搜索点击产生</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {(totalClicks / 1000).toFixed(1)}k
          </div>
          <p className="text-[10px] text-slate-500 font-sans">导入 PDP 详情页的自然流量</p>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              搜索关键词排名列表 ({filteredRankings.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              包含搜索词意图、目标 PDP 绑定与富媒体徽章状态。
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                id="input-search-ranking"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索关键词或商品..."
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">全部意图</option>
              <option value="Transactional">Transactional (交易意图)</option>
              <option value="Commercial">Commercial (商业调研)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-[11px] bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">搜索关键词 (Query)</th>
                <th className="py-2.5 px-3 font-semibold">目标商品详情页</th>
                <th className="py-2.5 px-3 font-semibold">当前位次</th>
                <th className="py-2.5 px-3 font-semibold">位次变动</th>
                <th className="py-2.5 px-3 font-semibold">月搜量</th>
                <th className="py-2.5 px-3 font-semibold">点击量 / CTR</th>
                <th className="py-2.5 px-3 font-semibold">SERP 特征 / 徽章</th>
                <th className="py-2.5 px-3 font-semibold text-right">优化操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredRankings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-sans font-semibold text-slate-900">{item.query}</div>
                    <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                      意图: {item.intent}
                    </div>
                  </td>

                  <td className="py-3 px-3 max-w-xs truncate font-sans">
                    <div className="text-slate-800 font-medium truncate">{item.productName}</div>
                    <a
                      href={item.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 truncate font-mono"
                    >
                      {item.targetUrl} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-sm font-bold text-slate-900">#{item.currentPosition}</span>
                  </td>

                  <td className="py-3 px-3">
                    {item.positionChange > 0 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />+{item.positionChange}
                      </span>
                    ) : item.positionChange < 0 ? (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {item.positionChange}
                      </span>
                    ) : (
                      <span className="text-slate-400">持平</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-700">
                    {item.monthlySearchVolume.toLocaleString()}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-bold">{item.clicks30d.toLocaleString()}</div>
                    <div className="text-[10px] text-blue-600 font-bold">CTR {item.ctr}%</div>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {item.serpFeatures.map((f, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      id={`btn-optimize-query-${item.id}`}
                      onClick={() => onTriggerOptimization(item)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-medium transition-colors border border-slate-200 hover:border-blue-300 shadow-xs"
                    >
                      诊断优化
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
