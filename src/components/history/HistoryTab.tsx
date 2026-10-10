import React, { useState } from 'react';
import { AnalysisResult, SavedAnalysisSnapshot } from '../../types';
import {
  History,
  Trash2,
  FolderOpen,
  Calendar,
  AlertTriangle,
  Clock,
  Layers,
  Thermometer,
  ShieldAlert,
  Flame,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface HistoryTabProps {
  history: SavedAnalysisSnapshot[];
  onLoadSnapshot: (snapshot: SavedAnalysisSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAllHistory: () => void;
  onSaveCurrentSnapshot: () => void;
  currentAnalysis: AnalysisResult;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  onLoadSnapshot,
  onDeleteSnapshot,
  onClearAllHistory,
  onSaveCurrentSnapshot,
  currentAnalysis,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeSnapshotDetail, setActiveSnapshotDetail] = useState<SavedAnalysisSnapshot | null>(
    null
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
              <History className="w-3.5 h-3.5" />
              <span>Browser-Local Snapshot Archive</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Excursion Analysis History
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Persisted in your client browser’s <code className="text-cyan-300">localStorage</code>. Store inspection snapshots for audit trail demonstration, comparative reviews, and historical record retrieval.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onSaveCurrentSnapshot}
              className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Save Current Snapshot</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* LocalStorage disclaimer */}
        <div className="mt-4 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Storage Boundary:</strong> Snapshot records reside strictly within this device’s local browser sandbox. They are not transmitted, backed up to cloud servers, or synchronized across workstations.
          </span>
        </div>
      </div>

      {/* Snapshot Cards List */}
      {history.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Saved Snapshots Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Click &ldquo;Save Current Snapshot&rdquo; to capture the state of your current temperature analysis, limits, and detected excursion metrics.
          </p>
          <button
            onClick={onSaveCurrentSnapshot}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Save Current Analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-white text-sm line-clamp-1" title={item.title}>
                    {item.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      item.totalEvents > 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {item.totalEvents} {item.totalEvents === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.savedAt}</span>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans text-[11px]">Profile:</span>
                    <span className="text-cyan-300 font-sans truncate max-w-[150px]">
                      {item.profileName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans text-[11px]">Limits:</span>
                    <span>
                      [{item.minTemp.toFixed(1)}°C, {item.maxTemp.toFixed(1)}°C]
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans text-[11px]">Extremes:</span>
                    <span>
                      {item.lowestTemp !== null ? `${item.lowestTemp.toFixed(1)}°` : '--'} /{' '}
                      <strong className="text-rose-400 font-bold">
                        {item.highestTemp !== null ? `${item.highestTemp.toFixed(1)}°C` : '--'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans text-[11px]">Thermal Dose:</span>
                    <span className="text-cyan-400">
                      {item.totalCumulativeDeviation.toFixed(1)} °C·min
                    </span>
                  </div>

                  {item.dataQualityWarningsCount > 0 && (
                    <div className="flex justify-between items-center text-amber-400 text-[10px] pt-1 border-t border-slate-800/80 font-sans">
                      <span>Integrity:</span>
                      <span>{item.dataQualityWarningsCount} warnings flagged</span>
                    </div>
                  )}
                </div>

                {item.notes && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-2">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onLoadSnapshot(item)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Restore Snapshot</span>
                </button>

                <button
                  onClick={() => onDeleteSnapshot(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-900"
                  title="Delete snapshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Clear All Demo History?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will irreversibly remove all {history.length} saved analysis snapshot(s) from your browser’s localStorage. Active unsaved data in the workspace will not be affected.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllHistory();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
