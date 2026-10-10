import React, { useState, useMemo } from 'react';
import {
  AnalysisResult,
  ScenarioType,
  StorageProfile,
  TemperatureReading,
  TestResult,
} from '../../types';
import { analyzeTemperatureSeries } from '../../engine/analysisEngine';
import {
  generateScenarioReadings,
  applyAnomalies,
} from '../../engine/simulationData';
import { runAllSelfTests } from '../../engine/testSuite';
import { TemperatureChart } from '../charts/TemperatureChart';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  Sliders,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TestLabTabProps {
  currentProfile: StorageProfile;
}

export const TestLabTab: React.FC<TestLabTabProps> = ({ currentProfile }) => {
  // Test Lab Local State
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('normal');
  const [labMinTemp, setLabMinTemp] = useState<number>(currentProfile.minTemp);
  const [labMaxTemp, setLabMaxTemp] = useState<number>(currentProfile.maxTemp);
  const [labInterval, setLabInterval] = useState<number>(10);

  // Injected Anomalies
  const [injectSpike, setInjectSpike] = useState(false);
  const [injectProlongedHeat, setInjectProlongedHeat] = useState(false);
  const [injectFreeze, setInjectFreeze] = useState(false);
  const [injectDataGap, setInjectDataGap] = useState(false);

  // Automated Unit Test Suite State
  const [testResults, setTestResults] = useState<TestResult[]>(() => runAllSelfTests());
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Input Validation for Lab Thresholds
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleMinChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      setValidationError('Minimum temperature must be a valid numeric value.');
      return;
    }
    if (num >= labMaxTemp) {
      setValidationError(`Minimum temperature (${num}°C) must be strictly less than maximum temperature (${labMaxTemp}°C).`);
    } else {
      setValidationError(null);
    }
    setLabMinTemp(num);
  };

  const handleMaxChange = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      setValidationError('Maximum temperature must be a valid numeric value.');
      return;
    }
    if (num <= labMinTemp) {
      setValidationError(`Maximum temperature (${num}°C) must be strictly greater than minimum temperature (${labMinTemp}°C).`);
    } else {
      setValidationError(null);
    }
    setLabMaxTemp(num);
  };

  // 1. Baseline analysis (pure scenario with standard limits)
  const baselineAnalysis: AnalysisResult = useMemo(() => {
    const { readings, scenarioName } = generateScenarioReadings(selectedScenario, labInterval);
    return analyzeTemperatureSeries(
      readings,
      {
        ...currentProfile,
        minTemp: currentProfile.minTemp,
        maxTemp: currentProfile.maxTemp,
      },
      `Baseline (${scenarioName})`,
      labInterval
    );
  }, [selectedScenario, labInterval, currentProfile]);

  // 2. Modified analysis (with lab custom limits and injected anomalies)
  const modifiedAnalysis: AnalysisResult = useMemo(() => {
    const { readings, scenarioName } = generateScenarioReadings(selectedScenario, labInterval);
    const alteredReadings = applyAnomalies(readings, {
      injectSpike,
      injectProlongedHeat,
      injectFreeze,
      injectDataGap,
    });

    const activeMin = isNaN(labMinTemp) ? currentProfile.minTemp : labMinTemp;
    const activeMax = isNaN(labMaxTemp) || labMaxTemp <= activeMin ? currentProfile.maxTemp : labMaxTemp;

    return analyzeTemperatureSeries(
      alteredReadings,
      {
        ...currentProfile,
        minTemp: activeMin,
        maxTemp: activeMax,
      },
      `Modified (${scenarioName})`,
      labInterval
    );
  }, [
    selectedScenario,
    labInterval,
    labMinTemp,
    labMaxTemp,
    injectSpike,
    injectProlongedHeat,
    injectFreeze,
    injectDataGap,
    currentProfile,
  ]);

  // Execute test suite on demand
  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runAllSelfTests();
      setTestResults(results);
      setIsRunningTests(false);
    }, 150);
  };

  const allPassed = testResults.every((t) => t.passed);
  const totalPassed = testResults.filter((t) => t.passed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Interactive Experimentation Bench</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Test Lab & Algorithmic Self-Test Suite
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Inject thermal anomalies, modify envelope boundaries in real time, inspect delta comparisons, and execute the automated deterministic test suite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLabMinTemp(currentProfile.minTemp);
                setLabMaxTemp(currentProfile.maxTemp);
                setLabInterval(10);
                setInjectSpike(false);
                setInjectProlongedHeat(false);
                setInjectFreeze(false);
                setInjectDataGap(false);
                setValidationError(null);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Parameters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scenario & Limits Config */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            1. Simulation Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Base Scenario Dataset:
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value as ScenarioType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-sans"
              >
                <option value="normal">Normal (Stable in-range baseline)</option>
                <option value="power_interruption">Power Interruption (Rise to 14.8°C)</option>
                <option value="door_left_open">Door Left Open (Spikes to 11.5°C & 9.1°C)</option>
                <option value="cooling_failure">Cooling Failure (Climbs to 19°C)</option>
                <option value="low_temperature">Freeze Fault (Drops to -3.0°C)</option>
                <option value="gradual_drift">Gradual Thermal Drift (+6°C over 16h)</option>
                <option value="missing_data">Telemetry Gap (2-hour missing block)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Min Limit (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={labMinTemp}
                  onChange={(e) => handleMinChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Max Limit (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={labMaxTemp}
                  onChange={(e) => handleMaxChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {validationError && (
              <div className="p-2 bg-rose-950/40 border border-rose-800/80 rounded text-[11px] text-rose-300">
                {validationError}
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Sampling Interval (Δt):
              </label>
              <select
                value={labInterval}
                onChange={(e) => setLabInterval(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value={1}>1 minute (High resolution)</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes (Standard default)</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes (Coarse resolution)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anomaly Injectors */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            2. Anomaly Injection Switches
          </h3>

          <p className="text-[11px] text-slate-400">
            Inject synthetic perturbations into the dataset to observe real-time algorithmic responses:
          </p>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-white block">Sudden Heat Spike</span>
                <span className="text-[11px] text-slate-400">+6.2°C burst for 20 minutes</span>
              </div>
              <input
                type="checkbox"
                checked={injectSpike}
                onChange={(e) => setInjectSpike(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-white block">Prolonged Heat Exposure</span>
                <span className="text-[11px] text-slate-400">+7.8°C thermal plateau for 3 hours</span>
              </div>
              <input
                type="checkbox"
                checked={injectProlongedHeat}
                onChange={(e) => setInjectProlongedHeat(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-white block">Deep Freeze Anomaly</span>
                <span className="text-[11px] text-slate-400">-6.5°C refrigeration plunge for 1 hour</span>
              </div>
              <input
                type="checkbox"
                checked={injectFreeze}
                onChange={(e) => setInjectFreeze(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-white block">Missing-Data Dropout</span>
                <span className="text-[11px] text-slate-400">60-minute null telemetry packet gap</span>
              </div>
              <input
                type="checkbox"
                checked={injectDataGap}
                onChange={(e) => setInjectDataGap(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Real-time Delta Comparison */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            3. Before vs After Delta Impact
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Excursion Count</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-slate-400">{baselineAnalysis.totalExcursionCount}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="font-mono font-bold text-white text-sm">
                    {modifiedAnalysis.totalExcursionCount}
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                  modifiedAnalysis.totalExcursionCount > baselineAnalysis.totalExcursionCount
                    ? 'bg-rose-950 text-rose-300'
                    : modifiedAnalysis.totalExcursionCount < baselineAnalysis.totalExcursionCount
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Δ {modifiedAnalysis.totalExcursionCount - baselineAnalysis.totalExcursionCount >= 0 ? '+' : ''}
                {modifiedAnalysis.totalExcursionCount - baselineAnalysis.totalExcursionCount}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Peak Temperature</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-slate-400">
                    {baselineAnalysis.highestTemperature !== null
                      ? `${baselineAnalysis.highestTemperature.toFixed(1)}°C`
                      : '--'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="font-mono font-bold text-white text-sm">
                    {modifiedAnalysis.highestTemperature !== null
                      ? `${modifiedAnalysis.highestTemperature.toFixed(1)}°C`
                      : '--'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Δ{' '}
                {modifiedAnalysis.highestTemperature !== null && baselineAnalysis.highestTemperature !== null
                  ? `${(modifiedAnalysis.highestTemperature - baselineAnalysis.highestTemperature > 0 ? '+' : '')}${(modifiedAnalysis.highestTemperature - baselineAnalysis.highestTemperature).toFixed(1)}°C`
                  : '0°C'}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Cumulative Dose</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-slate-400">
                    {baselineAnalysis.totalCumulativeDeviation.toFixed(1)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {modifiedAnalysis.totalCumulativeDeviation.toFixed(1)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">°C·min</span>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Data Quality Warnings</span>
                <span className="font-mono font-bold text-white text-sm">
                  {modifiedAnalysis.dataQualityWarnings.length} flagged
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  modifiedAnalysis.dataQualityWarnings.length > 0
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300'
                }`}
              >
                {modifiedAnalysis.dataQualityScore}% Valid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Modified Experiment Curve */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Real-Time Experimentation Thermal Response
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated against limits [{labMinTemp.toFixed(1)}°C, {labMaxTemp.toFixed(1)}°C] at Δt = {labInterval} min.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-300">
            Detected Events: <strong className="text-cyan-400">{modifiedAnalysis.events.length}</strong>
          </span>
        </div>

        <TemperatureChart
          readings={modifiedAnalysis.readings}
          minTemp={labMinTemp}
          maxTemp={labMaxTemp}
          events={modifiedAnalysis.events}
          height={320}
        />
      </div>

      {/* Automated Self-Test Verification Suite */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Deterministic Engine Verification Suite
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  allPassed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {allPassed ? 'ALL TESTS PASSED' : 'TEST FAILURES DETECTED'} ({totalPassed}/{testResults.length})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Authentic unit test runner evaluating the pure TypeScript analysis functions against mathematical fixtures. Not hardcoded; actual computed results.
            </p>
          </div>

          <button
            disabled={isRunningTests}
            onClick={handleRunTests}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunningTests ? 'Executing Tests...' : 'Re-Run Test Suite'}</span>
          </button>
        </div>

        {/* Test Cases List */}
        <div className="space-y-3">
          {testResults.map((test) => (
            <div
              key={test.testId}
              className={`p-3.5 rounded-lg border transition-all ${
                test.passed
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-800/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-mono text-xs font-bold text-slate-400">{test.testId}</span>
                  <span className="text-xs font-semibold text-white">{test.name}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{test.executionTimeMs} ms</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                      test.passed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {test.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{test.details}</p>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Expected:</span>
                  <span className="text-slate-300">{test.expected}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Actual Evaluated:</span>
                  <span className={test.passed ? 'text-emerald-400' : 'text-rose-400'}>
                    {test.actual}
                  </span>
                </div>
              </div>

              {/* Diagnostic logs */}
              {test.logs.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 font-sans">Trace:</span>
                  {test.logs.map((log, idx) => (
                    <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {log}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
