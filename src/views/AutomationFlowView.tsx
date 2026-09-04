import React, { useState } from 'react';
import {
  Workflow,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  ArrowRight,
  TrendingUp,
  Store,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { AutomationRule } from '../types';

interface AutomationFlowViewProps {
  rules: AutomationRule[];
  onToggleRule: (ruleId: string) => void;
  onExecuteRuleManual: (rule: AutomationRule) => void;
  isExecuting: boolean;
}

export const AutomationFlowView: React.FC<AutomationFlowViewProps> = ({
  rules,
  onToggleRule,
  onExecuteRuleManual,
  isExecuting,
}) => {
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);

  const actionableInsights = [
    {
      id: 'insight-1',
      type: 'OPPORTUNITY',
      title: '低垂果实关键词优化机会 (Low-Hanging Fruits)',
      content:
        '「DELL 27寸 2K 拓扑拓展坞显示器」当前位列 Google SERP 第 5.1 位，月搜索量达 18,200。页面详情具有完整的 Schema.org/Product 与 Merchant 现货状态，建议在详情页首屏补充 FAQ 结构化数据，预计可跃升至 Top 3。',
      impact: '高潜在增量 (+1,200 自然UV/月)',
      action: '一键优化详情页 Schema',
    },
    {
      id: 'insight-2',
      type: 'RISK_ALERT',
      title: '缺货商品 Googlebot 爬虫频次拦截',
      content:
        'Apple MacBook Pro 16 当前库存已耗尽。系统已自动调用 Indexing API 发起 URL_UPDATED，但应注意如果长时间缺货，系统将在 48 小时后根据规则降低其 Sitemap 优先级至 0.3，避免浪费 Googlebot 抓取预算 (Crawl Budget)。',
      impact: '防跳出率损耗与避免差评',
      action: '检查抓取预算分配',
    },
    {
      id: 'insight-3',
      type: 'SYNC_DISCOVERY',
      title: 'Merchant Center 政策违规拦截',
      content:
        '戴森 V12 主图由于包含促销文字被 Google Shopping 拒登。规则引擎已触发预警并尝试从详情页提取第二张无文字干净白底图重新生成 Feed，建议确认后一键推送。',
      impact: '恢复免费展示资格',
      action: '替换白底主图并重新同步',
    },
  ];

  return (
    <div id="view-automation" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Workflow className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SEO 自动化策略引擎与数据驱动决策中心
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            基于事件驱动 (Event-Driven) 架构，当商品价格、库存、Sitemap 发生变动或搜索排名异动时，自动流转触发 Google Indexing API、Merchant Center 同步与搜索引擎 Ping。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs flex items-center gap-1.5 font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            规则引擎：活跃监听中 (Active)
          </span>
        </div>
      </div>

      {/* Actionable Decision Insights (Data-Driven Recommendations) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            智能决策引擎诊断建议 (Actionable SEO Intelligence)
          </h2>
          <span className="text-[11px] text-slate-500">结合 PDP 访问、收录与商品数据分析</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionableInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border flex flex-col justify-between text-xs space-y-3 transition-all shadow-xs ${
                insight.type === 'RISK_ALERT'
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : insight.type === 'OPPORTUNITY'
                  ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      insight.type === 'RISK_ALERT'
                        ? 'bg-rose-100 text-rose-800'
                        : insight.type === 'OPPORTUNITY'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {insight.impact}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{insight.title}</h3>
                <p className="text-slate-600 leading-relaxed text-[11px]">{insight.content}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">规则自动建议</span>
                <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1">
                  {insight.action} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules Engine Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Workflow className="w-4 h-4 text-emerald-600" />
              自动化触发器与工作流规则库 ({rules.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              事件发生时自动通过 Go 后台并发执行任务链路，支持随时启停与手动试跑。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                rule.enabled
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    触发源: {rule.triggerEvent}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    已自动执行: <span className="text-slate-900 font-bold">{rule.executionCount}</span> 次
                  </span>
                </div>

                <p className="text-slate-500 leading-relaxed text-[11px]">{rule.description}</p>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400 text-[10px]">执行链路:</span>
                  {rule.actions.map((act, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200 flex items-center gap-1"
                    >
                      <span>{act.actionType}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Manual Trigger Test Button */}
                <button
                  onClick={() => onExecuteRuleManual(rule)}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 shadow-xs transition-colors"
                  title="立即模拟触发此自动化工作流"
                >
                  <Play className="w-3 h-3 text-blue-600" />
                  <span>手动触发试跑</span>
                </button>

                {/* Enable/Disable Toggle */}
                <button
                  onClick={() => onToggleRule(rule.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    rule.enabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  title={rule.enabled ? '点击禁用此规则' : '点击启用此规则'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
