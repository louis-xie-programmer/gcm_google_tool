import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  X,
  Trash2,
  Minimize2,
  Maximize2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import { SystemActivityLog } from '../types';

interface LiveLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SystemActivityLog[];
  onClearLogs: () => void;
}

export const LiveLogDrawer: React.FC<LiveLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    return moduleFilter === 'ALL' || log.module === moduleFilter;
  });

  return (
    <aside
      id="live-log-drawer"
      aria-label="实时 Go 运行日志与 IPC 通信控制台"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 shadow-2xl backdrop-blur transition-all flex flex-col ${
        isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Header */}
      <div className="h-9 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs select-none shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono font-bold text-slate-200">
            Go 运行日志与 Wails IPC 通信控制台
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            {logs.length} 条记录
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Module filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-mono text-slate-300 focus:outline-none"
          >
            <option value="ALL">全部模块</option>
            <option value="IndexingAPI">Indexing API</option>
            <option value="MerchantCenter">Merchant Center</option>
            <option value="Sitemap">Sitemap XML</option>
            <option value="WailsIPC">Wails IPC</option>
            <option value="Automation">Automation 引擎</option>
          </select>

          <button
            onClick={onClearLogs}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="清空控制台日志"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title={isExpanded ? '收起高度' : '展开最大高度'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
            title="关闭控制台抽屉"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1 select-text"
      >
        {filteredLogs.map((log) => {
          let levelColor = 'text-slate-300';
          let LevelIcon = Info;
          if (log.level === 'success') {
            levelColor = 'text-emerald-400';
            LevelIcon = CheckCircle2;
          } else if (log.level === 'warn') {
            levelColor = 'text-amber-400';
            LevelIcon = AlertTriangle;
          } else if (log.level === 'error') {
            levelColor = 'text-rose-400';
            LevelIcon = AlertTriangle;
          }

          return (
            <div
              key={log.id}
              className="flex items-start gap-2 hover:bg-slate-900/60 p-1 rounded transition-colors"
            >
              <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                {log.module}
              </span>
              <span className={`flex-1 ${levelColor} leading-relaxed`}>
                {log.message}
                {log.details && (
                  <span className="text-slate-500 block text-[10px] pl-2">{log.details}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
