/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AnalysisResult,
  SavedAnalysisSnapshot,
  ScenarioType,
  StorageProfile,
  TemperatureReading,
} from './types';
import { INITIAL_PROFILES } from './data/storageProfiles';
import { analyzeTemperatureSeries } from './engine/analysisEngine';
import { generateScenarioReadings } from './engine/simulationData';

import { SimulatedBanner } from './components/common/SimulatedBanner';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { OverviewTab } from './components/overview/OverviewTab';
import { AnalysisTab } from './components/analysis/AnalysisTab';
import { TestLabTab } from './components/testlab/TestLabTab';
import { HistoryTab } from './components/history/HistoryTab';
import { MethodologyTab } from './components/methodology/MethodologyTab';
import { CheckCircle2, Info, X } from 'lucide-react';

const STORAGE_KEY_PROFILES = 'tempguard_profiles_v1';
const STORAGE_KEY_HISTORY = 'tempguard_snapshots_v1';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profiles State (hydrated from localStorage or defaults)
  const [profiles, setProfiles] = useState<StorageProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read profiles from localStorage:', e);
    }
    return INITIAL_PROFILES;
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string>(() => profiles[0].id);

  const selectedProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  }, [profiles, selectedProfileId]);

  // Current Scenario & Simulated Readings
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>('door_left_open');
  const [activeReadings, setActiveReadings] = useState<TemperatureReading[]>(() => {
    return generateScenarioReadings('door_left_open', 10).readings;
  });
  const [activeScenarioName, setActiveScenarioName] = useState<string>(
    'Door Left Ajar Scenario (Two Distinct Excursion Events)'
  );

  // Event Selection for inspection cross-highlighting
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // History Snapshots State
  const [history, setHistory] = useState<SavedAnalysisSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read history from localStorage:', e);
    }
    return [];
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Persist profiles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Failed to save profiles to localStorage:', e);
    }
  }, [profiles]);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage:', e);
    }
  }, [history]);

  // Pure deterministic analysis result derived from current readings & active profile
  const analysisResult: AnalysisResult = useMemo(() => {
    return analyzeTemperatureSeries(
      activeReadings,
      selectedProfile,
      activeScenarioName,
      10
    );
  }, [activeReadings, selectedProfile, activeScenarioName]);

  // Handlers for Scenario loading
  const handleLoadScenario = useCallback((scenario: ScenarioType) => {
    setCurrentScenario(scenario);
    setSelectedEventId(null);
    const { readings, scenarioName } = generateScenarioReadings(scenario, 10);
    setActiveReadings(readings);
    setActiveScenarioName(scenarioName);
    showToast(`Loaded scenario: ${scenarioName.split('(')[0]}`);
  }, [showToast]);

  const handleGenerateRandom = useCallback(() => {
    const seed = Math.random() * 1000;
    const { readings, scenarioName } = generateScenarioReadings('normal', 10, seed);
    // Add controlled perturbation
    const perturbed = readings.map((r, i) => {
      if (i > 30 && i < 42) {
        return {
          ...r,
          temperature: r.temperature !== null ? parseFloat((r.temperature + 5.2).toFixed(2)) : null,
        };
      }
      return r;
    });
    setActiveReadings(perturbed);
    setActiveScenarioName(`Synthesized Scenario Variation #${Math.floor(seed % 1000)}`);
    setSelectedEventId(null);
    showToast('Synthesized new simulated dataset with random variance.');
  }, [showToast]);

  const handleResetDemo = useCallback(() => {
    handleLoadScenario('normal');
    setSelectedProfileId(profiles[0].id);
    setSelectedEventId(null);
    showToast('Demo reset to standard Normal baseline.');
  }, [handleLoadScenario, profiles, showToast]);

  // Profile management handlers
  const handleUpdateProfile = useCallback((updated: StorageProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Updated limits for ${updated.name}`);
  }, [showToast]);

  const handleAddCustomProfile = useCallback((newProfile: StorageProfile) => {
    setProfiles((prev) => [...prev, newProfile]);
    setSelectedProfileId(newProfile.id);
    showToast(`Created custom profile: ${newProfile.name}`);
  }, [showToast]);

  const handleSelectProfile = useCallback((p: StorageProfile) => {
    setSelectedProfileId(p.id);
    showToast(`Switched storage profile: ${p.name}`);
  }, [showToast]);

  // Snapshot saving and restoring
  const handleSaveSnapshot = useCallback(() => {
    const newSnapshot: SavedAnalysisSnapshot = {
      id: `snap-${Date.now()}`,
      savedAt: new Date().toLocaleString(),
      title: `${selectedProfile.name} — ${activeScenarioName.split('(')[0].trim()}`,
      scenarioName: activeScenarioName,
      profileName: selectedProfile.name,
      minTemp: selectedProfile.minTemp,
      maxTemp: selectedProfile.maxTemp,
      totalEvents: analysisResult.totalExcursionCount,
      highestTemp: analysisResult.highestTemperature,
      lowestTemp: analysisResult.lowestTemperature,
      totalCumulativeDeviation: analysisResult.totalCumulativeDeviation,
      dataQualityWarningsCount: analysisResult.dataQualityWarnings.length,
      resultSnapshot: analysisResult,
    };

    setHistory((prev) => [newSnapshot, ...prev]);
    showToast(`Saved analysis snapshot to browser storage (${newSnapshot.title})`);
  }, [selectedProfile, activeScenarioName, analysisResult, showToast]);

  const handleLoadSnapshot = useCallback((snapshot: SavedAnalysisSnapshot) => {
    setActiveReadings(snapshot.resultSnapshot.readings);
    setActiveScenarioName(snapshot.resultSnapshot.scenarioName);

    // If snapshot profile matches an existing one, select it; otherwise ensure profile exists
    const match = profiles.find((p) => p.name === snapshot.profileName);
    if (match) {
      setSelectedProfileId(match.id);
    }

    setCurrentTab('overview');
    showToast(`Restored snapshot from ${snapshot.savedAt}`);
  }, [profiles, showToast]);

  const handleDeleteSnapshot = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Snapshot removed from local storage.');
  }, [showToast]);

  const handleClearAllHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {
      console.warn(e);
    }
    showToast('All saved snapshots cleared.');
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Prominent Simulated Sensor Disclaimer Banner */}
      <SimulatedBanner />

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentAnalysis={analysisResult}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          profiles={profiles}
          selectedProfile={selectedProfile}
          onSelectProfile={handleSelectProfile}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          excursionCount={analysisResult.totalExcursionCount}
        />

        {/* Tab Content Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewTab
              analysis={analysisResult}
              selectedProfile={selectedProfile}
              onSelectEvent={setSelectedEventId}
              selectedEventId={selectedEventId}
              onLoadScenario={handleLoadScenario}
              onGenerateRandom={handleGenerateRandom}
              onResetDemo={handleResetDemo}
              onNavigateToAnalysis={(eventId) => {
                if (eventId) setSelectedEventId(eventId);
                setCurrentTab('analysis');
              }}
              onSaveSnapshot={handleSaveSnapshot}
            />
          )}

          {currentTab === 'analysis' && (
            <AnalysisTab
              analysis={analysisResult}
              selectedProfile={selectedProfile}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          )}

          {currentTab === 'testlab' && (
            <TestLabTab currentProfile={selectedProfile} />
          )}

          {currentTab === 'history' && (
            <HistoryTab
              history={history}
              onLoadSnapshot={handleLoadSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onClearAllHistory={handleClearAllHistory}
              onSaveCurrentSnapshot={handleSaveSnapshot}
              currentAnalysis={analysisResult}
            />
          )}

          {currentTab === 'methodology' && (
            <MethodologyTab
              profiles={profiles}
              selectedProfile={selectedProfile}
              onUpdateProfile={handleUpdateProfile}
              onAddCustomProfile={handleAddCustomProfile}
              onSelectProfile={handleSelectProfile}
            />
          )}
        </main>
      </div>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Regulatory Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            TempGuard v2.4 Prototype • Intelligent Temperature Excursion Analysis System
          </span>
          <span className="text-[11px] text-slate-600">
            Simulated Data Demonstration • Not for Clinical, Medical, or Commercial Storage Certification
          </span>
        </div>
      </footer>
    </div>
  );
}
