import { AnalysisResult } from '../types';

/**
 * TempGuard Native Browser File Export Service
 * Downloads CSV and Plain-Text/Markdown Incident Reports directly in browser.
 */

function triggerBrowserDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download CSV of time-series readings and classifications
 */
export function exportAnalysisCSV(result: AnalysisResult): void {
  const headers = [
    'Timestamp',
    'Temperature (°C)',
    'Configured Min (°C)',
    'Configured Max (°C)',
    'Classification',
    'Deviation (°C)',
    'Associated Event ID',
    'Valid Data Status',
    'Quality Notes',
  ];

  const rows = result.readings.map((r) => [
    `"${r.timestamp}"`,
    r.temperature !== null ? r.temperature.toFixed(2) : 'N/A',
    result.profile.minTemp.toFixed(2),
    result.profile.maxTemp.toFixed(2),
    `"${r.classification}"`,
    r.deviation > 0 ? r.deviation.toFixed(2) : '0.00',
    r.eventId ? `"${r.eventId}"` : 'None',
    r.isValid ? 'VALID' : 'INVALID / MISSING',
    r.qualityNote ? `"${r.qualityNote.replace(/"/g, '""')}"` : 'OK',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const filename = `tempguard-readings-${result.profile.id}-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.csv`;

  triggerBrowserDownload(filename, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Generate and download detailed engineering incident report
 */
export function exportIncidentReport(result: AnalysisResult): void {
  const timestamp = new Date().toLocaleString();
  const sep = '='.repeat(80);
  const subSep = '-'.repeat(80);

  let report = `${sep}\n`;
  report += `TEMPGUARD INTELLIGENT TEMPERATURE EXCURSION INCIDENT REPORT\n`;
  report += `SIMULATED DATA DEMONSTRATION — NO PHYSICAL SENSOR CONNECTED\n`;
  report += `${sep}\n\n`;

  report += `1. REPORT METADATA & PROFILE SPECIFICATION\n`;
  report += `${subSep}\n`;
  report += `Generated On:       ${timestamp}\n`;
  report += `Storage Profile:    ${result.profile.name}\n`;
  report += `Profile Category:   ${result.profile.category}\n`;
  report += `Configured Limits:  Min: ${result.profile.minTemp.toFixed(1)}°C  |  Max: ${result.profile.maxTemp.toFixed(1)}°C\n`;
  report += `Warning Buffer:     ±${result.profile.warningBuffer.toFixed(1)}°C\n`;
  report += `Scenario Loaded:    ${result.scenarioName}\n`;
  report += `Sampling Interval:  ${result.nominalSamplingIntervalMinutes} minutes (nominal)\n\n`;

  report += `2. EXECUTIVE SUMMARY & STATISTICAL METRICS\n`;
  report += `${subSep}\n`;
  report += `Current Status:               ${result.currentStatus}\n`;
  report += `Total Recorded Samples:       ${result.totalReadingsCount}\n`;
  report += `Valid Sensor Readings:        ${result.validReadingsCount}\n`;
  report += `Missing / Dropped Readings:   ${result.missingReadingsCount}\n`;
  report += `Telemetry Gaps (>15m):        ${result.dataGapsCount}\n`;
  report += `Data Completeness Score:      ${result.dataQualityScore}%\n`;
  report += `Highest Recorded Temp:        ${result.highestTemperature !== null ? result.highestTemperature.toFixed(2) + '°C' : 'N/A'}\n`;
  report += `Lowest Recorded Temp:         ${result.lowestTemperature !== null ? result.lowestTemperature.toFixed(2) + '°C' : 'N/A'}\n`;
  report += `Average Recorded Temp:        ${result.averageTemperature !== null ? result.averageTemperature.toFixed(2) + '°C' : 'N/A'}\n`;
  report += `Total Excursion Events:       ${result.totalExcursionCount}\n`;
  report += `Longest Single Excursion:     ${result.longestExcursionMinutes} minutes\n`;
  report += `Total Cumulative Thermal Dose:${result.totalCumulativeDeviation} °C·min\n\n`;

  report += `3. DATA INTEGRITY & SAMPLING ASSUMPTIONS\n`;
  report += `${subSep}\n`;
  report += `Assumption Statement:\n`;
  report += `${result.intervalAssumptionNote}\n`;
  if (result.dataQualityWarnings.length > 0) {
    report += `\nIdentified Data Quality Warnings:\n`;
    result.dataQualityWarnings.forEach((w, idx) => {
      report += ` [!] Warning ${idx + 1}: ${w}\n`;
    });
  } else {
    report += `\nData Quality Status: Nominal. No telemetry dropouts or anomalous packet intervals detected.\n`;
  }
  report += `\n`;

  report += `4. DETAILED EVENT-BY-EVENT EXCURSION LOG\n`;
  report += `${subSep}\n`;
  if (result.events.length === 0) {
    report += `No temperature excursion events detected. All valid readings remained strictly within the [${result.profile.minTemp.toFixed(1)}°C, ${result.profile.maxTemp.toFixed(1)}°C] envelope.\n\n`;
  } else {
    result.events.forEach((evt) => {
      report += `EVENT ID: ${evt.id} [${evt.type === 'HIGH' ? 'HIGH TEMPERATURE BREACH' : 'LOW TEMPERATURE DEFICIT'}]\n`;
      report += `  - Event Sequence:        #${evt.eventNumber} of ${result.events.length}\n`;
      report += `  - Start Timestamp:       ${evt.startTime}\n`;
      report += `  - End Timestamp:         ${evt.endTime}\n`;
      report += `  - Duration Window:       ${evt.durationMinutes} minutes ${evt.isDurationEstimated ? '(ESTIMATED)' : '(MEASURED)'}\n`;
      report += `  - Affected Sample Count: ${evt.sampleCount} readings\n`;
      report += `  - Extreme Reading:       ${evt.peakTemperature.toFixed(2)}°C\n`;
      report += `  - Maximum Deviation:     ${evt.maxDeviation.toFixed(2)}°C ${evt.type === 'HIGH' ? 'above max' : 'below min'}\n`;
      report += `  - Cumulative Deviation:  ${evt.cumulativeDeviation.toFixed(2)} °C·min\n`;
      report += `  - Calculation Note:      ${evt.cumulativeExplanation}\n`;
      report += `  - Duration Assumption:   ${evt.durationExplanation}\n`;
      if (evt.dataQualityWarnings.length > 0) {
        report += `  - Event Quality Alerts:  ${evt.dataQualityWarnings.join('; ')}\n`;
      }
      report += `  - Summary Narrative:     ${evt.plainLanguageSummary}\n\n`;
    });
  }

  report += `5. METHODOLOGY & MATHEMATICAL EQUATIONS\n`;
  report += `${subSep}\n`;
  report += `Range Check:\n`;
  report += `  Reading T_i is in excursion if:  T_i > T_max (High)  OR  T_i < T_min (Low).\n`;
  report += `  Boundary equality (T_i == T_min or T_i == T_max) is evaluated as strictly IN RANGE.\n\n`;
  report += `High-Temperature Cumulative Deviation (Thermal Overdose):\n`;
  report += `  E_high = Σ max(0, T_i - T_max) × Δt_i   [Units: °C·min]\n\n`;
  report += `Low-Temperature Cumulative Deviation (Thermal Underdose):\n`;
  report += `  E_low  = Σ max(0, T_min - T_i) × Δt_i   [Units: °C·min]\n\n`;
  report += `Interpretation of Cumulative Deviation:\n`;
  report += `  Cumulative deviation quantifies the integrated area of temperature exposure outside the\n`;
  report += `  configured tolerance envelope. It is NOT an empirical product-damage score or chemical shelf-life\n`;
  report += `  prediction. Biochemical degradation rates are non-linear and governed by Arrhenius kinetics,\n`;
  report += `  activation energies, and product-specific stability specifications.\n\n`;

  report += `6. REGULATORY & RESPONSIBLE-USE DISCLAIMERS\n`;
  report += `${subSep}\n`;
  report += `[1] SIMULATED DATA ONLY:\n`;
  report += `    This document is generated by TempGuard, a synthetic educational and engineering\n`;
  report += `    demonstrator. No physical temperature probe, RTD, thermistor, or data logger is\n`;
  report += `    connected to this system. The readings are purely simulated numerical time series.\n\n`;
  report += `[2] NOT A PRODUCT-SAFETY DETERMINATION:\n`;
  report += `    This report DOES NOT certify, classify, or verify the clinical efficacy, biological potency,\n`;
  report += `    chemical integrity, or safety of any pharmaceutical product, vaccine, biological reagent, or\n`;
  report += `    foodstuff. Decisions regarding product quarantine, release, or disposal must be made\n`;
  report += `    exclusively by authorized quality assurance personnel in consultation with official manufacturer\n`;
  report += `    stability budgets and validated temperature-monitoring devices.\n\n`;
  report += `[3] CAUSE-DIAGNOSTIC LIMITATION:\n`;
  report += `    Detecting a thermal excursion does not establish its root mechanical cause. Time-series data alone\n`;
  report += `    cannot isolate whether temperature changes stemmed from power outages, refrigerant leaks,\n`;
  report += `    defrost timer malfunction, door gasket seal degradation, or user error.\n\n`;
  report += `[4] TELEMETRY GAPS & UNCERTAINTY:\n`;
  report += `    An absence of recorded excursion events during telemetry interruptions or data gaps does not\n`;
  report += `    guarantee that storage conditions remained within tolerance during unmonitored intervals.\n\n`;
  report += `${sep}\n`;
  report += `END OF INCIDENT REPORT — TEMPGUARD DEMONSTRATION SYSTEM\n`;
  report += `${sep}\n`;

  const filename = `tempguard-incident-report-${result.profile.id}-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`;

  triggerBrowserDownload(filename, report, 'text/plain;charset=utf-8;');
}
