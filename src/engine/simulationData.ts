import { ScenarioType, TemperatureReading } from '../types';

/**
 * Deterministic Synthetic Data Generator for TempGuard
 * Generates reproducible thermal time-series simulating commercial cold-storage environments.
 * These are purely synthetic mathematical models for algorithm demonstration.
 */

const BASE_START_DATE = '2026-10-10T00:00:00';

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function generateScenarioReadings(
  scenario: ScenarioType,
  nominalIntervalMinutes: number = 10,
  randomSeedOffset: number = 0
): { readings: TemperatureReading[]; scenarioName: string } {
  const startDate = new Date(BASE_START_DATE);
  const totalSamples = 96; // 16 hours of 10-minute intervals
  const readings: TemperatureReading[] = [];

  let scenarioName = 'Standard Normal Baseline';

  for (let i = 0; i < totalSamples; i++) {
    const timestampMs = startDate.getTime() + i * nominalIntervalMinutes * 60 * 1000;
    const dateObj = new Date(timestampMs);
    const timeStr = formatTimestamp(dateObj);
    const id = `rdg-${String(i + 1).padStart(4, '0')}`;

    // Hour of simulation: 0 to 16
    const hour = (i * nominalIntervalMinutes) / 60;

    // Base refrigerator cycle: sine wave representing regular compressor cycling
    // Period of ~40 minutes (4 samples), amplitude ~0.6°C around 4.5°C
    const cycle = Math.sin((i * 2 * Math.PI) / 4) * 0.55;
    // Pseudorandom deterministic noise based on index and seed
    const pseudoNoise =
      Math.sin(i * 13.7 + randomSeedOffset) * 0.15 +
      Math.cos(i * 7.9 + randomSeedOffset * 0.5) * 0.1;

    let temp: number | null = 4.5 + cycle + pseudoNoise;
    let isValid = true;
    let qualityNote: string | undefined = undefined;

    switch (scenario) {
      case 'normal':
        scenarioName = 'Normal Storage Operation (Stable 2°C–8°C Envelope)';
        // Fluctuation kept reliably between 3.6°C and 5.4°C
        temp = 4.4 + cycle + pseudoNoise;
        break;

      case 'power_interruption':
        scenarioName = 'Power Interruption Scenario (Gradual Thermal Rise & Recovery)';
        // Power cuts at Hour 4.0 (sample 24), stays off until Hour 7.5 (sample 45)
        if (hour >= 4.0 && hour <= 7.5) {
          // Warming curve: passive thermal infiltration towards ambient 21°C
          const warmTime = hour - 4.0;
          temp = 4.5 + warmTime * 2.8 + Math.sin(i) * 0.15; // peaks around 14.3°C
        } else if (hour > 7.5 && hour < 10.5) {
          // Power restored: active cooling pull-down curve
          const coolTime = hour - 7.5;
          const peakAtRestore = 14.3;
          temp = Math.max(4.5, peakAtRestore - coolTime * 3.3) + cycle * 0.3;
        } else {
          temp = 4.4 + cycle + pseudoNoise;
        }
        break;

      case 'door_left_open':
        scenarioName = 'Door Left Ajar Scenario (Two Distinct Excursion Events)';
        // Event 1: Morning restocking door propped open at Hour 3.5 to Hour 4.5
        if (hour >= 3.5 && hour <= 4.5) {
          temp = 5.0 + (hour - 3.5) * 6.5 + Math.sin(i * 3) * 0.2; // reaches 11.5°C
        } else if (hour > 4.5 && hour < 5.5) {
          // recovery
          temp = Math.max(4.5, 11.5 - (hour - 4.5) * 7.0);
        }
        // Event 2: Afternoon prolonged door opening at Hour 9.0 to Hour 9.8
        else if (hour >= 9.0 && hour <= 9.8) {
          temp = 4.5 + (hour - 9.0) * 5.8; // reaches ~9.1°C
        } else if (hour > 9.8 && hour < 10.5) {
          temp = Math.max(4.5, 9.1 - (hour - 9.8) * 6.5);
        } else {
          temp = 4.4 + cycle + pseudoNoise;
        }
        break;

      case 'cooling_failure':
        scenarioName = 'Complete Refrigeration System Failure (Runaway Warming)';
        // Compressor breaks at Hour 3.0, temperature climbs monotonically to 19°C
        if (hour >= 3.0) {
          const failDuration = hour - 3.0;
          temp = 4.5 + 15 * (1 - Math.exp(-failDuration / 3.5)) + pseudoNoise;
        } else {
          temp = 4.4 + cycle + pseudoNoise;
        }
        break;

      case 'low_temperature':
        scenarioName = 'Thermostat Stuck / Freeze Excursion (Low-Temperature Risk)';
        // Thermostat contacts seize at Hour 4.5, compressor runs 100% duty cycle
        if (hour >= 4.5 && hour <= 7.0) {
          const dropTime = hour - 4.5;
          temp = 4.0 - dropTime * 2.8 + cycle * 0.2; // drops to -3.0°C
        } else if (hour > 7.0 && hour < 9.0) {
          // emergency defrost / technician intervention
          temp = Math.min(4.5, -3.0 + (hour - 7.0) * 3.8);
        } else {
          temp = 4.4 + cycle + pseudoNoise;
        }
        break;

      case 'gradual_drift':
        scenarioName = 'Gradual Thermal Drift (Slow Sensor/Refrigerant Degradation)';
        // Slow continuous upward drift across 16 hours
        temp = 3.8 + (hour / 16) * 6.0 + cycle + pseudoNoise; // reaches 9.8°C at end
        break;

      case 'missing_data':
        scenarioName = 'Telemetry Drop / Data Gap Scenario with Subsequent Excursion';
        // Sensor drops offline between Hour 4.5 (sample 27) and Hour 6.5 (sample 39)
        if (hour >= 4.5 && hour <= 6.5) {
          temp = null;
          isValid = false;
          qualityNote = 'Sensor packet dropped; wireless logger gateway unresponsive.';
        } else if (hour > 6.5 && hour < 8.5) {
          // When telemetry restores, temperature is at 10.8°C (an excursion happened while unmonitored!)
          temp = Math.max(4.5, 10.8 - (hour - 6.5) * 3.2);
        } else {
          temp = 4.4 + cycle + pseudoNoise;
        }
        break;
    }

    readings.push({
      id,
      timestamp: timeStr,
      timestampMs,
      temperature: temp !== null ? parseFloat(temp.toFixed(2)) : null,
      isValid,
      classification: 'IN_RANGE', // will be evaluated by engine
      deviation: 0,
      qualityNote,
    });
  }

  return { readings, scenarioName };
}

/**
 * Apply interactive custom anomalies in the Test Lab
 */
export function applyAnomalies(
  baseReadings: TemperatureReading[],
  options: {
    injectSpike?: boolean; // +6°C for 20 mins
    injectProlongedHeat?: boolean; // +8°C for 3 hours
    injectFreeze?: boolean; // -5°C for 1 hour
    injectDataGap?: boolean; // missing data for 60 mins
  }
): TemperatureReading[] {
  const result: TemperatureReading[] = JSON.parse(JSON.stringify(baseReadings));

  // Determine middle sample indices
  const midIndex = Math.floor(result.length / 2);

  if (options.injectSpike) {
    // Spike at index midIndex - 10 to midIndex - 8 (20 mins)
    const start = Math.max(0, midIndex - 10);
    const end = Math.min(result.length, start + 3);
    for (let i = start; i < end; i++) {
      if (result[i].temperature !== null) {
        result[i].temperature = parseFloat((result[i].temperature! + 6.2).toFixed(2));
        result[i].qualityNote = 'Simulated sudden temperature spike injected in Test Lab';
      }
    }
  }

  if (options.injectProlongedHeat) {
    // Prolonged heat for 18 samples (3 hours at 10 min intervals)
    const start = Math.max(0, midIndex - 5);
    const end = Math.min(result.length, start + 18);
    for (let i = start; i < end; i++) {
      if (result[i].temperature !== null) {
        result[i].temperature = parseFloat((result[i].temperature! + 7.8).toFixed(2));
        result[i].qualityNote = 'Simulated prolonged thermal exposure injected in Test Lab';
      }
    }
  }

  if (options.injectFreeze) {
    // Deep freeze for 6 samples (1 hour)
    const start = Math.max(0, midIndex + 15);
    const end = Math.min(result.length, start + 6);
    for (let i = start; i < end; i++) {
      if (result[i].temperature !== null) {
        result[i].temperature = parseFloat((result[i].temperature! - 6.5).toFixed(2));
        result[i].qualityNote = 'Simulated sub-zero freeze anomaly injected in Test Lab';
      }
    }
  }

  if (options.injectDataGap) {
    // Drop 6 consecutive readings (60 mins)
    const start = Math.max(0, midIndex + 5);
    const end = Math.min(result.length, start + 6);
    for (let i = start; i < end; i++) {
      result[i].temperature = null;
      result[i].isValid = false;
      result[i].qualityNote = 'Simulated telemetry packet dropout injected in Test Lab';
    }
  }

  return result;
}
