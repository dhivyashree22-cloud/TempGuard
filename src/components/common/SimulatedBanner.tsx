import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export const SimulatedBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full bg-slate-900 border-b border-amber-500/30 text-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            SIMULATED DATA — NO PHYSICAL SENSOR CONNECTED
          </span>

          <span className="text-slate-300 hidden md:inline">
            Software prototype running deterministic mathematical models for educational and engineering demonstration.
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-100 hover:underline transition-colors focus:outline-none"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{expanded ? 'Hide Responsible-Use Notice' : 'View Responsible-Use Notice'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="bg-slate-950/90 border-t border-slate-800 text-slate-300 px-4 py-3.5 max-w-7xl mx-auto text-xs space-y-2">
          <div className="flex items-start gap-2.5 text-amber-300 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Important Operational & Regulatory Boundaries:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>
              <strong>No Physical Hardware:</strong> All temperature records and timestamps displayed in TempGuard are simulated in-memory by browser algorithms. No RTD, thermocouple, or wireless probe is connected.
            </li>
            <li>
              <strong>Not Product Safety Certification:</strong> TempGuard does not classify vaccines, biologics, pharmaceuticals, or perishables as clinically safe or compromised. Decisions regarding drug viability require validated thermal monitoring logs and authorized manufacturer stability analysis.
            </li>
            <li>
              <strong>Illustrative Envelopes:</strong> Configured 2°C to 8°C boundaries represent standard illustrative examples, not a universal standard across all medicines.
            </li>
            <li>
              <strong>Telemetry Uncertainty:</strong> Unmonitored gaps or missing sensor packets represent inherent blind spots; an absence of recorded alarms does not prove safety during unmonitored periods.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
