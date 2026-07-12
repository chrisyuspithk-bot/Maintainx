import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Supplier, Part, Project, PurchaseOrder, POItem, ApprovalRequest, MaintenanceContract, BreakdownLog, WorkOrder } from './types';
import { CURRENT_USER, callApi } from './api/client';
import {
  useSuppliers, useParts, useLocations, usePurchaseOrders, usePendingApprovals,
  useProjects, useContracts, useBreakdownLogs, useWorkOrders, useStockLevels, useToast
} from './hooks/useData';
import { Layout } from './components/Layout';
import { StatusBadge } from './components/ui/StatusBadge';
import { PriorityBadge } from './components/ui/PriorityBadge';
import { ToastContainer } from './components/ui/Toast';
import { CreateSupplier } from './components/modals/CreateSupplier';
import { CreatePart } from './components/modals/CreatePart';
import { CreatePO } from './components/modals/CreatePO';
import { ReceiveGoods } from './components/modals/ReceiveGoods';
import { CreateProject } from './components/modals/CreateProject';
import { CreateContract } from './components/modals/CreateContract';
import { CreateBreakdown } from './components/modals/CreateBreakdown';
import { CreateWorkOrder } from './components/modals/CreateWorkOrder';
import { CreateJobSheet } from './components/modals/CreateJobSheet';

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014';
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { parts, fetchParts } = useParts();
  const { locations, fetchLocations } = useLocations();
  const { pos, fetchPOs } = usePurchaseOrders();
  const { pendingApprovals, fetchPendingApprovals } = usePendingApprovals();
  const { projects, fetchProjects } = useProjects();
  const { contracts, fetchContracts } = useContracts();
  const { breakdownLogs, fetchBreakdownLogs } = useBreakdownLogs();
  const { workOrders, fetchWorkOrders } = useWorkOrders();
  const { stockLevels, fetchStockLevels } = useStockLevels();
  const { toasts, addToast } = useToast();

  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [showCreatePart, setShowCreatePart] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [receivePOId, setReceivePOId] = useState<number | undefined>(undefined);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [showCreateBreakdown, setShowCreateBreakdown] = useState(false);
  const [showCreateWorkOrder, setShowCreateWorkOrder] = useState(false);
  const [showCreateJobSheet, setShowCreateJobSheet] = useState(false);
  const [maintenanceTab, setMaintenanceTab] = useState<'contracts' | 'breakdowns' | 'workorders'>('contracts');
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [projectSummaryData, setProjectSummaryData] = useState<any>(null);

  const getPartName = (id: number) => parts.find(p => p.id === id)?.name || 'Part #' + id;
  const getSupplierName = (id: number) => suppliers.find(s => s.id === id)?.name || 'Supplier #' + id;
  const getProjectName = (id?: number) => id ? projects.find(p => p.id === id)?.name || 'Project #' + id : '\u2014';

  useEffect(() => {
    Promise.all([fetchSuppliers(), fetchParts(), fetchLocations(), fetchProjects(), fetchContracts()]);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/pos')) fetchPOs();
    if (path.startsWith('/approvals')) fetchPendingApprovals();
    if (path.startsWith('/maintenance')) { fetchContracts(); fetchBreakdownLogs(); fetchWorkOrders(); }
    if (path.startsWith('/inventory')) fetchStockLevels();
  }, [location.pathname]);

  const refreshAfterCreate = (type: string) => {
    if (type === 'supplier') fetchSuppliers();
    if (type === 'part') fetchParts();
    if (type === 'po') { fetchPOs(); setTimeout(fetchPendingApprovals, 300); }
    if (type === 'receive') { fetchPOs(); fetchStockLevels(); }
    if (type === 'project') fetchProjects();
    if (type === 'contract') fetchContracts();
    if (type === 'breakdown') fetchBreakdownLogs();
    if (type === 'workorder') fetchWorkOrders();
    if (type === 'jobsheet') fetchWorkOrders();
  };

  const viewProjectSummary = async (project: Project) => {
    try {
      const summary = await callApi('/api/projects/' + project.id + '/summary');
      setViewingProject(project);
      setProjectSummaryData(summary);
      navigate('/projects/' + project.id);
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={
            <Dashboard
              suppliers={suppliers} parts={parts} pos={pos} contracts={contracts}
              pendingApprovals={pendingApprovals} getSupplierName={getSupplierName}
              onNewPO={() => { navigate('/pos'); setShowCreatePO(true); }}
              onReceive={() => setShowReceive(true)}
              onBreakdown={() => setShowCreateBreakdown(true)}
            />
          } />
          <Route path="suppliers" element={
            <SuppliersView suppliers={suppliers} onCreate={() => setShowCreateSupplier(true)} />
          } />
          <Route path="parts" element={
            <PartsView parts={parts} onCreate={() => setShowCreatePart(true)} />
          } />
          <Route path="inventory" element={
            <InventoryView stockLevels={stockLevels} onRefresh={fetchStockLevels}
              onReceive={(_pid: number, _lid: number) => { setReceivePOId(undefined); setShowReceive(true); }} />
          } />
          <Route path="pos" element={
            <POListView pos={pos}
              getSupplierName={getSupplierName} getProjectName={getProjectName}
              onCreate={() => setShowCreatePO(true)}
              onReceive={(poId: number) => { setReceivePOId(poId); setShowReceive(true); }}
              onViewDetail={(po: PurchaseOrder) => { setViewingPO(po); navigate('/pos/' + po.id); }} />
          } />
          <Route path="pos/:id" element={
            <PODetailView viewingPO={viewingPO} pos={pos} getSupplierName={getSupplierName}
              getPartName={getPartName} onReceive={(poId: number) => { setReceivePOId(poId); setShowReceive(true); }} />
          } />
          <Route path="approvals" element={
            <ApprovalsView pendingApprovals={pendingApprovals} onRefresh={fetchPendingApprovals}
              onApprove={async (id: number) => {
                try { await callApi('/api/approvals/' + id + '/approve', { method: 'POST', body: JSON.stringify({ approved_by: CURRENT_USER }) }); fetchPendingApprovals(); fetchPOs(); addToast('Approved'); } catch (e: any) { addToast(e.message, 'error'); }
              }}
              onReject={async (id: number) => {
                try { await callApi('/api/approvals/' + id + '/reject', { method: 'POST', body: JSON.stringify({ approved_by: CURRENT_USER }) }); fetchPendingApprovals(); fetchPOs(); addToast('Rejected'); } catch (e: any) { addToast(e.message, 'error'); }
              }} />
          } />
          <Route path="projects" element={
            <ProjectsView projects={projects} onCreate={() => setShowCreateProject(true)}
              onViewSummary={viewProjectSummary} />
          } />
          <Route path="projects/:id" element={
            <ProjectDetailView viewingProject={viewingProject} projectSummaryData={projectSummaryData}
              onBack={() => { setViewingProject(null); setProjectSummaryData(null); navigate('/projects'); }} />
          } />
          <Route path="maintenance" element={
            <MaintenanceView
              tab={maintenanceTab} setTab={setMaintenanceTab}
              contracts={contracts} breakdownLogs={breakdownLogs} workOrders={workOrders}
              onCreateContract={() => setShowCreateContract(true)}
              onCreateBreakdown={() => setShowCreateBreakdown(true)}
              onCreateWorkOrder={() => setShowCreateWorkOrder(true)}
              onCreateJobSheet={() => setShowCreateJobSheet(true)} />
          } />
        </Route>
      </Routes>

      <CreateSupplier open={showCreateSupplier} onClose={() => setShowCreateSupplier(false)}
        onCreated={() => refreshAfterCreate('supplier')} onError={(m) => addToast(m, 'error')} />
      <CreatePart open={showCreatePart} onClose={() => setShowCreatePart(false)}
        onCreated={() => refreshAfterCreate('part')} onError={(m) => addToast(m, 'error')} />
      <CreatePO open={showCreatePO} onClose={() => setShowCreatePO(false)}
        suppliers={suppliers} parts={parts} projects={projects}
        onCreated={() => refreshAfterCreate('po')} onError={(m) => addToast(m, 'error')} />
      <ReceiveGoods open={showReceive} onClose={() => setShowReceive(false)}
        parts={parts} locations={locations} poId={receivePOId}
        onCreated={() => refreshAfterCreate('receive')} onError={(m) => addToast(m, 'error')} />
      <CreateProject open={showCreateProject} onClose={() => setShowCreateProject(false)}
        onCreated={() => refreshAfterCreate('project')} onError={(m) => addToast(m, 'error')} />
      <CreateContract open={showCreateContract} onClose={() => setShowCreateContract(false)}
        onCreated={() => refreshAfterCreate('contract')} onError={(m) => addToast(m, 'error')} />
      <CreateBreakdown open={showCreateBreakdown} onClose={() => setShowCreateBreakdown(false)}
        onCreated={() => refreshAfterCreate('breakdown')} onError={(m) => addToast(m, 'error')} />
      <CreateWorkOrder open={showCreateWorkOrder} onClose={() => setShowCreateWorkOrder(false)}
        onCreated={() => refreshAfterCreate('workorder')} onError={(m) => addToast(m, 'error')} />
      <CreateJobSheet open={showCreateJobSheet} onClose={() => setShowCreateJobSheet(false)}
        workOrders={workOrders} onCreated={() => refreshAfterCreate('jobsheet')} onError={(m) => addToast(m, 'error')} />

      <ToastContainer toasts={toasts} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// ==================== Page Sub-Components ====================

function Dashboard({ suppliers, parts, pos, contracts, pendingApprovals, getSupplierName, onNewPO, onReceive, onBreakdown }: any) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tighter">Good afternoon, Chris.</h1>
          <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening across SPIT operations today.</p>
        </div>
        <div className="text-right text-xs text-slate-400">Last synced just now</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ['Suppliers', suppliers.length, 'sky'],
          ['Parts', parts.length, 'violet'],
          ['Pending Approvals', pendingApprovals.length, 'amber'],
          ['Active Contracts', contracts.filter((c: any) => c.status === 'active').length, 'emerald'],
        ].map(([label, value, color]: any, i: number) => (
          <div key={i} className="bg-white rounded-3xl p-6 border shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className={'text-5xl font-semibold tracking-tighter mt-2 text-' + color + '-600'}>{value}</div>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <div className="text-sm font-medium mb-3 text-slate-500 px-1">QUICK ACTIONS</div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onNewPO} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 transition text-white rounded-2xl text-sm font-medium">+ New Purchase Order</button>
          <button onClick={onBreakdown} className="px-5 py-2.5 bg-white border hover:bg-slate-50 rounded-2xl text-sm font-medium">{'\uD83D\uDCDE'} Log Breakdown</button>
          <button onClick={() => navigate('/approvals')} className="px-5 py-2.5 bg-white border hover:bg-slate-50 rounded-2xl text-sm font-medium">Review Approvals ({pendingApprovals.length})</button>
          <button onClick={onReceive} className="px-5 py-2.5 bg-white border hover:bg-slate-50 rounded-2xl text-sm font-medium">{'\uD83D\uDCE5'} Receive Goods</button>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="font-medium">Recent Purchase Orders</div>
          <button onClick={() => navigate('/pos')} className="text-sky-600 text-sm hover:underline">View all {'\u2192'}</button>
        </div>
        <div className="bg-white rounded-3xl border overflow-hidden">
          {pos.slice(0, 5).length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr><th className="px-6 py-3 text-left font-normal">PO #</th><th className="px-6 py-3 text-left font-normal">Supplier</th><th className="px-6 py-3 text-left font-normal">Status</th><th className="px-6 py-3 text-right font-normal">Total</th></tr>
              </thead>
              <tbody className="divide-y">
                {pos.slice(0, 5).map((po: PurchaseOrder) => (
                  <tr key={po.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/pos/' + po.id)}>
                    <td className="px-6 py-3.5 font-mono text-xs">{po.po_number}</td>
                    <td className="px-6 py-3.5">{po.supplier?.name || getSupplierName(po.supplier_id)}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={po.status} /></td>
                    <td className="px-6 py-3.5 text-right font-medium tabular-nums">{po.total_amount || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="p-8 text-center text-slate-400 text-sm">No purchase orders yet. Create your first one!</div>}
        </div>
      </div>
    </div>
  );
}

function SuppliersView({ suppliers, onCreate }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Suppliers</h2>
        <button onClick={onCreate} className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm font-medium">+ Add Supplier</button>
      </div>
      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-xs text-slate-500"><th className="px-6 py-4 text-left">Name / Code</th><th className="px-6 py-4 text-left">Contact</th><th className="px-6 py-4 text-left">Lead Time</th><th className="px-6 py-4 text-left">Status</th></tr></thead>
          <tbody className="divide-y">
            {suppliers.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No suppliers yet. Add your first vendor.</td></tr>}
            {suppliers.map((s: Supplier) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-4"><div className="font-medium">{s.name}</div><div className="text-xs text-slate-400 font-mono">{s.code}</div></td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.contact_person || s.email || '\u2014'}</td>
                <td className="px-6 py-4">{s.lead_time_days || 14} days</td>
                <td className="px-6 py-4">{s.is_active !== false ? <span className="text-emerald-600 text-xs">Active</span> : <span className="text-red-500">Inactive</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PartsView({ parts, onCreate }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Parts Catalog</h2>
        <button onClick={onCreate} className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm font-medium">+ Add Part</button>
      </div>
      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-4 text-left">SKU / Name</th><th className="px-6 py-4 text-left">Category</th><th className="px-6 py-4 text-left">Criticality</th><th className="px-6 py-4 text-right">Reorder Pt / Qty</th></tr></thead>
          <tbody className="divide-y">
            {parts.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No parts defined yet.</td></tr>}
            {parts.map((p: Part) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4"><div className="font-medium">{p.name}</div><div className="font-mono text-xs text-slate-400">{p.sku}</div></td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.category || '\u2014'}</td>
                <td className="px-6 py-4"><PriorityBadge priority={p.criticality || 'medium'} /></td>
                <td className="px-6 py-4 text-right text-sm tabular-nums">{p.reorder_point} / {p.reorder_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryView({ stockLevels, onRefresh, onReceive }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Current Stock</h2>
        <div className="flex gap-3">
          <button onClick={onRefresh} className="px-4 py-2 border rounded-2xl text-sm hover:bg-slate-50">{'\u21BB'} Refresh</button>
          <button onClick={() => onReceive(0, 0)} className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium">{'\uD83D\uDCE5'} Receive Goods</button>
        </div>
      </div>
      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr><th className="px-6 py-4 text-left">Part</th><th className="px-6 py-4 text-left">Location</th><th className="px-6 py-4 text-right">Quantity</th><th className="px-6 py-4 text-right">Reserved</th><th className="px-6 py-4 text-left">Last Updated</th><th className="px-6 py-4 w-px"></th></tr>
          </thead>
          <tbody className="divide-y">
            {stockLevels.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No stock data yet.<br />Receive goods using the button above or from a Purchase Order.</td></tr>
            ) : stockLevels.map((item: any, index: number) => {
              const isLow = item.part?.reorder_point && item.quantity < item.part.reorder_point;
              return (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-medium">{item.part?.name || 'Unknown Part'}</div><div className="text-xs text-slate-400 font-mono">{item.part?.sku}</div></td>
                  <td className="px-6 py-4 text-sm">{item.locationName}</td>
                  <td className="px-6 py-4 text-right font-medium tabular-nums">{item.quantity}{isLow && <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Low</span>}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-500 tabular-nums">{item.reserved_quantity}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatDate(item.last_updated_at)}</td>
                  <td className="px-4 py-4"><button onClick={() => onReceive(item.part_id, item.location_id)} className="text-xs px-3 py-1.5 border rounded-xl hover:bg-emerald-50 text-emerald-700">Receive</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function POListView({ pos, getSupplierName, getProjectName, onCreate, onReceive, onViewDetail }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Purchase Orders</h2>
        <button onClick={onCreate} className="px-5 py-2.5 bg-sky-600 text-white rounded-2xl text-sm font-medium">+ Create PO</button>
      </div>
      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr><th className="px-6 py-4 text-left">PO Number</th><th className="px-6 py-4 text-left">Supplier</th><th className="px-6 py-4 text-left">Project</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-left">Date</th><th className="px-6 py-4 w-px"></th></tr>
          </thead>
          <tbody className="divide-y">
            {pos.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No purchase orders created yet.</td></tr>}
            {pos.map((po: PurchaseOrder) => (
              <tr key={po.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4 font-mono text-xs font-medium">{po.po_number}</td>
                <td className="px-6 py-4">{po.supplier?.name || getSupplierName(po.supplier_id)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{getProjectName(po.project_id)}</td>
                <td className="px-6 py-4"><StatusBadge status={po.status} /></td>
                <td className="px-6 py-4 text-right tabular-nums font-medium">{po.total_amount || '\u2014'}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{formatDate(po.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2 opacity-70 group-hover:opacity-100">
                    <button onClick={() => onViewDetail(po)} className="text-xs px-3 py-1 border rounded-xl hover:bg-white">View</button>
                    {(po.status === 'approved' || po.status === 'partially_received') && (
                      <button onClick={() => onReceive(po.id)} className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-xl">Receive</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PODetailView({ viewingPO, pos, getSupplierName, getPartName, onReceive }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const po = viewingPO || pos.find((p: PurchaseOrder) => p.id === Number(id));

  if (!po) return <div className="p-10 text-center text-slate-400">Loading purchase order...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <button onClick={() => navigate('/pos')} className="hover:text-sky-600">Purchase Orders</button>
        <span>{'\u203A'}</span>
        <span className="font-mono text-slate-700">{po.po_number}</span>
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="font-mono text-sm text-slate-400">{po.po_number}</div>
          <div className="text-3xl font-semibold tracking-tight">{getSupplierName(po.supplier_id)}</div>
          <div className="mt-1"><StatusBadge status={po.status} /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/pos')} className="px-5 py-2 border rounded-2xl text-sm hover:bg-slate-50">{'\u2190'} Back to List</button>
          {(po.status === 'approved' || po.status === 'partially_received') && (
            <button onClick={() => onReceive(po.id)} className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium">Receive Goods</button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-3xl border p-8">
        <div className="text-xs uppercase tracking-[1.5px] text-slate-400 mb-4">LINE ITEMS</div>
        {po.items && po.items.length > 0 ? (
          <div className="divide-y">
            {po.items.map((item: POItem, idx: number) => (
              <div key={idx} className="flex justify-between py-4">
                <div><div className="font-medium">{getPartName(item.part_id)}</div><div className="text-sm text-slate-500">Quantity: {item.quantity}</div></div>
                <div className="text-right"><div className="font-mono text-sm text-slate-600">@ {item.unit_price}</div><div className="font-semibold tabular-nums text-lg">{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</div></div>
              </div>
            ))}
          </div>
        ) : <div className="py-8 text-center text-slate-400">No line items found for this Purchase Order.</div>}
      </div>
    </div>
  );
}

function ApprovalsView({ pendingApprovals, onRefresh, onApprove, onReject }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Pending Approvals</h2>
        <button onClick={onRefresh} className="text-sm px-4 py-2 border rounded-2xl">Refresh</button>
      </div>
      <div className="bg-white rounded-3xl border divide-y">
        {pendingApprovals.length === 0 && <div className="p-10 text-center text-slate-400">No pending approvals {'\uD83C\uDF89'}</div>}
        {pendingApprovals.map((req: ApprovalRequest) => (
          <div key={req.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50">
            <div>
              <div className="font-medium capitalize">{req.document_type.replace('_', ' ')} #{req.document_id}</div>
              <div className="text-xs text-slate-500">Requested by {req.requested_by} {'\u2022'} {formatDate(req.created_at)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onApprove(req.id)} className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-2xl">Approve</button>
              <button onClick={() => onReject(req.id)} className="px-4 py-1.5 text-sm border text-red-600 border-red-200 hover:bg-red-50 rounded-2xl">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsView({ projects, onCreate, onViewSummary }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Projects</h2>
        <button onClick={onCreate} className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm">+ New Project</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 && <div className="col-span-2 p-8 bg-white rounded-3xl border text-center text-slate-400">No projects yet.</div>}
        {projects.map((p: Project) => (
          <div key={p.id} className="bg-white border rounded-3xl p-6 hover:shadow-md transition cursor-pointer" onClick={() => onViewSummary(p)}>
            <div className="font-semibold text-lg">{p.name}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{p.code}</div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <StatusBadge status={p.status || 'active'} />
              <span className="text-slate-400">{'\u2022'} Budget {p.budget || '\u2014'}</span>
            </div>
            <button className="mt-4 text-xs text-sky-600 hover:underline">View summary &amp; committed POs {'\u2192'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDetailView({ viewingProject, projectSummaryData, onBack }: any) {
  if (!viewingProject || !projectSummaryData) return <div className="p-10 text-center text-slate-400">Loading project...</div>;
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <button onClick={onBack} className="hover:text-sky-600">Projects</button>
        <span>{'\u203A'}</span>
        <span className="font-semibold text-slate-700">{viewingProject.name}</span>
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-3xl font-semibold tracking-tight">{viewingProject.name}</div>
          <div className="text-sm text-slate-500 font-mono mt-0.5">{viewingProject.code}</div>
        </div>
        <button onClick={onBack} className="px-5 py-2 border rounded-2xl text-sm">{'\u2190'} Back to Projects</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-3xl p-6"><div className="text-sm text-slate-500">Total Purchase Orders</div><div className="text-4xl font-semibold mt-2">{projectSummaryData.total_pos}</div></div>
        <div className="bg-white border rounded-3xl p-6"><div className="text-sm text-slate-500">Total Committed Amount</div><div className="text-4xl font-semibold mt-2 tabular-nums">{projectSummaryData.total_committed_amount}</div></div>
        <div className="bg-white border rounded-3xl p-6"><div className="text-sm text-slate-500 mb-3">Status Breakdown</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(projectSummaryData.status_breakdown || {}).map(([status, count]: any) => (
              <div key={status} className="px-3 py-1 bg-slate-100 rounded-full text-xs">{status.replace(/_/g, ' ')}: <span className="font-medium">{count}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceView({ tab, setTab, contracts, breakdownLogs, workOrders, onCreateContract, onCreateBreakdown, onCreateWorkOrder, onCreateJobSheet }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Maintenance Operations</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl text-sm">
          {(['contracts', 'breakdowns', 'workorders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={'px-5 py-1.5 rounded-[14px] capitalize transition ' + (tab === t ? 'bg-white shadow font-medium' : 'text-slate-600 hover:text-slate-900')}>
              {t === 'workorders' ? 'Work Orders' : t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'contracts' && (
        <div>
          <div className="flex justify-end mb-3"><button onClick={onCreateContract} className="text-sm px-4 py-2 border rounded-2xl">+ New Contract</button></div>
          <div className="bg-white rounded-3xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs"><tr><th className="px-6 py-3 text-left">Contract #</th><th className="px-6 py-3 text-left">Type / Status</th><th className="px-6 py-3 text-left">Period</th></tr></thead>
              <tbody className="divide-y">
                {contracts.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400">No maintenance contracts</td></tr>}
                {contracts.map((c: MaintenanceContract) => (
                  <tr key={c.id}><td className="px-6 py-4 font-mono text-xs">{c.contract_number}</td><td className="px-6 py-4">{c.type} <StatusBadge status={c.status || ''} /></td><td className="px-6 py-4 text-xs text-slate-500">{formatDate(c.start_date)} {'\u2192'} {formatDate(c.end_date)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'breakdowns' && (
        <div>
          <div className="flex justify-end mb-3"><button onClick={onCreateBreakdown} className="text-sm px-4 py-2 border rounded-2xl">+ Log Breakdown</button></div>
          <div className="space-y-3">
            {breakdownLogs.length === 0 && <div className="p-8 bg-white rounded-3xl border text-center text-slate-400">No breakdowns reported.</div>}
            {breakdownLogs.map((log: BreakdownLog) => (
              <div key={log.id} className="bg-white border rounded-2xl p-5 flex justify-between">
                <div><div className="font-medium">{log.description.slice(0, 80)}{log.description.length > 80 ? '...' : ''}</div><div className="text-xs text-slate-500 mt-1">{log.channel} {'\u2022'} {formatDate(log.created_at)}</div></div>
                <div className="flex flex-col items-end gap-1 text-xs"><PriorityBadge priority={log.priority} /> <StatusBadge status={log.status} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'workorders' && (
        <div>
          <div className="flex justify-end mb-3 gap-2">
            <button onClick={onCreateWorkOrder} className="text-sm px-4 py-2 border rounded-2xl">+ New Work Order</button>
            <button onClick={onCreateJobSheet} className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-2xl">Submit Job Sheet</button>
          </div>
          <div className="bg-white rounded-3xl border overflow-hidden text-sm">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3 text-left">Title</th><th className="px-6 py-3 text-left">Assigned</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Scheduled</th></tr></thead>
              <tbody className="divide-y">
                {workOrders.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No work orders</td></tr>}
                {workOrders.map((wo: WorkOrder) => (
                  <tr key={wo.id}><td className="px-6 py-4">{wo.title}</td><td className="px-6 py-4 text-xs text-slate-500">{wo.assigned_to || 'Unassigned'}</td><td className="px-6 py-4"><StatusBadge status={wo.status} /></td><td className="px-6 py-4 text-xs">{formatDate(wo.scheduled_date)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
