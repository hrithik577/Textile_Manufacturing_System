import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Truck,
  Cpu,
  Radar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Bot,
  HelpCircle,
  Database,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { yarniqService } from '../services/yarniq';
import {
  YarnIQOverviewMetrics,
  YarnSpecification,
  YarnLot,
  YarnPurchaseOrder,
  GoodsReceipt,
  StockoutRadarItem,
  YarnRecommendation,
  StockLedgerEntry,
} from '../types/yarniq';
import { YarnIQOverviewTab } from '../components/yarniq/YarnIQOverviewTab';
import { YarnIQInventoryTab } from '../components/yarniq/YarnIQInventoryTab';
import { YarnIQSmartGateTab } from '../components/yarniq/YarnIQSmartGateTab';
import { YarnIQReadinessTab } from '../components/yarniq/YarnIQReadinessTab';
import { YarnIQStockoutRadarTab } from '../components/yarniq/YarnIQStockoutRadarTab';
import { YarnIQTraceabilityTab } from '../components/yarniq/YarnIQTraceabilityTab';
import { YarnIQRecommendationsTab } from '../components/yarniq/YarnIQRecommendationsTab';
import { YarnIQAuditLogTab } from '../components/yarniq/YarnIQAuditLogTab';
import { YarnIQCopilotDrawer } from '../components/yarniq/YarnIQCopilotDrawer';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const YarnIQPage: React.FC = () => {
  const { addToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation tab from URL or state
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  const [selectedLotCode, setSelectedLotCode] = useState<string | undefined>(undefined);

  // Copilot Drawer State
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<YarnIQOverviewMetrics>({
    total_usable_stock_kg: 8950,
    total_reserved_stock_kg: 3300,
    total_quarantined_stock_kg: 1200,
    lots_awaiting_inspection_count: 1,
    po_discrepancies_count: 1,
    blocked_production_orders_count: 1,
    at_risk_orders_count: 1,
    stock_by_fiber: [],
    stock_by_color: [],
    recent_receipts: [],
    critical_alerts: [],
    prioritized_actions: [],
  });
  const [specifications, setSpecifications] = useState<YarnSpecification[]>([]);
  const [lots, setLots] = useState<YarnLot[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<YarnPurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [radarItems, setRadarItems] = useState<StockoutRadarItem[]>([]);
  const [recommendations, setRecommendations] = useState<YarnRecommendation[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Parallel fetch from YarnIQ endpoints
      const [
        ovRes,
        specsRes,
        lotsRes,
        posRes,
        receiptsRes,
        radarRes,
        recsRes,
        ledgerRes,
      ] = await Promise.all([
        yarniqService.getOverview(),
        yarniqService.getSpecifications(),
        yarniqService.getInventory(),
        yarniqService.getPurchaseOrders(),
        yarniqService.getReceipts(),
        yarniqService.getStockoutRadar(),
        yarniqService.getRecommendations(),
        yarniqService.getStockLedger(),
      ]);

      setMetrics(ovRes.data);
      setSpecifications(specsRes.data);
      setLots(lotsRes.data);
      setPurchaseOrders(posRes.data);
      setReceipts(receiptsRes.data);
      setRadarItems(radarRes.data);
      setRecommendations(recsRes.data);
      setLedgerEntries(ledgerRes.data);
    } catch (err: any) {
      console.error('Error loading YarnIQ data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleResetDemo = async () => {
    try {
      await yarniqService.seedData(true);
      addToast({
        type: 'success',
        title: 'YarnIQ Demo Reseeded',
        message: 'Loaded clean scenario with normal receipt, PO discrepancy, quarantined lot, and blocked order.',
      });
      loadData();
    } catch (err: any) {
      addToast({ type: 'danger', title: 'Reseed Error', message: err.message || 'Failed to reseed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── YARNIQ HERO BRAND HEADER ───────────────────────────────────────── */}
      <div className="p-6 bg-white editorial-border flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 border-2 border-[var(--color-ink)] flex items-center justify-center text-[var(--color-ink)] bg-[var(--color-paper)]">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-5xl font-black font-display text-[var(--color-ink)] uppercase tracking-tight">
                  YarnIQ
                </h1>
                <span className="text-xs font-mono px-2 py-1 bg-[var(--color-ink)] text-white font-bold uppercase tracking-widest editorial-border">
                  Intelligence Engine
                </span>
              </div>
              <p className="text-[10px] md:text-xs font-mono font-bold text-[var(--color-industrial-grey)] mt-2 uppercase tracking-widest">
                Know your stock. Predict shortages. Start production with confidence.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
          <button
            onClick={handleResetDemo}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--color-ink)] text-[10px] font-bold uppercase tracking-widest editorial-border hover:bg-[var(--color-paper)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>

          <button
            onClick={() => setCopilotOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[var(--color-ink)] text-white text-[10px] font-bold uppercase tracking-widest editorial-border hover:bg-black/80 transition-colors"
          >
            <Bot className="w-4 h-4" />
            Procurement Copilot
          </button>
        </div>
      </div>

      {/* ─── NAV TABS ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-[var(--color-light-border)] scrollbar-none editorial-border-b">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'inventory', label: 'Yarn Inventory', icon: Database },
          { id: 'smart-gate', label: 'Receive Yarn', icon: Truck, badge: metrics.po_discrepancies_count > 0 ? `${metrics.po_discrepancies_count} PO Alert` : undefined },
          { id: 'readiness', label: 'Production Readiness', icon: Cpu, highlight: true },
          { id: 'stockout-radar', label: 'Stockout Radar', icon: Radar },
          { id: 'traceability', label: 'Traceability (DNA)', icon: FileText },
          { id: 'recommendations', label: 'Actions', icon: Sparkles, badge: recommendations.length > 0 ? `${recommendations.length} Recs` : undefined },
          { id: 'ledger', label: 'Audit Log', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors whitespace-nowrap shrink-0 editorial-border',
                isActive
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-white text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
              )}
            >
              <Icon className={clsx('w-4 h-4', isActive ? (tab.highlight ? 'text-[var(--color-vermilion)]' : 'text-white') : 'text-[var(--color-industrial-grey)]')} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-white text-[var(--color-vermilion)] editorial-border uppercase tracking-widest">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT PANELS ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <YarnIQOverviewTab metrics={metrics} onNavigateTab={handleTabChange} />
      )}

      {activeTab === 'inventory' && (
        <YarnIQInventoryTab
          lots={lots}
          onSelectLot={(code) => setSelectedLotCode(code)}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'smart-gate' && (
        <YarnIQSmartGateTab
          specifications={specifications}
          purchaseOrders={purchaseOrders}
          receipts={receipts}
          onRefreshData={loadData}
        />
      )}

      {activeTab === 'readiness' && (
        <YarnIQReadinessTab specifications={specifications} onNavigateTab={handleTabChange} />
      )}

      {activeTab === 'stockout-radar' && (
        <YarnIQStockoutRadarTab radarItems={radarItems} onNavigateTab={handleTabChange} />
      )}

      {activeTab === 'traceability' && (
        <YarnIQTraceabilityTab
          lots={lots}
          selectedLotCode={selectedLotCode}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'recommendations' && (
        <YarnIQRecommendationsTab
          recommendations={recommendations}
          onRefreshData={loadData}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'ledger' && <YarnIQAuditLogTab entries={ledgerEntries} />}

      {/* ─── SLIDE-OVER COPILOT DRAWER ───────────────────────────────────────── */}
      <YarnIQCopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        onNavigateTab={(tab) => {
          handleTabChange(tab);
          setCopilotOpen(false);
        }}
      />
    </div>
  );
};
