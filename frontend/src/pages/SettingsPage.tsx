import React, { useState } from 'react';
import {
  Settings,
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { isDemoMode, toggleDemoMode, resetSimulatedData, addToast } = useApp();

  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  );
  const [defaultUnit, setDefaultUnit] = useState<'meters' | 'yards'>('meters');
  const [qualityToleranceDeltaE, setQualityToleranceDeltaE] = useState<number>(0.8);
  const [shrinkageTolerancePercent, setShrinkageTolerancePercent] = useState<number>(3.0);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast({
        type: 'success',
        title: 'Factory Configuration Saved',
        message: 'Tolerances, unit preferences, and API endpoints updated.',
      });
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          System Configuration & Mill Parameters
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage factory API gateway endpoints, quality inspection tolerances, measurement units, and simulation engine.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Backend API Connection Gateway */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Server className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold text-white font-display">
              FastAPI Backend & Database Gateway
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                FastAPI Gateway Base URL (`VITE_API_BASE_URL`)
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Connects to Member 2's FastAPI / PostgreSQL container on port 8000.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-medium">Auto-Fallback Adapter:</span>
              </div>
              <span className="text-[11px] text-teal-400 font-mono">
                Active (Ensures zero UI downtime during network interruptions)
              </span>
            </div>
          </div>
        </div>

        {/* Virtual Factory Simulator Configuration */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white font-display">
              Virtual Factory Simulator (Member 3 Engine)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="font-bold text-white text-xs">Demo Simulation Mode</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, displays simulated machine event stream, breakdown telemetry, and sample recovery plans.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDemoMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDemoMode ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isDemoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="font-bold text-white text-xs">Reset Simulated Test Data</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reinitializes all machines, pending alerts, and recovery scenarios to clean state.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetSimulatedData}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Demo Data
              </Button>
            </div>
          </div>
        </div>

        {/* Quality Lab & Metric Tolerances */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-display">
              Fabric Specifications & Lab Tolerances
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Color Spectrophotometer Delta E Limit (Pass Threshold)
              </label>
              <input
                type="number"
                step="0.1"
                value={qualityToleranceDeltaE}
                onChange={(e) => setQualityToleranceDeltaE(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Exceeding this automatically flags a Quality Hold.</p>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Maximum Permissible Shrinkage (% Limit)
              </label>
              <input
                type="number"
                step="0.1"
                value={shrinkageTolerancePercent}
                onChange={(e) => setShrinkageTolerancePercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Checked on finished fabric roll test stenter.</p>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Default Length Measurement Unit</label>
              <select
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="meters">Meters (m)</option>
                <option value="yards">Yards (yd)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="primary" size="md" type="submit" isLoading={saving}>
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
