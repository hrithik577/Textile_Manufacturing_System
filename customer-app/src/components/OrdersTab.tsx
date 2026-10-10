import React, { useState } from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import { CustomerOrderRecord } from '../types';

export const OrdersTab: React.FC = () => {
  const { orders, setActiveTab } = useCustomerApp();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id || null);
  const [activeModal, setActiveModal] = useState<{ type: 'invoice' | 'certificate' | 'telemetry'; order: CustomerOrderRecord } | null>(null);

  const getStageIndex = (stage: CustomerOrderRecord['productionStage']) => {
    switch (stage) {
      case 'Order Confirmed': return 0;
      case 'Yarn Spinning': return 1;
      case 'Fabric Weaving': return 2;
      case 'Dyehouse': return 3;
      case 'QA Inspection': return 4;
      case 'Dispatched': return 5;
      case 'Delivered': return 6;
      default: return 0;
    }
  };

  const stages = [
    { title: 'Confirmed', desc: 'Order & GSM spec verified' },
    { title: 'Spinning', desc: 'Yarn tensioning & warp prep' },
    { title: 'Weaving', desc: 'Active on high-speed loom' },
    { title: 'Dyehouse', desc: 'Eco-reactive color fixation' },
    { title: 'QA Lab', desc: '100% 4-point visual scan' },
    { title: 'Dispatched', desc: 'Roll packaged & sealed' },
  ];

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm mx-4 mt-6">
        <div className="w-20 h-20 mx-auto mb-4 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-3xl">
          📦
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">No Orders Yet</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
          Order premium certified mill fabrics or request custom swatch sample kits directly to your doorstep.
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-teal-700/20 active:scale-95 transition-all text-sm"
        >
          Explore Fabric Bazaar
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-3 px-3 space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-4 rounded-2xl text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Live Mill Integration</span>
          </div>
          <h2 className="text-lg font-black mt-0.5">My Mill Orders & Tracking</h2>
          <p className="text-xs text-slate-300">Connected to Everest Smart Looms & Dyehouse IoT</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Total Orders</span>
          <span className="text-xl font-black text-white">{orders.length}</span>
        </div>
      </div>

      {/* Orders List */}
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        const currentStageIdx = getStageIndex(order.productionStage);

        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
          >
            {/* Top Order Card Header */}
            <div
              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">
                  🧵
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{order.orderNumber}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {order.placedAt}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • ₹{order.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    order.productionStage === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : order.productionStage === 'Dispatched'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-teal-100 text-teal-800 border border-teal-300'
                  }`}
                >
                  {order.productionStage}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Order Items Snapshot */}
            <div className="p-4 border-b border-slate-100">
              <div className="space-y-2.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: item.selectedColor.hex }}
                      />
                      <div>
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <div className="text-[11px] text-slate-500">
                          {item.selectedColor.name} • {item.isSampleOnly ? 'Sample Swatch Book' : `${item.quantityMeters} meters roll`}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expanded Detailed Section */}
            {isExpanded && (
              <div className="p-4 space-y-5 bg-slate-50/40">
                {/* Visual Mill Production Stage Tracker */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Live Mill Production Tracker
                    </h4>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {order.stageProgressPercent}% Complete
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-4">
                    <div
                      className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${order.stageProgressPercent}%` }}
                    />
                  </div>

                  {/* Stage Nodes */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {stages.map((stg, sIdx) => {
                      const isCompleted = sIdx < currentStageIdx || (sIdx === currentStageIdx && order.stageProgressPercent === 100);
                      const isCurrent = sIdx === currentStageIdx && order.stageProgressPercent < 100;

                      return (
                        <div
                          key={sIdx}
                          className={`p-2 rounded-xl text-center border text-[11px] flex flex-col justify-between ${
                            isCurrent
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-102 font-bold'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                              : 'bg-white text-slate-400 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="text-base mb-0.5">
                            {isCompleted ? '✓' : isCurrent ? '⚡' : '○'}
                          </div>
                          <div className="font-bold truncate">{stg.title}</div>
                          <div className={`text-[9px] mt-0.5 leading-tight ${isCurrent ? 'text-teal-100' : 'text-slate-500'}`}>
                            {stg.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mill Logistics & Assigned Machinery */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Loom Allocation</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      🏭 {order.assignedLoomMachine || 'Loom #W-03 (Air-Jet)'}
                    </span>
                    <span className="text-[10px] text-teal-600 font-medium">Auto-Tensioned Sensor</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">AWB Tracking #</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                      🚚 {order.carrierTrackingNumber || 'EVR-TRK-78921'}
                    </span>
                    <span className="text-[10px] text-slate-500">{order.carrierName || 'Everest Direct Fleet'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Delivery Location</span>
                    <span className="font-bold text-slate-800 block mt-0.5">
                      📍 {order.cityStatePincode}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Est. Arrival</span>
                    <span className="font-bold text-emerald-700 block mt-0.5">
                      🗓 {order.estimatedDeliveryDate}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Invoice, QA Cert, Telemetry */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setActiveModal({ type: 'invoice', order })}
                    className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all shadow-sm active:scale-98"
                  >
                    <span className="text-base mb-1">📄</span>
                    <span>GST Invoice</span>
                  </button>

                  <button
                    onClick={() => setActiveModal({ type: 'certificate', order })}
                    className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all shadow-sm active:scale-98"
                  >
                    <span className="text-base mb-1">🏅</span>
                    <span>QA Certificate</span>
                  </button>

                  <button
                    onClick={() => setActiveModal({ type: 'telemetry', order })}
                    className="flex flex-col items-center justify-center p-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold transition-all shadow-sm active:scale-98"
                  >
                    <span className="text-base mb-1">📊</span>
                    <span>Loom Telemetry</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pop-up Modals for GST Invoice, QA Certificate, Telemetry */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                  Everest Textile OS Verified
                </span>
                <h3 className="font-bold text-base">
                  {activeModal.type === 'invoice' && 'Tax Invoice (GST Compliant)'}
                  {activeModal.type === 'certificate' && 'Fabric Laboratory QA Certificate'}
                  {activeModal.type === 'telemetry' && 'Live Loom Telemetry & Quality Sensor Feed'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs text-slate-700">
              {activeModal.type === 'invoice' && (
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-3">
                    <div>
                      <div className="font-black text-slate-900 text-sm">EVEREST TEXTILE MILLS LTD.</div>
                      <div className="text-[11px] text-slate-500">Mill Gate 4, Textile Hub, Surat, Gujarat - 395002</div>
                      <div className="text-[11px] font-mono font-bold text-teal-700 mt-1">GSTIN: 24AAACE1234F1Z8</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">INVOICE: INV-{activeModal.order.orderNumber}</div>
                      <div className="text-slate-500">Date: {activeModal.order.placedAt}</div>
                      <div className="text-emerald-600 font-bold">STATUS: {activeModal.order.paymentStatus.toUpperCase()}</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-800 mb-1">Billed To:</div>
                    <div className="font-semibold text-slate-900">{activeModal.order.customerName}</div>
                    <div className="text-slate-500">{activeModal.order.deliveryAddress}, {activeModal.order.cityStatePincode}</div>
                    {activeModal.order.gstNumber && (
                      <div className="font-mono text-teal-700 font-bold mt-0.5">GSTIN: {activeModal.order.gstNumber}</div>
                    )}
                  </div>

                  <table className="w-full border text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 border">Description</th>
                        <th className="p-2 border text-center">HSN</th>
                        <th className="p-2 border text-right">Qty</th>
                        <th className="p-2 border text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModal.order.items.map((item, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 border">
                            <span className="font-bold text-slate-900">{item.title}</span>
                            <div className="text-[10px] text-slate-500">{item.selectedColor.name} ({item.selectedColor.hex})</div>
                          </td>
                          <td className="p-2 border text-center font-mono">5208</td>
                          <td className="p-2 border text-right font-medium">
                            {item.isSampleOnly ? '1 Swatch' : `${item.quantityMeters} m`}
                          </td>
                          <td className="p-2 border text-right font-bold">
                            ₹{item.totalPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-right font-medium border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-bold">₹{activeModal.order.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CGST (2.5%) + SGST (2.5%):</span>
                      <span className="font-bold">₹{activeModal.order.gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Express Mill Freight:</span>
                      <span className="font-bold">FREE (B2B Promotion)</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1.5">
                      <span>Total Invoice Value:</span>
                      <span className="text-teal-700">₹{activeModal.order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModal.type === 'certificate' && (
                <div className="space-y-4">
                  <div className="text-center pb-2 border-b">
                    <div className="text-2xl font-black text-slate-900 tracking-wider">CERTIFICATE OF ANALYSIS</div>
                    <div className="text-xs text-teal-700 font-bold">ISO 9001:2015 & OEKO-TEX Standard 100 Certified</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Cert ID: QA-EVR-{activeModal.order.qualityCertificateNumber || activeModal.order.orderNumber}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                    <div><span className="text-slate-400 block font-bold text-[10px]">INSPECTION METHOD</span>ASTM D5430 (4-Point System)</div>
                    <div><span className="text-slate-400 block font-bold text-[10px]">DEFECT PENALTY SCORE</span>&lt; 8 points / 100 sq.yd (Grade A)</div>
                    <div><span className="text-slate-400 block font-bold text-[10px]">COLOR FASTNESS TO WASH</span>Grade 4.5 / 5.0 (ISO 105-C06)</div>
                    <div><span className="text-slate-400 block font-bold text-[10px]">TEAR & TENSILE STRENGTH</span>Warp: 420N / Weft: 380N</div>
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-medium">
                    <span className="font-bold block mb-0.5">QA Inspector Sign-off:</span>
                    100% optical sensor batch inspection cleared at Everest Finishing Unit #2. Free from heavy metals, formaldehyde, and azo colorants.
                  </div>
                </div>
              )}

              {activeModal.type === 'telemetry' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-teal-50 p-3 rounded-xl border border-teal-200">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase">Assigned Workstation</span>
                      <div className="text-sm font-black text-slate-900">{activeModal.order.assignedLoomMachine || 'Loom #W-03'}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[11px] font-bold animate-pulse">
                      ● Active Weaving
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-slate-50 border rounded-xl text-center">
                      <span className="text-slate-400 text-[10px] block font-bold">RPM</span>
                      <span className="text-base font-black text-slate-800">840</span>
                      <span className="text-[9px] text-emerald-600 block font-semibold">Nominal Speed</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border rounded-xl text-center">
                      <span className="text-slate-400 text-[10px] block font-bold">WARP TENSION</span>
                      <span className="text-base font-black text-slate-800">22.4 cN</span>
                      <span className="text-[9px] text-emerald-600 block font-semibold">Optimal</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border rounded-xl text-center">
                      <span className="text-slate-400 text-[10px] block font-bold">DEFECT STOP</span>
                      <span className="text-base font-black text-emerald-700">0</span>
                      <span className="text-[9px] text-slate-500 block font-semibold">Clean Roll</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[10px] space-y-1">
                    <div>[SYS] Loom telemetry linked to Customer Order #{activeModal.order.orderNumber}</div>
                    <div>[IOT] Laser warp sensor calibrated: 100% pick rate</div>
                    <div>[DYE] Temperature maintained at 98.4°C in liquor chamber</div>
                    <div className="text-teal-400">[DISP] Barcode registered: {activeModal.order.carrierTrackingNumber || 'EVR-TRK-78921'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>🖨</span>
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
