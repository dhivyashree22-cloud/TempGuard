import React, { useState } from 'react';
import {
  AnalysisResult,
  ExcursionClassification,
  ExcursionEvent,
  StorageProfile,
} from '../../types';
import { TemperatureChart } from '../charts/TemperatureChart';
import { StatCard } from '../common/StatCard';
import {
  Activity,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Flame,
  Snowflake,
  Filter,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  FileCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface AnalysisTabProps {
  analysis: AnalysisResult;
  selectedProfile: StorageProfile;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  analysis,
  selectedProfile,
  selectedEventId,
  onSelectEvent,
}) => {
  const [tableFilter, setTableFilter] = useState<'ALL' | 'EXCURSIONS' | 'IN_RANGE' | 'MISSING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const selectedEvent = analysis.events.find((e) => e.id === selectedEventId) || null;

  // Filter readings for the detailed log table
  const filteredReadings = analysis.readings.filter((r) => {
    if (selectedEventId && r.eventId === selectedEventId) return true;
    if (selectedEventId && !r.eventId) return false;

    if (tableFilter === 'EXCURSIONS') {
      return (
        r.classification === 'HIGH_EXCURSION' || r.classification === 'LOW_EXCURSION'
      );
    }
    if (tableFilter === 'IN_RANGE') {
      return (
        r.classification === 'IN_RANGE' ||
        r.classification === 'WARNING_HIGH' ||
        r.classification === 'WARNING_LOW'
      );
    }
    if (tableFilter === 'MISSING') {
      return r.classification === 'MISSING_DATA' || !r.isValid;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredReadings.length / pageSize) || 1;
  const paginatedReadings = filteredReadings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Excursion Analysis Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Detailed Thermal Time-Series Investigation
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspect individual excursion intervals, mathematical thermal exposure integrals, and complete sample logs.
          </p>
        </div>

        {/* Quick event selector pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Focus Event:</span>
          <button
            onClick={() => onSelectEvent(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedEventId === null
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            Show All
          </button>
          {analysis.events.map((evt) => (
            <button
              key={evt.id}
              onClick={() => onSelectEvent(evt.id === selectedEventId ? null : evt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                selectedEventId === evt.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {evt.id} ({evt.type})
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Excursions"
          value={analysis.totalExcursionCount}
          unit="events"
          icon={<AlertTriangle className="w-4 h-4" />}
          subtitle={`Across ${analysis.validReadingsCount} valid samples`}
          status={analysis.totalExcursionCount > 0 ? 'danger' : 'normal'}
        />

        <StatCard
          title="Highest Reading"
          value={analysis.highestTemperature !== null ? analysis.highestTemperature.toFixed(2) : '--'}
          unit="°C"
          icon={<Flame className="w-4 h-4" />}
          subtitle={`Max limit: ${selectedProfile.maxTemp.toFixed(1)}°C`}
          status={
            analysis.highestTemperature !== null && analysis.highestTemperature > selectedProfile.maxTemp
              ? 'danger'
              : 'info'
          }
        />

        <StatCard
          title="Lowest Reading"
          value={analysis.lowestTemperature !== null ? analysis.lowestTemperature.toFixed(2) : '--'}
          unit="°C"
          icon={<Snowflake className="w-4 h-4" />}
          subtitle={`Min limit: ${selectedProfile.minTemp.toFixed(1)}°C`}
          status={
            analysis.lowestTemperature !== null && analysis.lowestTemperature < selectedProfile.minTemp
              ? 'danger'
              : 'info'
          }
        />

        <StatCard
          title="Total Thermal Dose"
          value={analysis.totalCumulativeDeviation}
          unit="°C·min"
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle="Integrated thermal exposure area"
          status={analysis.totalCumulativeDeviation > 0 ? 'warning' : 'normal'}
        />
      </div>

      {/* Interactive Temperature Chart with Event Highlighting */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Interactive Thermal Curve & Focus Span
            </h2>
            <p className="text-xs text-slate-400">
              {selectedEvent
                ? `Highlighting incident ${selectedEvent.id} between ${selectedEvent.startTime} and ${selectedEvent.endTime}.`
                : 'Click any red or blue marker on the curve to inspect that specific excursion interval.'}
            </p>
          </div>

          {selectedEvent && (
            <button
              onClick={() => onSelectEvent(null)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium underline"
            >
              Clear Focus Selection
            </button>
          )}
        </div>

        <TemperatureChart
          readings={analysis.readings}
          minTemp={selectedProfile.minTemp}
          maxTemp={selectedProfile.maxTemp}
          events={analysis.events}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
          height={380}
        />
      </div>

      {/* Selected Event Deep Dive Panel (or Event Index Cards) */}
      {selectedEvent ? (
        <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-mono">{selectedEvent.id}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedEvent.type === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {selectedEvent.type === 'HIGH' ? 'High-Temperature Excursion' : 'Low-Temperature Excursion'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Observed from <span className="font-mono text-slate-200">{selectedEvent.startTime}</span> to{' '}
                  <span className="font-mono text-slate-200">{selectedEvent.endTime}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectEvent(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 self-start md:self-auto"
            >
              Close Event Details
            </button>
          </div>

          {/* Metric cards for the selected event */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Peak Reading</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {selectedEvent.peakTemperature.toFixed(2)} °C
              </div>
              <span className="text-[11px] text-rose-400 font-mono">
                +{selectedEvent.maxDeviation.toFixed(2)}°C beyond limit
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Exposure Window</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {selectedEvent.durationMinutes} min
              </div>
              <span className="text-[11px] text-slate-400">
                {selectedEvent.sampleCount} consecutive readings
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Thermal Dose</span>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                {selectedEvent.cumulativeDeviation.toFixed(1)} °C·min
              </div>
              <span className="text-[11px] text-slate-400">Σ (ΔT × interval)</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Data Integrity</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {selectedEvent.dataQualityWarnings.length === 0 ? 'Verified' : 'Flagged'}
              </div>
              <span className="text-[11px] text-slate-400">
                {selectedEvent.dataQualityWarnings.length} uncertainty alerts
              </span>
            </div>
          </div>

          {/* Plain Language Explanation */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-lg space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Info className="w-4 h-4" />
              <span>Plain-Language Incident Explanation:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              {selectedEvent.plainLanguageSummary}
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>
                <strong className="text-slate-300">Duration Formulation:</strong> {selectedEvent.durationExplanation}
              </div>
              <div>
                <strong className="text-slate-300">Cumulative Integral:</strong> {selectedEvent.cumulativeExplanation}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Overview of all detected events */
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Plain-Language Summaries for Detected Events
          </h3>

          {analysis.events.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No excursions detected in current dataset. All readings complied with operational limits.
            </p>
          ) : (
            <div className="space-y-3 mt-3">
              {analysis.events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt.id)}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 rounded-lg transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{evt.id}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          evt.type === 'HIGH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-xs text-slate-400">
                        {evt.startTime} to {evt.endTime} ({evt.durationMinutes} min)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {evt.plainLanguageSummary}
                    </p>
                  </div>

                  <button className="px-2.5 py-1 text-xs text-cyan-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-medium shrink-0 self-start md:self-auto flex items-center gap-1">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raw Temperature Readings Table with Filter Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Recorded Readings & Classifications Log
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredReadings.length} of {analysis.readings.length} total recorded samples.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => {
                setTableFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                tableFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              All ({analysis.readings.length})
            </button>
            <button
              onClick={() => {
                setTableFilter('EXCURSIONS');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                tableFilter === 'EXCURSIONS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Excursions Only
            </button>
            <button
              onClick={() => {
                setTableFilter('IN_RANGE');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                tableFilter === 'IN_RANGE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              In Envelope
            </button>
            <button
              onClick={() => {
                setTableFilter('MISSING');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                tableFilter === 'MISSING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Missing / Gaps
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Sample ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">Target Envelope</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Deviation</th>
                <th className="py-2.5 px-3">Assoc. Event</th>
                <th className="py-2.5 px-3">Telemetry Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedReadings.map((r) => {
                const isOutHigh = r.classification === 'HIGH_EXCURSION';
                const isOutLow = r.classification === 'LOW_EXCURSION';
                const isWarn = r.classification.startsWith('WARNING');
                const isMissing = r.classification === 'MISSING_DATA';

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      r.eventId === selectedEventId ? 'bg-amber-950/25' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-400">{r.id}</td>
                    <td className="py-2.5 px-3 text-slate-200">{r.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold">
                      {r.temperature !== null ? (
                        <span
                          className={
                            isOutHigh
                              ? 'text-rose-400'
                              : isOutLow
                              ? 'text-blue-400'
                              : isWarn
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {r.temperature.toFixed(2)} °C
                        </span>
                      ) : (
                        <span className="text-slate-500 italic font-sans">NULL / OFFLINE</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      [{selectedProfile.minTemp.toFixed(1)}, {selectedProfile.maxTemp.toFixed(1)}]°C
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold uppercase ${
                          isOutHigh
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : isOutLow
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : isWarn
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : isMissing
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {r.classification.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {r.deviation > 0 ? (
                        <span className="text-rose-400 font-semibold">+{r.deviation.toFixed(2)}°C</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.eventId ? (
                        <button
                          onClick={() => onSelectEvent(r.eventId!)}
                          className="text-cyan-300 hover:underline font-semibold"
                        >
                          {r.eventId}
                        </button>
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
                      {r.qualityNote || 'Nominal packet integrity'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
