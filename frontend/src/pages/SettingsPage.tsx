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
      <div className="pb-4 editorial-border-b">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-black font-mono text-[var(--color-ink)] uppercase tracking-tight">
            System Configuration & Mill Parameters
          </h1>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--color-vermilion)] text-white uppercase">
            Admin Console
          </span>
        </div>
        <p className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase">
          Manage factory API gateway endpoints, quality inspection tolerances, measurement units, and simulation engine.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Backend API Connection Gateway */}
        <div className="bg-white editorial-border p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-3 editorial-border-b">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--color-vermilion)]" />
              <h3 className="text-xs font-bold font-mono text-[var(--color-ink)] uppercase tracking-wider">
                FastAPI Backend & Database Gateway
              </h3>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-[var(--color-ink)] text-white">
              PORT 8000 SYNC
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--color-industrial-grey)] mb-1">
                API Base URL (FastAPI)
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Quality Tolerances */}
        <div className="bg-white editorial-border p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-3 editorial-border-b">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-vermilion)]" />
              <h3 className="text-xs font-bold font-mono text-[var(--color-ink)] uppercase tracking-wider">
                Quality Inspection Tolerances
              </h3>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-[var(--color-paper)] text-[var(--color-industrial-grey)] editorial-border">
              4-POINT GRADING
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--color-industrial-grey)] mb-1">
                Color Delta E Max Tolerance
              </label>
              <input
                type="number"
                step={0.1}
                value={qualityToleranceDeltaE}
                onChange={(e) => setQualityToleranceDeltaE(Number(e.target.value))}
                className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--color-industrial-grey)] mb-1">
                Shrinkage Tolerance (%)
              </label>
              <input
                type="number"
                step={0.1}
                value={shrinkageTolerancePercent}
                onChange={(e) => setShrinkageTolerancePercent(Number(e.target.value))}
                className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 editorial-border-t">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={resetSimulatedData}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Factory Data
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
