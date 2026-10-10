export type MachineProcessType = 'spinning' | 'weaving' | 'dyeing' | 'finishing' | 'inspection' | 'packaging';
export type MachineStatus = 'running' | 'idle' | 'setup' | 'breakdown' | 'maintenance';
export type DataSource = 'SIMULATED' | 'LIVE';

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: MachineProcessType;
  status: MachineStatus;
  currentOrderId?: string;
  currentOrderCode?: string;
  operatorName: string;
  shift: 'Morning (06:00 - 14:00)' | 'Evening (14:00 - 22:00)' | 'Night (22:00 - 06:00)';
  shiftOutputMeters: number;
  targetOutputMeters: number;
  unit: 'meters' | 'kg' | 'rolls';
  speedRpm: number;
  temperatureC: number;
  tensionN: number;
  efficiencyPercent: number;
  downtimeMinutesToday: number;
  downtimeReason?: string;
  lastMaintenanceDate: string;
  dataSource: DataSource;
  line: string;
  recentLogs: MachineLog[];
}

export interface MachineLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'maintenance';
  message: string;
  operator?: string;
}

export type OrderStatus = 'draft' | 'in_production' | 'at_risk' | 'quality_hold' | 'ready_to_dispatch' | 'partially_dispatched' | 'completed' | 'cancelled';
export type ProductionStage = 'yarn_spinning' | 'fabric_weaving' | 'dyeing_finishing' | 'quality_inspection' | 'packing_storage' | 'dispatched';
export type PriorityLevel = 'standard' | 'high' | 'urgent';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerPo: string;
  fabricType: string;
  yarnSpecs: string;
  gsm: number;
  color: string;
  pantoneCode: string;
  orderedQuantity: number;
  completedQuantity: number;
  allocatedRollsCount: number;
  unit: 'meters' | 'yards' | 'kg';
  status: OrderStatus;
  currentStage: ProductionStage;
  stageProgress: Record<ProductionStage, number>; // 0 to 100%
  orderDate: string;
  deadlineDate: string;
  estimatedCompletionDate: string;
  priority: PriorityLevel;
  totalValueUsd: number;
  costBreakdown: {
    rawMaterialCostUsd: number;
    weavingCostUsd: number;
    dyeingCostUsd: number;
    finishingCostUsd: number;
    laborOverheadsUsd: number;
    totalCostUsd: number;
    projectedMarginPercent: number;
  };
  materialReadiness: {
    yarnStockPercent: number;
    dyesChemicalsPercent: number;
    isReady: boolean;
    missingMaterials?: string[];
  };
  notes?: string;
}

export type InventoryCategory = 'raw_yarn' | 'dyes_chemicals' | 'greige_fabric' | 'finished_roll' | 'packaging_material';
export type StockStatus = 'in_stock' | 'low_stock' | 'critical' | 'depleted';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  lotNumber: string;
  specification: string;
  colorHex?: string;
  warehouseRack: string;
  warehouseBin: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderThreshold: number;
  unit: 'kg' | 'meters' | 'rolls' | 'liters' | 'bags';
  unitCostUsd: number;
  supplierName: string;
  status: StockStatus;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: 'receipt' | 'production_issue' | 'return' | 'scrap' | 'dispatch_out';
  quantity: number;
  unit: string;
  referenceNumber: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface InwardGateEntry {
  id: string;
  gatePassNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone?: string;
  supplierName: string;
  challanInvoiceNumber: string;
  yarnSku: string;
  yarnName: string;
  yarnType: string;
  yarnColor: string;
  yarnColorHex?: string;
  lotNumber: string;
  bagCount: number;
  coneCount?: number;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  moisturePercent: number;
  earmarkedOrderId?: string;
  earmarkedOrderNumber?: string;
  earmarkedCustomer?: string;
  allocatedStorageLocation: string;
  entryTimestamp: string;
  receivedBy: string;
  inspectionStatus: 'passed' | 'quarantine' | 'rejected';
  notes?: string;
}

export interface YarnFeasibilityResult {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  fabricType: string;
  lengthMeters: number;
  widthInches: number;
  gsm: number;
  yarnSpecs: string;
  calculatedYarnNeededKg: number;
  warpYarnKg: number;
  weftYarnKg: number;
  wastageFactorPercent: number;
  matchingInventoryItemId: string;
  matchingYarnSku: string;
  matchingYarnName: string;
  totalStockKg: number;
  reservedStockKg: number;
  availableStockKg: number;
  deficitKg: number;
  feasibilityStatus: 'ready' | 'partial' | 'deficit';
  readyToStartPercent: number;
  dailyBurnRateKg: number;
  runwayDays: number;
  recommendedSupplier: string;
  estimatedLeadTimeDays: number;
}

export type QualityDecision = 'pass' | 'rework' | 'hold' | 'reject';
export type DefectCategory = 'none' | 'weft_bar' | 'warp_streak' | 'color_shade_variance' | 'hole_snag' | 'oil_stain' | 'gsm_variance' | 'bowing_skewing' | 'selvedge_defect';
export type QualityGrade = 'Grade A (Export)' | 'Grade B' | 'Grade B (Quality Hold)' | 'Commercial' | 'Reject';

export interface QualityInspection {
  id: string;
  rollNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  fabricType: string;
  machineId: string;
  machineName: string;
  yarnLotNumber: string;
  dyeingBatchNumber: string;
  inspectorName: string;
  inspectionDate: string;
  sampleLengthMeters: number;
  defectCategory: DefectCategory;
  defectSeverity: 'none' | 'minor' | 'major' | 'critical';
  defectCount: number;
  measuredGsm: number;
  targetGsm: number;
  measuredWidthInches: number;
  targetWidthInches: number;
  grade: QualityGrade;
  decision: QualityDecision;
  reworkProcess?: string;
  comments: string;
  traceability: {
    spinLot: string;
    weaveLoom: string;
    dyeVessel: string;
    finishStenter: string;
  };
}

export interface FinishedGoodsRoll {
  id: string;
  rollBarcode: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  fabricType: string;
  color: string;
  gsm: number;
  widthInches: number;
  netLengthMeters: number;
  grossWeightKg: number;
  grade: QualityGrade;
  warehouseLocation: string; // e.g. "Rack D-12, Bin 4"
  status: 'in_warehouse' | 'reserved' | 'staged_for_dispatch' | 'dispatched';
  inspectionId: string;
  inspectionDate: string;
  inspectorName: string;
}

export interface DispatchRecord {
  id: string;
  dispatchNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  destinationCity: string;
  destinationAddress: string;
  carrierName: string;
  trackingNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  rollIds: string[];
  totalMeters: number;
  totalRolls: number;
  grossWeightKg: number;
  dispatchedAt: string;
  dispatchedBy: string;
  status: 'staged' | 'in_transit' | 'delivered';
  challanNumber: string;
  invoiceNumber?: string;
  notes?: string;
}

export type RescueSeverity = 'critical' | 'high' | 'medium';
export type RescueCategory = 'machine_breakdown' | 'material_shortage' | 'quality_spike' | 'deadline_bottleneck' | 'capacity_conflict';
export type RescueStatus = 'detected' | 'evaluating' | 'plan_selected' | 'approved' | 'in_execution' | 'resolved';

export interface RecoveryPlan {
  id: string;
  planCode: string;
  title: string;
  summary: string;
  strategyDescription: string;
  estimatedDelayChangeDays: number; // e.g. -2.5 days (reduction) or +0.5 days
  estimatedCostUsd: number;
  riskLevel: 'low' | 'medium' | 'high';
  feasibilityScorePercent: number;
  steps: string[];
  pros: string[];
  cons: string[];
  requiredApprovals: string[];
}

export interface RescueIssue {
  id: string;
  issueCode: string;
  title: string;
  severity: RescueSeverity;
  category: RescueCategory;
  affectedOrderId?: string;
  affectedOrderNumber?: string;
  customerName?: string;
  affectedMachineId?: string;
  affectedMachineName?: string;
  detectionTime: string;
  evidence: string[];
  likelyCause: string;
  impactAnalysis: {
    delayDays: number;
    costImpactUsd: number;
    orderAtRisk: string;
    description: string;
  };
  status: RescueStatus;
  recoveryPlans: RecoveryPlan[];
  selectedPlanId?: string;
  executionStatus?: string;
  approvedBy?: string;
  approvedAt?: string;
  resolutionNotes?: string;
}

export interface OperationalAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  entityType: 'machine' | 'order' | 'inventory' | 'quality' | 'rescue';
  entityId?: string;
  timestamp: string;
  actionUrl: string;
  actionLabel: string;
}

export interface ShiftWorker {
  id: string;
  name: string;
  employeeId: string;
  department: MachineProcessType;
  shift: 'Morning' | 'Evening' | 'Night';
  assignedMachine: string;
  skillLevel: 'Master Technician' | 'Senior Operator' | 'Junior Operator' | 'Trainee';
  attendanceStatus: 'present' | 'absent' | 'on_break';
  efficiencyScore: number;
}

export type UserRole = 'plant_manager' | 'production_supervisor' | 'quality_inspector' | 'inventory_lead' | 'buyer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarInitials: string;
}
