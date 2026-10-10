import React from 'react';
import {
  ThermometerSnowflake,
  Download,
  FileText,
  Menu,
  X,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { AnalysisResult } from '../../types';
import { exportAnalysisCSV, exportIncidentReport } from '../../engine/exportService';

interface NavbarProps {
  currentAnalysis: AnalysisResult;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAnalysis,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const latestReading = currentAnalysis.currentReading;
  const isOut =
    currentAnalysis.currentStatus === 'OUT_OF_RANGE_HIGH' ||
    currentAnalysis.currentStatus === 'OUT_OF_RANGE_LOW';
  const isWarn = currentAnalysis.currentStatus === 'WARNING';

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">TempGuard</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  v2.4 PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Intelligent Temperature Excursion Analysis System
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Telemetry Pill */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px]">
              {latestReading ? latestReading.timestamp : 'NO DATA'}
            </span>
          </div>

          <span className="w-px h-3 bg-slate-800"></span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Latest Sample:</span>
            <span
              className={`font-mono font-bold ${
                isOut
                  ? 'text-rose-400'
                  : isWarn
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }`}
            >
              {latestReading && latestReading.temperature !== null
                ? `${latestReading.temperature.toFixed(1)}°C`
                : 'OFFLINE'}
            </span>
          </div>

          <span className="w-px h-3 bg-slate-800"></span>

          <div className="flex items-center gap-1.5">
            {isOut ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                OUT OF RANGE
              </span>
            ) : isWarn ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                WARNING BUFFER
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                IN ENVELOPE
              </span>
            )}
          </div>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAnalysisCSV(currentAnalysis)}
            title="Download full CSV of temperature time-series and event tags"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors shadow-sm focus:outline-none"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            onClick={() => exportIncidentReport(currentAnalysis)}
            title="Download formal engineering incident investigation report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm focus:outline-none"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-950" />
            <span className="hidden sm:inline">Incident Report</span>
            <span className="sm:hidden">Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
