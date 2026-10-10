export interface StorageProfile {
  id: string;
  name: string;
  category: 'vaccine' | 'general_refrigerator' | 'electronics_lab' | 'custom';
  minTemp: number; // in °C
  maxTemp: number; // in °C
  warningBuffer: number; // in °C (e.g. 0.5°C before limit)
  description: string;
  disclaimer: string;
  isCustom?: boolean;
}

export type ExcursionClassification =
  | 'IN_RANGE'
  | 'WARNING_HIGH'
  | 'WARNING_LOW'
  | 'HIGH_EXCURSION'
  | 'LOW_EXCURSION'
  | 'MISSING_DATA';

export interface TemperatureReading {
  id: string;
  timestamp: string; // ISO string or human string
  timestampMs: number;
  temperature: number | null; // null represents missing / sensor offline
  isValid: boolean;
  classification: ExcursionClassification;
  deviation: number; // deviation from limit in °C (0 if in range or missing)
  eventId?: string; // associated ExcursionEvent id if any
  qualityNote?: string;
  intervalToNextMinutes?: number;
}

export interface ExcursionEvent {
  id: string;
  eventNumber: number;
  type: 'HIGH' | 'LOW';
  startTime: string;
  endTime: string;
  startTimestampMs: number;
  endTimestampMs: number;
  sampleCount: number;
  peakTemperature: number; // maximum temp for HIGH excursion, minimum temp for LOW excursion
  maxDeviation: number; // positive °C offset from breached limit
  durationMinutes: number; // estimated duration in minutes
  isDurationEstimated: boolean;
  durationExplanation: string;
  cumulativeDeviation: number; // in °C·min
  isCumulativeEstimated: boolean;
  cumulativeExplanation: string;
  dataQualityWarnings: string[];
  plainLanguageSummary: string;
  readingIds: string[];
}

export interface AnalysisResult {
  profile: StorageProfile;
  readings: TemperatureReading[];
  totalReadingsCount: number;
  validReadingsCount: number;
  missingReadingsCount: number;
  dataGapsCount: number;
  dataQualityScore: number; // e.g. 96.5%
  dataQualityWarnings: string[];
  currentReading: TemperatureReading | null;
  currentStatus: 'NORMAL' | 'WARNING' | 'OUT_OF_RANGE_HIGH' | 'OUT_OF_RANGE_LOW' | 'DATA_UNAVAILABLE';
  highestTemperature: number | null;
  lowestTemperature: number | null;
  averageTemperature: number | null;
  events: ExcursionEvent[];
  totalExcursionCount: number;
  longestExcursionMinutes: number;
  totalCumulativeDeviation: number; // °C·min
  nominalSamplingIntervalMinutes: number;
  intervalAssumptionNote: string;
  generatedAt: string;
  scenarioName: string;
}

export interface SavedAnalysisSnapshot {
  id: string;
  savedAt: string;
  title: string;
  notes?: string;
  scenarioName: string;
  profileName: string;
  minTemp: number;
  maxTemp: number;
  totalEvents: number;
  highestTemp: number | null;
  lowestTemp: number | null;
  totalCumulativeDeviation: number;
  dataQualityWarningsCount: number;
  resultSnapshot: AnalysisResult;
}

export type ScenarioType =
  | 'normal'
  | 'power_interruption'
  | 'door_left_open'
  | 'cooling_failure'
  | 'low_temperature'
  | 'gradual_drift'
  | 'missing_data';

export interface TestResult {
  testId: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
  executionTimeMs: number;
  logs: string[];
}
