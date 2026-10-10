import React from 'react';
import {
  AnalysisResult,
  ExcursionEvent,
  ScenarioType,
  StorageProfile,
} from '../../types';
import { TemperatureChart } from '../charts/TemperatureChart';
import { StatCard } from '../common/StatCard';
import {
  Thermometer,
  AlertTriangle,
  Clock,
  Flame,
  Snowflake,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface OverviewTabProps {
  analysis: AnalysisResult;
  selectedProfile: StorageProfile;
  onSelectEvent: (eventId: string | null) => void;
  selectedEventId: string | null;
  onLoadScenario: (scenario: ScenarioType) => void;
  onGenerateRandom: () => void;
  onResetDemo: () => void;
  onNavigateToAnalysis: (eventId?: string) => void;
  onSaveSnapshot: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analysis,
  selectedProfile,
  onSelectEvent,
  selectedEventId,
  onLoadScenario,
  onGenerateRandom,
  onResetDemo,
  onNavigateToAnalysis,
  onSaveSnapshot,
}) => {
  const latest = analysis.currentReading;
  const isOutHigh = analysis.currentStatus === 'OUT_OF_RANGE_HIGH';
  const isOutLow = analysis.currentStatus === 'OUT_OF_RANGE_LOW';
  const isWarn = analysis.currentStatus === 'WARNING';
  const isOut = isOutHigh || isOutLow;

  const getStatusBadge = () => {
    if (isOutHigh) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          Out of Range (High Excursion)
        </span>
      );
    }
    if (isOutLow) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/50">
          <Snowflake className="w-4 h-4 text-blue-400" />
          Out of Range (Low Excursion)
        </span>
      );
    }
    if (isWarn) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Warning Buffer Zone
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        Normal Storage Operation
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile & Environmental Header Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Active Profile
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                Envelope: {selectedProfile.minTemp.toFixed(1)}°C to {selectedProfile.maxTemp.toFixed(1)}°C
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                Warning buffer: ±{selectedProfile.warningBuffer.toFixed(1)}°C
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {selectedProfile.name}
            </h1>

            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {selectedProfile.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start lg:items-end gap-3 shrink-0">
            <div className="text-right sm:text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                Current Operational State
              </div>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>

            <button
              onClick={onSaveSnapshot}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Save current analysis as a snapshot in browser localStorage"
            >
              <span>Save Snapshot</span>
            </button>
          </div>
        </div>

        {/* Profile disclaimer callout */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>{selectedProfile.disclaimer}</span>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Simulated Temperature"
          value={latest && latest.temperature !== null ? latest.temperature.toFixed(2) : '--'}
          unit="°C"
          icon={<Thermometer className="w-5 h-5" />}
          subtitle={
            latest
              ? `Sampled at ${latest.timestamp} (Simulated)`
              : 'Sensor offline'
          }
          status={isOut ? 'danger' : isWarn ? 'warning' : 'normal'}
          tooltip="Most recent simulated reading in the time series"
        />

        <StatCard
          title="Excursion Events"
          value={analysis.totalExcursionCount}
          unit="events"
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle={
            analysis.totalExcursionCount === 0
              ? 'No threshold breaches detected'
              : `${analysis.events.filter((e) => e.type === 'HIGH').length} High, ${
                  analysis.events.filter((e) => e.type === 'LOW').length
                } Low`
          }
          status={analysis.totalExcursionCount > 0 ? 'danger' : 'normal'}
          tooltip="Total continuous periods exceeding configured limits"
        />

        <StatCard
          title="Longest Excursion"
          value={analysis.longestExcursionMinutes}
          unit="min"
          icon={<Clock className="w-5 h-5" />}
          subtitle={
            analysis.longestExcursionMinutes > 0
              ? `~${(analysis.longestExcursionMinutes / 60).toFixed(1)} hours continuous exposure`
              : 'Zero excursion duration'
          }
          status={analysis.longestExcursionMinutes > 60 ? 'danger' : analysis.longestExcursionMinutes > 0 ? 'warning' : 'normal'}
          tooltip="Longest single out-of-range event in minutes"
        />

        <StatCard
          title="Highest Recorded"
          value={analysis.highestTemperature !== null ? analysis.highestTemperature.toFixed(2) : '--'}
          unit="°C"
          icon={<Flame className="w-5 h-5" />}
          subtitle={`Lowest: ${
            analysis.lowestTemperature !== null ? analysis.lowestTemperature.toFixed(2) + '°C' : '--'
          }`}
          status={
            analysis.highestTemperature !== null &&
            analysis.highestTemperature > selectedProfile.maxTemp
              ? 'danger'
              : 'info'
          }
          tooltip="Extreme temperature values recorded across the series"
        />
      </div>

      {/* Scenario Control Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              Simulated Data Scenarios
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic test patterns demonstrating various real-world cold-chain disruption modes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onGenerateRandom}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Generate new scenario with controlled random thermal variance"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Generate New Dataset
            </button>

            <button
              onClick={onResetDemo}
              className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Reset simulation to default clean baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>
        </div>

        {/* Scenario Switch Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            onClick={() => onLoadScenario('normal')}
            className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
              analysis.scenarioName.includes('Normal')
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Normal Storage
            </div>
            <div className="text-[11px] text-slate-400">Steady 3.6°C to 5.4°C envelope</div>
          </button>

          <button
            onClick={() => onLoadScenario('power_interruption')}
            className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
              analysis.scenarioName.includes('Power')
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Power Outage
            </div>
            <div className="text-[11px] text-slate-400">Prolonged rise to 14.8°C & recovery</div>
          </button>

          <button
            onClick={() => onLoadScenario('door_left_open')}
            className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
              analysis.scenarioName.includes('Door')
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Door Left Open
            </div>
            <div className="text-[11px] text-slate-400">Two separate high spikes (11.5°C & 9.1°C)</div>
          </button>

          <button
            onClick={() => onLoadScenario('cooling_failure')}
            className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
              analysis.scenarioName.includes('Failure')
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Cooling Failure
            </div>
            <div className="text-[11px] text-slate-400">Compressor fault climbing to 19°C</div>
          </button>

          <button
            onClick={() => onLoadScenario('low_temperature')}
            className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
              analysis.scenarioName.includes('Low-Temperature') || analysis.scenarioName.includes('Freeze')
                ? 'bg-blue-950/40 border-blue-500/60 text-blue-200'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Sub-Zero Freeze
            </div>
            <div className="text-[11px] text-slate-400">Thermostat fault freezing to -3.0°C</div>
          </button>
        </div>
      </div>

      {/* Main Temperature vs Time Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Thermal Time-Series & Threshold Envelope
            </h2>
            <p className="text-xs text-slate-400">
              Upper limit ({selectedProfile.maxTemp.toFixed(1)}°C) and lower limit ({selectedProfile.minTemp.toFixed(1)}°C) bounds. Click excursion dots or event rows to inspect.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToAnalysis()}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 focus:outline-none"
            >
              <span>Open Detailed Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* Detected Excursions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Detected Excursion Events ({analysis.events.length})
            </h3>
            <p className="text-xs text-slate-400">
              Consecutive out-of-range periods grouped and integrated over time intervals.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Total Exposure: <strong className="text-cyan-300">{analysis.totalCumulativeDeviation} °C·min</strong>
          </span>
        </div>

        {analysis.events.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-lg">
            <ShieldCheck className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No Temperature Excursions Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              All {analysis.validReadingsCount} recorded samples strictly satisfied the {selectedProfile.minTemp}°C to {selectedProfile.maxTemp}°C operating boundaries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Interval (Start – End)</th>
                  <th className="py-2.5 px-3">Est. Duration</th>
                  <th className="py-2.5 px-3">Peak Temp</th>
                  <th className="py-2.5 px-3">Max Breach</th>
                  <th className="py-2.5 px-3">Cumulative Exposure</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {analysis.events.map((evt) => {
                  const isSelected = selectedEventId === evt.id;
                  const isHigh = evt.type === 'HIGH';

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => onSelectEvent(isSelected ? null : evt.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-950/30 text-amber-200'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isHigh ? 'bg-rose-400' : 'bg-blue-400'
                            }`}
                          ></span>
                          {evt.id}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                            isHigh
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {isHigh ? 'HIGH EXCURSION' : 'LOW EXCURSION'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        <div>{evt.startTime}</div>
                        <div className="text-slate-500 text-[10px]">to {evt.endTime}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-200">
                        {evt.durationMinutes} min
                        {evt.isDurationEstimated && (
                          <span className="ml-1 text-[10px] text-amber-400" title="Estimated based on sample interval">
                            *
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        {evt.peakTemperature.toFixed(2)}°C
                      </td>

                      <td className="py-3 px-3 text-rose-400 font-semibold">
                        +{evt.maxDeviation.toFixed(2)}°C
                      </td>

                      <td className="py-3 px-3 text-cyan-300 font-semibold">
                        {evt.cumulativeDeviation.toFixed(1)} °C·min
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToAnalysis(evt.id);
                          }}
                          className="px-2 py-1 text-[11px] font-sans font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <span>Analyze</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
