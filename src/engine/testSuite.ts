import { TestResult, StorageProfile, TemperatureReading } from '../types';
import { analyzeTemperatureSeries } from './analysisEngine';

const TEST_PROFILE: StorageProfile = {
  id: 'test-profile',
  name: 'Unit Test Profile (2°C to 8°C)',
  category: 'vaccine',
  minTemp: 2.0,
  maxTemp: 8.0,
  warningBuffer: 0.5,
  description: 'Fixed baseline profile for automated engine verification',
  disclaimer: 'Test profile for unit validation only.',
};

function makeReading(
  index: number,
  temp: number | null,
  isValid = true,
  intervalMinutes = 10
): TemperatureReading {
  const baseTime = 1700000000000;
  const timestampMs = baseTime + index * intervalMinutes * 60 * 1000;
  const d = new Date(timestampMs);
  const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0'
  )}`;

  return {
    id: `test-rdg-${index}`,
    timestamp: timeStr,
    timestampMs,
    temperature: temp,
    isValid,
    classification: 'IN_RANGE',
    deviation: 0,
  };
}

export function runAllSelfTests(): TestResult[] {
  const results: TestResult[] = [];

  // TEST 1: All readings strictly within range produce zero excursion events
  {
    const start = performance.now();
    const readings: TemperatureReading[] = [
      makeReading(0, 3.0),
      makeReading(1, 4.5),
      makeReading(2, 5.0),
      makeReading(3, 6.2),
      makeReading(4, 3.8),
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 1 Series', 10);
    const passed = res.totalExcursionCount === 0 && res.events.length === 0;
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-001',
      name: 'All Readings In-Range $\\to$ Zero Excursions',
      passed,
      expected: '0 excursion events, status NORMAL',
      actual: `${res.totalExcursionCount} events, status ${res.currentStatus}`,
      details: 'All 5 samples were between 3.0°C and 6.2°C (limits: 2.0°C - 8.0°C). Engine correctly found no excursions.',
      executionTimeMs,
      logs: [
        `Processed ${res.totalReadingsCount} samples`,
        `Max temp: ${res.highestTemperature}°C, Min temp: ${res.lowestTemperature}°C`,
        `Excursions detected: ${res.totalExcursionCount}`,
      ],
    });
  }

  // TEST 2: Reading above upper limit produces a high-temperature event
  {
    const start = performance.now();
    const readings: TemperatureReading[] = [
      makeReading(0, 4.0),
      makeReading(1, 9.5), // Above 8.0°C max
      makeReading(2, 10.2), // Above 8.0°C max
      makeReading(3, 5.0),
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 2 Series', 10);
    const hasHighEvent =
      res.totalExcursionCount === 1 &&
      res.events[0]?.type === 'HIGH' &&
      res.events[0]?.peakTemperature === 10.2 &&
      res.events[0]?.maxDeviation === 2.2; // 10.2 - 8.0 = 2.2
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-002',
      name: 'Readings Above Max Limit $\\to$ High Excursion Event',
      passed: hasHighEvent,
      expected: '1 HIGH event, peak = 10.2°C, max deviation = +2.2°C',
      actual: `${res.totalExcursionCount} event(s), type = ${res.events[0]?.type || 'none'}, peak = ${res.events[0]?.peakTemperature}°C, max dev = ${res.events[0]?.maxDeviation}°C`,
      details: 'Readings of 9.5°C and 10.2°C grouped into single continuous HIGH excursion with accurate peak and deviation.',
      executionTimeMs,
      logs: [
        `Event ID: ${res.events[0]?.id}`,
        `Grouped sample count: ${res.events[0]?.sampleCount}`,
        `Cumulative deviation: ${res.events[0]?.cumulativeDeviation} °C·min`,
      ],
    });
  }

  // TEST 3: Reading below lower limit produces a low-temperature event
  {
    const start = performance.now();
    const readings: TemperatureReading[] = [
      makeReading(0, 4.0),
      makeReading(1, 1.2), // Below 2.0°C min
      makeReading(2, 0.5), // Below 2.0°C min
      makeReading(3, 4.5),
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 3 Series', 10);
    const hasLowEvent =
      res.totalExcursionCount === 1 &&
      res.events[0]?.type === 'LOW' &&
      res.events[0]?.peakTemperature === 0.5 &&
      res.events[0]?.maxDeviation === 1.5; // 2.0 - 0.5 = 1.5
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-003',
      name: 'Readings Below Min Limit $\\to$ Low Excursion Event',
      passed: hasLowEvent,
      expected: '1 LOW event, lowest temp = 0.5°C, max deviation = 1.5°C below limit',
      actual: `${res.totalExcursionCount} event(s), type = ${res.events[0]?.type || 'none'}, lowest = ${res.events[0]?.peakTemperature}°C, max dev = ${res.events[0]?.maxDeviation}°C`,
      details: 'Readings below 2.0°C grouped into LOW excursion with correct thermal deficit metrics.',
      executionTimeMs,
      logs: [
        `Event ID: ${res.events[0]?.id}`,
        `T_min limit: ${TEST_PROFILE.minTemp}°C`,
        `Lowest recorded: ${res.events[0]?.peakTemperature}°C`,
      ],
    });
  }

  // TEST 4: Two separated excursions are counted as separate events
  {
    const start = performance.now();
    const readings: TemperatureReading[] = [
      makeReading(0, 4.0),
      makeReading(1, 9.0), // Event 1
      makeReading(2, 9.2), // Event 1
      makeReading(3, 4.5), // Normal in-range spacer closes Event 1
      makeReading(4, 5.0), // Normal in-range spacer
      makeReading(5, 10.5), // Event 2
      makeReading(6, 4.0), // Normal in-range spacer closes Event 2
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 4 Series', 10);
    const passed =
      res.totalExcursionCount === 2 &&
      res.events.length === 2 &&
      res.events[0].id !== res.events[1].id;
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-004',
      name: 'Separated Excursions $\\to$ Distinct Event Grouping',
      passed,
      expected: '2 distinct excursion events (EVT-001, EVT-002)',
      actual: `${res.totalExcursionCount} event(s) detected`,
      details: 'In-range readings between out-of-range periods correctly closed the first event before beginning the second.',
      executionTimeMs,
      logs: [
        `Event 1: ${res.events[0]?.id} (samples: ${res.events[0]?.sampleCount})`,
        `Event 2: ${res.events[1]?.id} (samples: ${res.events[1]?.sampleCount})`,
      ],
    });
  }

  // TEST 5: Missing data triggers data-quality warning
  {
    const start = performance.now();
    const readings: TemperatureReading[] = [
      makeReading(0, 4.0),
      makeReading(1, null, false), // Missing sensor value
      makeReading(2, 4.2),
      // Big gap: index 10 is 80 minutes later (nominal is 10 min)
      makeReading(10, 4.5),
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 5 Series', 10);
    const passed =
      res.missingReadingsCount >= 1 &&
      res.dataGapsCount >= 1 &&
      res.dataQualityWarnings.length >= 2;
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-005',
      name: 'Missing Data & Telemetry Gaps $\\to$ Data-Quality Warnings',
      passed,
      expected: 'At least 1 missing reading, 1 telemetry gap detected, data warnings flagged',
      actual: `${res.missingReadingsCount} missing, ${res.dataGapsCount} gap(s), ${res.dataQualityWarnings.length} warning(s)`,
      details: 'Data loss was isolated from thermal status and explicitly flagged with transparent uncertainty warnings.',
      executionTimeMs,
      logs: res.dataQualityWarnings,
    });
  }

  // TEST 6: Exact boundary readings equal to limits are classified as IN RANGE
  {
    const start = performance.now();
    const readings: TemperatureReading[] = [
      makeReading(0, 2.0), // Exactly minTemp
      makeReading(1, 8.0), // Exactly maxTemp
      makeReading(2, 5.0),
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 6 Series', 10);
    const isBoundaryOk =
      res.totalExcursionCount === 0 &&
      res.readings[0].classification !== 'LOW_EXCURSION' &&
      res.readings[1].classification !== 'HIGH_EXCURSION';
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-006',
      name: 'Boundary Readings Equal to Limits $\\to$ In-Range Classification',
      passed: isBoundaryOk,
      expected: '0 excursions; boundary values 2.0°C and 8.0°C treated as IN_RANGE',
      actual: `${res.totalExcursionCount} excursions; readings[0]: ${res.readings[0].classification}, readings[1]: ${res.readings[1].classification}`,
      details: 'Boundary condition test per specification: readings exactly equal to T_min or T_max are strictly in range.',
      executionTimeMs,
      logs: [
        `Reading at T_min (2.0°C): ${res.readings[0].classification}`,
        `Reading at T_max (8.0°C): ${res.readings[1].classification}`,
      ],
    });
  }

  // TEST 7: Cumulative deviation calculation accuracy
  {
    const start = performance.now();
    // 2 samples above 8.0°C:
    // sample 1: 9.0°C -> deviation = 1.0°C, interval = 10 min -> dose = 10 °C·min
    // sample 2: 10.0°C -> deviation = 2.0°C, interval = 10 min -> dose = 20 °C·min
    // total = 30 °C·min
    const readings: TemperatureReading[] = [
      makeReading(0, 4.0, true, 10),
      makeReading(1, 9.0, true, 10),
      makeReading(2, 10.0, true, 10),
      makeReading(3, 4.0, true, 10),
    ];
    const res = analyzeTemperatureSeries(readings, TEST_PROFILE, 'Test 7 Series', 10);
    const expectedDose = 30.0;
    const calculatedDose = res.events[0]?.cumulativeDeviation ?? 0;
    const passed = Math.abs(calculatedDose - expectedDose) < 0.1;
    const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
    results.push({
      testId: 'TC-007',
      name: 'Cumulative Thermal Exposure Calculation $\\to$ Mathematical Exactness',
      passed,
      expected: `${expectedDose} °C·min (Σ max(0, T_i - T_max) × Δt)`,
      actual: `${calculatedDose} °C·min`,
      details: 'Sum of deviation weighted by interval duration matches manual analytical integration.',
      executionTimeMs,
      logs: [
        `Sample 1 deviation: (9.0 - 8.0) * 10 = 10 °C·min`,
        `Sample 2 deviation: (10.0 - 8.0) * 10 = 20 °C·min`,
        `Total calculated: ${calculatedDose} °C·min`,
      ],
    });
  }

  return results;
}
