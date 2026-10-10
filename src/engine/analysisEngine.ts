import {
  AnalysisResult,
  ExcursionClassification,
  ExcursionEvent,
  StorageProfile,
  TemperatureReading,
} from '../types';

/**
 * TempGuard Pure TypeScript Temperature Analysis Engine
 * Deterministic, transparent mathematical evaluation of thermal time-series.
 */

export function analyzeTemperatureSeries(
  inputReadings: TemperatureReading[],
  profile: StorageProfile,
  scenarioName: string = 'Simulated Series',
  nominalIntervalMinutes: number = 10
): AnalysisResult {
  // 1. Sort readings chronologically
  const sorted = [...inputReadings].sort((a, b) => a.timestampMs - b.timestampMs);

  const dataQualityWarnings: string[] = [];
  let missingCount = 0;
  let validCount = 0;
  let gapsCount = 0;

  // 2. Classify individual readings and detect intervals/gaps
  const classifiedReadings: TemperatureReading[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;

    // Detect timestamp gaps exceeding 1.5x nominal sampling interval
    if (prev) {
      const deltaMinutes = (cur.timestampMs - prev.timestampMs) / (1000 * 60);
      if (deltaMinutes > nominalIntervalMinutes * 1.5) {
        gapsCount++;
        const gapDurationStr = `${Math.round(deltaMinutes)} minutes`;
        const warning = `Telemetry gap detected: ${gapDurationStr} interval between ${prev.timestamp} and ${cur.timestamp}. Thermal conditions during this period are unmonitored and unknown.`;
        if (!dataQualityWarnings.includes(warning)) {
          dataQualityWarnings.push(warning);
        }
      }
    }

    if (cur.temperature === null || isNaN(cur.temperature) || !cur.isValid) {
      missingCount++;
      classifiedReadings.push({
        ...cur,
        isValid: false,
        classification: 'MISSING_DATA',
        deviation: 0,
        qualityNote: cur.qualityNote || 'Null / Missing reading telemetry loss',
      });
      continue;
    }

    validCount++;
    const temp = cur.temperature;
    let classification: ExcursionClassification = 'IN_RANGE';
    let deviation = 0;

    if (temp < profile.minTemp) {
      classification = 'LOW_EXCURSION';
      deviation = parseFloat((profile.minTemp - temp).toFixed(2));
    } else if (temp > profile.maxTemp) {
      classification = 'HIGH_EXCURSION';
      deviation = parseFloat((temp - profile.maxTemp).toFixed(2));
    } else if (profile.warningBuffer > 0 && temp >= profile.maxTemp - profile.warningBuffer) {
      classification = 'WARNING_HIGH';
      deviation = 0;
    } else if (profile.warningBuffer > 0 && temp <= profile.minTemp + profile.warningBuffer) {
      classification = 'WARNING_LOW';
      deviation = 0;
    } else {
      classification = 'IN_RANGE';
      deviation = 0;
    }

    classifiedReadings.push({
      ...cur,
      isValid: true,
      classification,
      deviation,
    });
  }

  // Calculate interval to next sample for duration weighting
  for (let i = 0; i < classifiedReadings.length; i++) {
    const cur = classifiedReadings[i];
    const next = i < classifiedReadings.length - 1 ? classifiedReadings[i + 1] : null;
    if (next) {
      cur.intervalToNextMinutes = Math.max(
        1,
        Math.round((next.timestampMs - cur.timestampMs) / (1000 * 60))
      );
    } else {
      cur.intervalToNextMinutes = nominalIntervalMinutes;
    }
  }

  // 3. Event Grouping: group consecutive out-of-range readings of same type
  const events: ExcursionEvent[] = [];
  let currentGroup: TemperatureReading[] = [];
  let currentType: 'HIGH' | 'LOW' | null = null;
  let eventCounter = 1;

  function closeCurrentEvent() {
    if (currentGroup.length === 0 || !currentType) return;

    const eventId = `EVT-${String(eventCounter).padStart(3, '0')}`;
    const group = [...currentGroup];
    const type = currentType;

    // Associate reading with eventId
    group.forEach((r) => {
      r.eventId = eventId;
    });

    const firstReading = group[0];
    const lastReading = group[group.length - 1];
    const startTimestampMs = firstReading.timestampMs;
    const endTimestampMs = lastReading.timestampMs;
    const startTime = firstReading.timestamp;
    const endTime = lastReading.timestamp;
    const sampleCount = group.length;

    // Check for gaps or missing data around or inside this event
    let hasGapsOrIrregularities = false;
    const eventWarnings: string[] = [];

    // Check interval consistency within group
    for (let k = 0; k < group.length - 1; k++) {
      const dt = (group[k + 1].timestampMs - group[k].timestampMs) / (1000 * 60);
      if (dt > nominalIntervalMinutes * 1.5) {
        hasGapsOrIrregularities = true;
        eventWarnings.push(
          `Telemetry interruption: ${Math.round(dt)}m gap between consecutive abnormal samples.`
        );
      }
    }

    // Determine duration:
    // Timestamp span: (endTimestampMs - startTimestampMs) / 60000
    // Plus interval convention: If single sample, exposure window is 1 interval.
    // If multiple samples, duration is (end - start) + nominalInterval.
    const rawSpanMinutes = Math.round((endTimestampMs - startTimestampMs) / (1000 * 60));
    const estimatedDurationMinutes =
      group.length === 1 ? nominalIntervalMinutes : rawSpanMinutes + nominalIntervalMinutes;

    let durationExplanation = '';
    if (group.length === 1) {
      durationExplanation = `Single abnormal reading observed at ${startTime}. Duration estimated as 1 nominal sampling interval (${nominalIntervalMinutes} min). Actual continuous excursion length between sensor polling pulses is unverified.`;
    } else {
      durationExplanation = `Observed timestamp span: ${rawSpanMinutes} min (${startTime} to ${endTime}) across ${sampleCount} samples. Inferred total exposure window: ${estimatedDurationMinutes} min assuming symmetrical interval windowing (±${nominalIntervalMinutes / 2} min).`;
    }

    if (hasGapsOrIrregularities) {
      durationExplanation += ` [CAUTION: Sampling irregular or contains telemetry gap; duration is approximate].`;
    }

    // Peak temperature and max deviation
    let peakTemperature = type === 'HIGH' ? -Infinity : Infinity;
    let maxDeviation = 0;

    // Cumulative deviation: Sum of max(0, |T_i - Limit|) * intervalMinutes
    let cumulativeDeviation = 0;

    group.forEach((r) => {
      const temp = r.temperature!;
      const interval = r.intervalToNextMinutes || nominalIntervalMinutes;

      if (type === 'HIGH') {
        if (temp > peakTemperature) peakTemperature = temp;
        const dev = Math.max(0, temp - profile.maxTemp);
        cumulativeDeviation += dev * interval;
      } else {
        if (temp < peakTemperature) peakTemperature = temp;
        const dev = Math.max(0, profile.minTemp - temp);
        cumulativeDeviation += dev * interval;
      }
    });

    if (type === 'HIGH') {
      maxDeviation = parseFloat((peakTemperature - profile.maxTemp).toFixed(2));
    } else {
      maxDeviation = parseFloat((profile.minTemp - peakTemperature).toFixed(2));
    }

    peakTemperature = parseFloat(peakTemperature.toFixed(2));
    cumulativeDeviation = parseFloat(cumulativeDeviation.toFixed(2));

    let cumulativeExplanation =
      type === 'HIGH'
        ? `Calculated as Σ max(0, T_i - ${profile.maxTemp}°C) × Δt_i across ${sampleCount} samples = ${cumulativeDeviation} °C·min. Represents cumulative thermal exposure above the threshold.`
        : `Calculated as Σ max(0, ${profile.minTemp}°C - T_i) × Δt_i across ${sampleCount} samples = ${cumulativeDeviation} °C·min. Represents cumulative thermal deficit below the threshold.`;

    if (hasGapsOrIrregularities) {
      cumulativeExplanation +=
        ' Note: Estimation assumes linear interval weighting despite telemetry gaps; actual thermal dose may differ.';
    }

    const narrativeSummary = `${type === 'HIGH' ? 'High-temperature' : 'Low-temperature'} excursion detected between ${startTime} and ${endTime}. Temperature ${type === 'HIGH' ? 'peaked at' : 'dropped to'} ${peakTemperature}°C (${maxDeviation > 0 ? '+' : ''}${type === 'HIGH' ? '+' : '-'}${maxDeviation}°C beyond ${type === 'HIGH' ? profile.maxTemp : profile.minTemp}°C limit). Exposure duration estimated at ${estimatedDurationMinutes} minutes over ${sampleCount} readings. Cumulative deviation: ${cumulativeDeviation} °C·min.`;

    events.push({
      id: eventId,
      eventNumber: eventCounter,
      type,
      startTime,
      endTime,
      startTimestampMs,
      endTimestampMs,
      sampleCount,
      peakTemperature,
      maxDeviation,
      durationMinutes: estimatedDurationMinutes,
      isDurationEstimated: group.length === 1 || hasGapsOrIrregularities,
      durationExplanation,
      cumulativeDeviation,
      isCumulativeEstimated: hasGapsOrIrregularities,
      cumulativeExplanation,
      dataQualityWarnings: eventWarnings,
      plainLanguageSummary: narrativeSummary,
      readingIds: group.map((r) => r.id),
    });

    eventCounter++;
    currentGroup = [];
    currentType = null;
  }

  for (let i = 0; i < classifiedReadings.length; i++) {
    const reading = classifiedReadings[i];

    if (reading.classification === 'HIGH_EXCURSION') {
      if (currentType === 'LOW') {
        closeCurrentEvent();
      }
      currentType = 'HIGH';
      currentGroup.push(reading);
    } else if (reading.classification === 'LOW_EXCURSION') {
      if (currentType === 'HIGH') {
        closeCurrentEvent();
      }
      currentType = 'LOW';
      currentGroup.push(reading);
    } else {
      // IN_RANGE, WARNING_HIGH, WARNING_LOW, or MISSING_DATA closes the event
      if (currentGroup.length > 0) {
        closeCurrentEvent();
      }
    }
  }

  // Close trailing event if series ends while out of range
  if (currentGroup.length > 0) {
    closeCurrentEvent();
  }

  // 4. Dataset-wide summary metrics
  const validTemps = classifiedReadings
    .filter((r) => r.isValid && r.temperature !== null)
    .map((r) => r.temperature!);

  const highestTemperature = validTemps.length > 0 ? Math.max(...validTemps) : null;
  const lowestTemperature = validTemps.length > 0 ? Math.min(...validTemps) : null;
  const averageTemperature =
    validTemps.length > 0
      ? parseFloat((validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(2))
      : null;

  const totalCumulativeDeviation = parseFloat(
    events.reduce((sum, e) => sum + e.cumulativeDeviation, 0).toFixed(2)
  );

  const longestExcursionMinutes =
    events.length > 0 ? Math.max(...events.map((e) => e.durationMinutes)) : 0;

  // 5. Current simulated state (latest reading in series)
  const currentReading = classifiedReadings.length > 0 ? classifiedReadings[classifiedReadings.length - 1] : null;
  let currentStatus: AnalysisResult['currentStatus'] = 'NORMAL';

  if (!currentReading || !currentReading.isValid || currentReading.temperature === null) {
    currentStatus = 'DATA_UNAVAILABLE';
  } else if (currentReading.classification === 'HIGH_EXCURSION') {
    currentStatus = 'OUT_OF_RANGE_HIGH';
  } else if (currentReading.classification === 'LOW_EXCURSION') {
    currentStatus = 'OUT_OF_RANGE_LOW';
  } else if (
    currentReading.classification === 'WARNING_HIGH' ||
    currentReading.classification === 'WARNING_LOW'
  ) {
    currentStatus = 'WARNING';
  } else {
    currentStatus = 'NORMAL';
  }

  const totalReadings = classifiedReadings.length;
  const dataQualityScore =
    totalReadings > 0 ? parseFloat(((validCount / totalReadings) * 100).toFixed(1)) : 100;

  if (missingCount > 0) {
    dataQualityWarnings.push(
      `Dataset contains ${missingCount} unrecorded or missing sensor readings (${(
        (missingCount / totalReadings) *
        100
      ).toFixed(1)}% of total series).`
    );
  }

  const intervalAssumptionNote = `Nominal sample interval is ${nominalIntervalMinutes} minutes. Exposure durations assume each recorded point represents thermal conditions for its interval window. Temperature between polling intervals is unobserved.`;

  return {
    profile,
    readings: classifiedReadings,
    totalReadingsCount: totalReadings,
    validReadingsCount: validCount,
    missingReadingsCount: missingCount,
    dataGapsCount: gapsCount,
    dataQualityScore,
    dataQualityWarnings,
    currentReading,
    currentStatus,
    highestTemperature,
    lowestTemperature,
    averageTemperature,
    events,
    totalExcursionCount: events.length,
    longestExcursionMinutes,
    totalCumulativeDeviation,
    nominalSamplingIntervalMinutes: nominalIntervalMinutes,
    intervalAssumptionNote,
    generatedAt: new Date().toISOString(),
    scenarioName,
  };
}
