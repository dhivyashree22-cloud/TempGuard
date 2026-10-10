import React, { useState } from 'react';
import { StorageProfile } from '../../types';
import {
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  HelpCircle,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Plus,
  Save,
} from 'lucide-react';

interface MethodologyTabProps {
  profiles: StorageProfile[];
  selectedProfile: StorageProfile;
  onUpdateProfile: (updatedProfile: StorageProfile) => void;
  onAddCustomProfile: (newProfile: StorageProfile) => void;
  onSelectProfile: (profile: StorageProfile) => void;
}

export const MethodologyTab: React.FC<MethodologyTabProps> = ({
  profiles,
  selectedProfile,
  onUpdateProfile,
  onAddCustomProfile,
  onSelectProfile,
}) => {
  // Profile Editor state
  const [editingId, setEditingId] = useState<string>(selectedProfile.id);
  const activeEditProfile = profiles.find((p) => p.id === editingId) || selectedProfile;

  const [editMin, setEditMin] = useState<number>(activeEditProfile.minTemp);
  const [editMax, setEditMax] = useState<number>(activeEditProfile.maxTemp);
  const [editBuffer, setEditBuffer] = useState<number>(activeEditProfile.warningBuffer);
  const [editName, setEditName] = useState<string>(activeEditProfile.name);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Custom Profile Creator State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMin, setCustomMin] = useState(15.0);
  const [customMax, setCustomMax] = useState(25.0);
  const [customBuffer, setCustomBuffer] = useState(1.0);
  const [customModalError, setCustomModalError] = useState<string | null>(null);

  const handleSelectProfileToEdit = (profileId: string) => {
    const p = profiles.find((item) => item.id === profileId);
    if (!p) return;
    setEditingId(profileId);
    setEditName(p.name);
    setEditMin(p.minTemp);
    setEditMax(p.maxTemp);
    setEditBuffer(p.warningBuffer);
    setValidationError(null);
    setSaveSuccessMsg(null);
  };

  const handleSaveProfile = () => {
    if (isNaN(editMin) || isNaN(editMax) || isNaN(editBuffer)) {
      setValidationError('All temperature thresholds must be valid numbers.');
      return;
    }

    if (editMin >= editMax) {
      setValidationError(
        `Minimum temperature (${editMin}°C) must be strictly less than maximum temperature (${editMax}°C).`
      );
      return;
    }

    if (editBuffer < 0) {
      setValidationError('Warning buffer cannot be negative.');
      return;
    }

    setValidationError(null);

    const updated: StorageProfile = {
      ...activeEditProfile,
      name: editName.trim() || activeEditProfile.name,
      minTemp: editMin,
      maxTemp: editMax,
      warningBuffer: editBuffer,
    };

    onUpdateProfile(updated);
    setSaveSuccessMsg(`Profile "${updated.name}" updated successfully.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) {
      setCustomModalError('Please enter a descriptive profile name.');
      return;
    }
    if (isNaN(customMin) || isNaN(customMax) || isNaN(customBuffer)) {
      setCustomModalError('All threshold values must be valid numbers.');
      return;
    }
    if (customMin >= customMax) {
      setCustomModalError(
        `Minimum temperature (${customMin}°C) must be strictly lower than maximum temperature (${customMax}°C).`
      );
      return;
    }

    const newProfile: StorageProfile = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: 'custom',
      minTemp: customMin,
      maxTemp: customMax,
      warningBuffer: customBuffer,
      description: `User-defined custom temperature envelope: ${customMin}°C to ${customMax}°C.`,
      disclaimer:
        'CUSTOM PROFILE: User-configured limits. Verify compliance against validated standard operating procedures.',
      isCustom: true,
    };

    onAddCustomProfile(newProfile);
    setShowCreateModal(false);
    setCustomName('');
    setCustomModalError(null);
    handleSelectProfileToEdit(newProfile.id);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific & Algorithmic Foundation</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings, Storage Profiles & Analysis Methodology
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Detailed engineering documentation covering thermal time-series principles, interval windowing assumptions, cumulative deviation mathematics, and profile envelope management.
        </p>
      </div>

      {/* Profile Configuration Manager */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Storage Profile Management & Envelope Limits
            </h2>
            <p className="text-xs text-slate-400">
              Select or edit temperature boundaries. Changing a profile updates all charts, summaries, and excursion detections immediately.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Profile</span>
          </button>
        </div>

        {/* Profile Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profiles.map((p) => {
            const isEditing = p.id === editingId;
            const isCurrentWorkspace = p.id === selectedProfile.id;

            return (
              <button
                key={p.id}
                onClick={() => handleSelectProfileToEdit(p.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                  isEditing
                    ? 'bg-cyan-950/40 text-cyan-200 border-cyan-500/60 shadow-sm'
                    : 'bg-slate-950/50 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span>{p.name}</span>
                {isCurrentWorkspace && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Profile Edit Fields */}
        <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min Allowed Temp (T_min in °C)
              </label>
              <input
                type="number"
                step="0.5"
                value={editMin}
                onChange={(e) => setEditMin(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Allowed Temp (T_max in °C)
              </label>
              <input
                type="number"
                step="0.5"
                value={editMax}
                onChange={(e) => setEditMax(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Warning Buffer (±°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={editBuffer}
                onChange={(e) => setEditBuffer(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {validationError && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 italic">
              {activeEditProfile.disclaimer}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {selectedProfile.id !== activeEditProfile.id && (
                <button
                  onClick={() => onSelectProfile(activeEditProfile)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Activate in Workspace
                </button>
              )}

              <button
                onClick={handleSaveProfile}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Limits</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Core Methodology Sections */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          Methodological Principles & Theoretical Framework
        </h2>

        {/* Section 1 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              1
            </span>
            Why Temperature Fluctuations Occur in Storage Systems
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed pl-7">
            Refrigeration equipment does not maintain a constant, flatline temperature. Compressors cycle on and off according to deadband thermostat triggers, creating regular sawtooth thermal oscillations. Additionally, operational events such as door openings introduce ambient air exchanges, automatic defrost heater cycles momentarily warm evaporator coils, and mechanical wear, gasket degradation, or power grid interruptions can introduce dramatic deviations.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              2
            </span>
            Why Time-Series Analysis is Essential vs. Single Spot-Checks
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed pl-7">
            A spot measurement provides only an instantaneous snapshot in time. A refrigerator holding at 4.5°C at 09:00 AM appears perfectly compliant, yet could have experienced a four-hour outage at 15.0°C during the night before power was restored. Relying solely on momentary spot-checks creates complete blindness to prior thermal history. Comprehensive time-series logging reconstructs the uninterrupted timeline of environmental exposure.
          </p>
        </div>

        {/* Section 3 & Equations */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              3
            </span>
            Threshold Boundaries & Range Classification Rule
          </h3>
          <div className="text-xs text-slate-300 leading-relaxed pl-7 space-y-2">
            <p>
              Each valid reading <code className="text-cyan-300 font-mono">T_i</code> is evaluated deterministically against the lower threshold <code className="text-cyan-300 font-mono">T_min</code> and upper threshold <code className="text-cyan-300 font-mono">T_max</code>:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-cyan-300 text-xs">
              <div className="font-semibold text-slate-400 text-[11px] mb-1">MATHEMATICAL CLASSIFICATION RULE:</div>
              <div>• If T_i &gt; T_max  ⇒  HIGH EXCURSION  (Deviation = T_i - T_max)</div>
              <div>• If T_i &lt; T_min  ⇒  LOW EXCURSION   (Deviation = T_min - T_i)</div>
              <div>• If T_min ≤ T_i ≤ T_max  ⇒  IN RANGE      (Deviation = 0.00°C)</div>
            </div>
            <p className="text-[11px] text-slate-400">
              *Note on boundary equality: Readings exactly equal to either <code className="text-slate-300 font-mono">T_min</code> or <code className="text-slate-300 font-mono">T_max</code> are rigorously classified as IN RANGE.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              4
            </span>
            How Excursion Duration is Estimated & Sampling Assumptions
          </h3>
          <div className="text-xs text-slate-300 leading-relaxed pl-7 space-y-2">
            <p>
              Continuous temperature between polling intervals is unobserved. For discrete digital sensors recording at nominal interval <code className="text-cyan-300 font-mono">Δt</code>, duration can be formulated through two transparent perspectives:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                <strong>Observed Span:</strong> <code className="text-cyan-300 font-mono">t_last - t_first</code> represents the elapsed time between the first and last abnormal timestamps.
              </li>
              <li>
                <strong>Inferred Exposure Window:</strong> In time-series integration, each sample <code className="text-cyan-300 font-mono">i</code> represents an exposure window of <code className="text-cyan-300 font-mono">Δt</code>. For a single isolated abnormal reading, the window is <code className="text-cyan-300 font-mono">1 × Δt</code>. For consecutive abnormal readings, <code className="text-cyan-300 font-mono">(t_last - t_first) + Δt</code> accounts for the symmetric window around bounded points.
              </li>
            </ul>
            <p className="text-amber-400 text-[11px]">
              Whenever polling intervals are irregular or telemetry gaps occur, TempGuard flags the duration as an estimate rather than fabricating precise microsecond boundaries.
            </p>
          </div>
        </div>

        {/* Section 5 & Mathematical Integral */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              5
            </span>
            Cumulative Deviation Formulation & Physical Units
          </h3>
          <div className="text-xs text-slate-300 leading-relaxed pl-7 space-y-2">
            <p>
              Cumulative deviation represents the mathematical integral of thermal excursion magnitude over time:
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-cyan-300 text-xs space-y-2">
              <div>
                <span className="text-slate-400 block text-[11px]">HIGH-TEMPERATURE CUMULATIVE DEVIATION:</span>
                E_high = Σ max(0, T_i - T_max) × Δt_i   [Units: °C·min]
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block text-[11px]">LOW-TEMPERATURE CUMULATIVE DEVIATION:</span>
                E_low  = Σ max(0, T_min - T_i) × Δt_i   [Units: °C·min]
              </div>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/80 rounded-lg text-[11px] text-amber-200 space-y-1">
              <strong>Crucial Interpretation Boundary:</strong>
              <p>
                Cumulative deviation quantifies thermal exposure outside tolerance boundaries. It is <em>not</em> an empirical product-damage index. In real pharmaceuticals and biological reagents, degradation follows complex non-linear chemical kinetics (governed by the Arrhenius equation and activation energy $E_a$). A product-specific stability budget must be consulted to evaluate viability.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              6
            </span>
            Why Missing Data and Telemetry Gaps Create Uncertainty
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed pl-7">
            When a sensor battery depletes, wireless gateway drops, or communication packets are dropped, a recording gap occurs. In safety-critical auditing, an absence of recorded alarm events during an unmonitored window is <em>not evidence of safety</em>. Unmonitored time constitutes critical data ambiguity. TempGuard isolates data quality from temperature classification and raises prominent uncertainty alerts whenever gaps exceed $1.5 \times$ nominal sampling periods.
          </p>
        </div>

        {/* Section 7 */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
              7
            </span>
            Why Temperature Excursions Require Application-Specific Interpretation
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed pl-7">
            Every material has distinct thermal sensitivities. For instance, freeze-sensitive vaccines (e.g., Hepatitis B, DTaP) undergo irreversible aluminum adjuvant precipitation when frozen at even -0.5°C for brief periods, whereas heat exposure may have a broader cumulative buffer. In contrast, electronics test benches tolerate wider swings. Thus, an identical excursion of 12.0°C for 30 minutes may be catastrophic for one biological formulation yet completely benign for another.
          </p>
        </div>
      </div>

      {/* Modal for Creating Custom Storage Profile */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Layers className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Create Custom Storage Profile</h3>
            </div>

            <p className="text-xs text-slate-400">
              Define custom upper and lower temperature thresholds for your laboratory or industrial environment.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Profile Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Ultra-Low Freezer (-80°C to -60°C)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Temp (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={customMin}
                    onChange={(e) => setCustomMin(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Temp (°C):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={customMax}
                    onChange={(e) => setCustomMax(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Warning Buffer (±°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={customBuffer}
                  onChange={(e) => setCustomBuffer(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {customModalError && (
                <div className="p-2 bg-rose-950/40 border border-rose-800 rounded text-[11px] text-rose-300">
                  {customModalError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg text-xs transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
