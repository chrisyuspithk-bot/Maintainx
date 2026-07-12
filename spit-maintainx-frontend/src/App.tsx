import React, { useState, useEffect } from 'react';

// ==================== Types ====================
interface Supplier {
  id: number;
  name: string;
  code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days?: number;
  is_active?: boolean;
}

interface Part {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  min_stock?: number;
  max_stock?: number;
  reorder_point?: number;
  reorder_qty?: number;
  default_supplier_id?: number;
  average_cost?: string;
  is_active?: boolean;
}

interface StockLevel {
  id: number;
  part_id: number;
  location_id: number;
  quantity: number;
  reserved_quantity: number;
  last_updated_at: string;
}

interface Location {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

interface Project {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  budget?: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  project_id?: number;
  status: string;
  total_amount?: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  project?: Project;
  items?: POItem[];
}

interface POItem {
  id: number;
  po_id: number;
  part_id: number;
  quantity: number;
  unit_price: string;
  received_quantity?: number;
  part?: Part;
}

interface ApprovalRequest {
  id: number;
  document_type: string;
  document_id: number;
  requested_by: string;
  status: string;
  created_at: string;
}

interface MaintenanceContract {
  id: number;
  contract_number: string;
  project_id?: number;
  type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

interface BreakdownLog {
  id: number;
  maintenance_contract_id?: number;
  project_id?: number;
  channel: string;
  reported_by?: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface WorkOrder {
  id: number;
  breakdown_log_id?: number;
  maintenance_contract_id?: number;
  title: string;
  description?: string;
  status: string;
  assigned_to?: string;
  scheduled_date?: string;
  completed_at?: string;
}

interface JobSheet {
  id: number;
  work_order_id: number;
  performed_by: string;
  work_done?: string;
  parts_used?: string;
  customer_name?: string;
  notes?: string;
  completed_at: string;
}

// ==================== Config ====================
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8787';
const CURRENT_USER = 'chris.yu@spit.hk';

// ==================== App Component ====================
function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'suppliers' | 'parts' | 'inventory' | 'pos' | 'po-detail' | 'project-detail' | 'approvals' | 'projects' | 'maintenance'>('dashboard');
  const [maintenanceTab, setMaintenanceTab] = useState<'contracts' | 'breakdowns' | 'workorders'>('contracts');

  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);
  const [breakdownLogs, setBreakdownLogs] = useState<BreakdownLog[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stockLevels, setStockLevels] = useState<any[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [projectSummaryData, setProjectSummaryData] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSummary, setProjectSummary] = useState<any>(null);

  // Modals
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [showCreatePart, setShowCreatePart] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [showCreateBreakdown, setShowCreateBreakdown] = useState(false);
  const [showCreateWorkOrder, setShowCreateWorkOrder] = useState(false);
  const [showCreateJobSheet, setShowCreateJobSheet] = useState(false);

  // Form states
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', code: '', contact_person: '', email: '', lead_time_days: 14 });
  const [newPart, setNewPart] = useState<Partial<Part>>({ sku: '', name: '', criticality: 'medium', min_stock: 0, reorder_point: 5, reorder_qty: 10 });
  const [newPO, setNewPO] = useState<{ supplier_id: number; project_id?: number; notes?: string; items: Array<{ part_id: number; quantity: number; unit_price: number }> }>({
    supplier_id: 0,
    items: []
  });
  const [newReceive, setNewReceive] = useState({ part_id: 0, location_id: 0, quantity: 1, unit_cost: 0, po_id: undefined as number | undefined, notes: '' });
  const [newProject, setNewProject] = useState<Partial<Project>>({ name: '', code: '', description: '' });
  const [newContract, setNewContract] = useState<Partial<MaintenanceContract>>({ contract_number: '', type: 'paid', status: 'active' });
  const [newBreakdown, setNewBreakdown] = useState<Partial<BreakdownLog>>({ channel: 'email', priority: 'medium', status: 'open', description: '' });
  const [newWorkOrder, setNewWorkOrder] = useState<Partial<WorkOrder>>({ title: '', status: 'open' });
  const [newJobSheet, setNewJobSheet] = useState<Partial<JobSheet>>({ performed_by: CURRENT_USER, work_done: '', parts_used: '' });

  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // ==================== API Helper ====================
  const callApi = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const errMsg = json.error || `Request failed (${res.status})`;
      throw new Error(errMsg);
    }
    return (json.data ?? json) as T;
  };

  // ==================== Fetchers ====================
  const fetchSuppliers = async () => {
    try { const data = await callApi<Supplier[]>('/api/suppliers'); setSuppliers(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchParts = async () => {
    try { const data = await callApi<Part[]>('/api/parts'); setParts(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchLocations = async () => {
    try { const data = await callApi<Location[]>('/api/locations'); setLocations(data || []); } 
    catch (e: any) { /* optional */ }
  };
  const fetchPOs = async () => {
    try { const data = await callApi<PurchaseOrder[]>('/api/pos?limit=100'); setPOs(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchPendingApprovals = async () => {
    try { const data = await callApi<ApprovalRequest[]>('/api/approvals/pending'); setPendingApprovals(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchProjects = async () => {
    try { const data = await callApi<Project[]>('/api/projects'); setProjects(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchContracts = async () => {
    try { const data = await callApi<MaintenanceContract[]>('/api/maintenance-contracts'); setContracts(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchBreakdownLogs = async () => {
    try { const data = await callApi<BreakdownLog[]>('/api/breakdown-logs'); setBreakdownLogs(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };
  const fetchWorkOrders = async () => {
    try { const data = await callApi<WorkOrder[]>('/api/work-orders'); setWorkOrders(data || []); } 
    catch (e: any) { addToast(e.message, 'error'); }
  };

  const fetchStockLevels = async () => {
    try {
      const [levels, partsList, locationsList] = await Promise.all([
        callApi<any[]>('/api/inventory'),
        callApi<Part[]>('/api/parts'),
        callApi<Location[]>('/api/locations'),
      ]);

      const enriched = levels.map((level: any) => {
        const part = partsList.find(p => p.id === level.part_id);
        const location = locationsList.find(l => l.id === level.location_id);
        return {
          ...level,
          part,
          locationName: location?.name || `Location #${level.location_id}`,
        };
      });

      setStockLevels(enriched);
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSuppliers(),
        fetchParts(),
        fetchLocations(),
        fetchProjects(),
        fetchContracts(),
      ]);
      setIsLoading(false);
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy load per view
  useEffect(() => {
    if (currentView === 'pos' && pos.length === 0) fetchPOs();
    if (currentView === 'approvals' && pendingApprovals.length === 0) fetchPendingApprovals();
    if (currentView === 'maintenance' && contracts.length === 0) fetchContracts();
    if (currentView === 'maintenance' && breakdownLogs.length === 0) fetchBreakdownLogs();
    if (currentView === 'maintenance' && workOrders.length === 0) fetchWorkOrders();
    if (currentView === 'inventory') fetchStockLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // ==================== Actions ====================
  const createSupplier = async () => {
    if (!newSupplier.name) { addToast('Name is required', 'error'); return; }
    try {
      await callApi('/api/suppliers', { method: 'POST', body: JSON.stringify({ ...newSupplier, created_by: CURRENT_USER }) });
      addToast('Supplier created successfully');
      setShowCreateSupplier(false);
      setNewSupplier({ name: '', code: '', contact_person: '', email: '', lead_time_days: 14 });
      fetchSuppliers();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createPart = async () => {
    if (!newPart.sku || !newPart.name) { addToast('SKU and Name required', 'error'); return; }
    try {
      await callApi('/api/parts', { method: 'POST', body: JSON.stringify({ ...newPart, created_by: CURRENT_USER }) });
      addToast('Part created successfully');
      setShowCreatePart(false);
      setNewPart({ sku: '', name: '', criticality: 'medium', min_stock: 0, reorder_point: 5, reorder_qty: 10 });
      fetchParts();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createPO = async () => {
    if (!newPO.supplier_id || newPO.items.length === 0) {
      addToast('Select supplier and add at least one item', 'error'); return;
    }
    try {
      const payload = {
        supplier_id: newPO.supplier_id,
        project_id: newPO.project_id || null,
        notes: newPO.notes || null,
        created_by: CURRENT_USER,
        items: newPO.items.map(i => ({
          part_id: i.part_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      };
      await callApi('/api/pos', { method: 'POST', body: JSON.stringify(payload) });
      addToast('Purchase Order created');
      setShowCreatePO(false);
      setNewPO({ supplier_id: 0, items: [] });
      fetchPOs();
      // Auto refresh approvals if needed
      setTimeout(fetchPendingApprovals, 300);
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const addPOLine = () => {
    setNewPO(prev => ({
      ...prev,
      items: [...prev.items, { part_id: parts[0]?.id || 0, quantity: 1, unit_price: 0 }]
    }));
  };

  const updatePOLine = (index: number, field: string, value: any) => {
    setNewPO(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const removePOLine = (index: number) => {
    setNewPO(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const receiveGoods = async () => {
    if (!newReceive.part_id || !newReceive.location_id || newReceive.quantity <= 0) {
      addToast('Part, Location and positive quantity required', 'error'); return;
    }
    try {
      await callApi('/api/inventory/receive', {
        method: 'POST',
        body: JSON.stringify({
          ...newReceive,
          created_by: CURRENT_USER,
          po_id: newReceive.po_id || undefined
        })
      });
      addToast('Goods received - stock updated');
      setShowReceive(false);
      setNewReceive({ part_id: 0, location_id: 0, quantity: 1, unit_cost: 0, po_id: undefined, notes: '' });
      fetchPOs();

      // Auto-refresh Inventory if user is on that page
      if (currentView === 'inventory') {
        fetchStockLevels();
      }
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const approveRequest = async (id: number) => {
    const comment = prompt('Optional comment for approval:') || '';
    try {
      await callApi(`/api/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved_by: CURRENT_USER, comment })
      });
      addToast('Request approved');
      fetchPendingApprovals();
      fetchPOs();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const rejectRequest = async (id: number) => {
    const comment = prompt('Reason for rejection:') || '';
    try {
      await callApi(`/api/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ approved_by: CURRENT_USER, comment })
      });
      addToast('Request rejected');
      fetchPendingApprovals();
      fetchPOs();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createProject = async () => {
    if (!newProject.name) { addToast('Project name required', 'error'); return; }
    try {
      await callApi('/api/projects', { method: 'POST', body: JSON.stringify({ ...newProject, created_by: CURRENT_USER }) });
      addToast('Project created');
      setShowCreateProject(false);
      setNewProject({ name: '', code: '', description: '' });
      fetchProjects();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const viewProjectSummary = async (project: Project) => {
    try {
      const summary = await callApi(`/api/projects/${project.id}/summary`);
      setViewingProject(project);
      setProjectSummaryData(summary);
      setCurrentView('project-detail');
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createContract = async () => {
    if (!newContract.contract_number) { addToast('Contract number required', 'error'); return; }
    try {
      await callApi('/api/maintenance-contracts', { method: 'POST', body: JSON.stringify({ ...newContract, created_by: CURRENT_USER }) });
      addToast('Maintenance contract created');
      setShowCreateContract(false);
      setNewContract({ contract_number: '', type: 'paid', status: 'active' });
      fetchContracts();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createBreakdown = async () => {
    if (!newBreakdown.description) { addToast('Description required', 'error'); return; }
    try {
      await callApi('/api/breakdown-logs', { method: 'POST', body: JSON.stringify(newBreakdown) });
      addToast('Breakdown logged');
      setShowCreateBreakdown(false);
      setNewBreakdown({ channel: 'email', priority: 'medium', status: 'open', description: '' });
      fetchBreakdownLogs();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createWorkOrder = async () => {
    if (!newWorkOrder.title) { addToast('Title required', 'error'); return; }
    try {
      await callApi('/api/work-orders', { method: 'POST', body: JSON.stringify({ ...newWorkOrder, created_by: CURRENT_USER }) });
      addToast('Work order created');
      setShowCreateWorkOrder(false);
      setNewWorkOrder({ title: '', status: 'open' });
      fetchWorkOrders();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const createJobSheet = async () => {
    if (!newJobSheet.work_order_id || !newJobSheet.performed_by) {
      addToast('Work Order and Performed By required', 'error'); return;
    }
    try {
      await callApi('/api/job-sheets', { method: 'POST', body: JSON.stringify(newJobSheet) });
      addToast('Job sheet submitted - Work Order marked completed');
      setShowCreateJobSheet(false);
      setNewJobSheet({ performed_by: CURRENT_USER, work_done: '', parts_used: '' });
      fetchWorkOrders();
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  // ==================== Helpers ====================
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'received': 'bg-blue-100 text-blue-800',
      'partially_received': 'bg-cyan-100 text-cyan-800',
      'rejected': 'bg-red-100 text-red-800',
      'open': 'bg-orange-100 text-orange-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      'closed': 'bg-gray-100 text-gray-800',
      'active': 'bg-emerald-100 text-emerald-800',
      'draft': 'bg-gray-100 text-gray-700',
    };
    const cls = map[status] || 'bg-gray-100 text-gray-700';
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status.replace(/_/g, ' ')}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${map[priority] || ''}`}>{priority}</span>;
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const getPartName = (id: number) => parts.find(p => p.id === id)?.name || `Part #${id}`;
  const getSupplierName = (id: number) => suppliers.find(s => s.id === id)?.name || `Supplier #${id}`;
  const getLocationName = (id: number) => locations.find(l => l.id === id)?.name || `Loc #${id}`;
  const getProjectName = (id?: number) => id ? projects.find(p => p.id === id)?.name || `Project #${id}` : '—';

  // ==================== Render ====================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center text-white font-bold text-xl tracking-tighter">S</div>
            <div>
              <div className="font-semibold text-xl tracking-tight">SPIT MaintainX</div>
              <div className="text-[10px] text-slate-500 -mt-1">Maintenance • Inventory • Procurement</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">{API_BASE}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {CURRENT_USER}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs px-3 py-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 text-slate-600"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white min-h-[calc(100vh-4rem)] p-3">
          <nav className="space-y-1 text-sm">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '◉' },
              { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
              { id: 'parts', label: 'Parts Catalog', icon: '📦' },
              { id: 'inventory', label: 'Inventory', icon: '📊' },
              { id: 'pos', label: 'Purchase Orders', icon: '📝' },
              { id: 'approvals', label: 'Approvals Queue', icon: '✅' },
              { id: 'projects', label: 'Projects', icon: '📁' },
              { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-all ${currentView === item.id 
                  ? 'bg-sky-50 text-sky-700 font-medium shadow-sm' 
                  : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <span className="text-lg w-5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 px-4 text-[10px] text-slate-400">
            Phase 1–4 • Cloudflare Workers + Neon
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-[1100px]">
          {/* DASHBOARD */}
          {currentView === 'dashboard' && (
            <div>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-semibold tracking-tighter">Good afternoon, Chris.</h1>
                  <p className="text-slate-500 mt-1">Here's what's happening across SPIT operations today.</p>
                </div>
                <div className="text-right text-xs text-slate-400">Last synced just now</div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Suppliers', value: suppliers.length, color: 'sky' },
                  { label: 'Parts', value: parts.length, color: 'violet' },
                  { label: 'Pending Approvals', value: pendingApprovals.length, color: 'amber' },
                  { label: 'Active Contracts', value: contracts.filter(c => c.status === 'active').length, color: 'emerald' },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 border shadow-sm">
                    <div className="text-sm text-slate-500">{kpi.label}</div>
                    <div className={`text-5xl font-semibold tracking-tighter mt-2 text-${kpi.color}-600`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <div className="text-sm font-medium mb-3 text-slate-500 px-1">QUICK ACTIONS</div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => { setCurrentView('pos'); setShowCreatePO(true); }} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 transition text-white rounded-2xl text-sm font-medium flex items-center gap-2">+ New Purchase Order</button>
                  <button onClick={() => setShowCreateBreakdown(true)} className="px-5 py-2.5 bg-white border hover:bg-slate-50 rounded-2xl text-sm font-medium flex items-center gap-2">📞 Log Breakdown</button>
                  <button onClick={() => setCurrentView('approvals')} className="px-5 py-2.5 bg-white border hover:bg-slate-50 rounded-2xl text-sm font-medium flex items-center gap-2">Review Approvals ({pendingApprovals.length})</button>
                  <button onClick={() => setShowReceive(true)} className="px-5 py-2.5 bg-white border hover:bg-slate-50 rounded-2xl text-sm font-medium flex items-center gap-2">📥 Receive Goods</button>
                </div>
              </div>

              {/* Recent POs preview */}
              <div>
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="font-medium">Recent Purchase Orders</div>
                  <button onClick={() => setCurrentView('pos')} className="text-sky-600 text-sm hover:underline">View all →</button>
                </div>
                <div className="bg-white rounded-3xl border overflow-hidden">
                  {pos.slice(0, 5).length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs">
                        <tr><th className="px-6 py-3 text-left font-normal">PO #</th><th className="px-6 py-3 text-left font-normal">Supplier</th><th className="px-6 py-3 text-left font-normal">Status</th><th className="px-6 py-3 text-right font-normal">Total</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {pos.slice(0, 5).map(po => (
                          <tr key={po.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedPO(po); setCurrentView('pos'); }}>
                            <td className="px-6 py-3.5 font-mono text-xs">{po.po_number}</td>
                            <td className="px-6 py-3.5">{po.supplier?.name || getSupplierName(po.supplier_id)}</td>
                            <td className="px-6 py-3.5">{getStatusBadge(po.status)}</td>
                            <td className="px-6 py-3.5 text-right font-medium tabular-nums">{po.total_amount || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="p-8 text-center text-slate-400 text-sm">No purchase orders yet. Create your first one!</div>}
                </div>
              </div>
            </div>
          )}

          {/* SUPPLIERS */}
          {currentView === 'suppliers' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Suppliers</h2>
                <button onClick={() => setShowCreateSupplier(true)} className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm font-medium">+ Add Supplier</button>
              </div>
              <div className="bg-white rounded-3xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs text-slate-500"><th className="px-6 py-4 text-left">Name / Code</th><th className="px-6 py-4 text-left">Contact</th><th className="px-6 py-4 text-left">Lead Time</th><th className="px-6 py-4 text-left">Status</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {suppliers.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No suppliers yet. Add your first vendor.</td></tr>}
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4"><div className="font-medium">{s.name}</div><div className="text-xs text-slate-400 font-mono">{s.code}</div></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{s.contact_person || s.email || '—'}</td>
                        <td className="px-6 py-4">{s.lead_time_days || 14} days</td>
                        <td className="px-6 py-4">{s.is_active !== false ? <span className="text-emerald-600 text-xs">Active</span> : <span className="text-red-500">Inactive</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PARTS */}
          {currentView === 'parts' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Parts Catalog</h2>
                <button onClick={() => setShowCreatePart(true)} className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm font-medium">+ Add Part</button>
              </div>
              <div className="bg-white rounded-3xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr><th className="px-6 py-4 text-left">SKU / Name</th><th className="px-6 py-4 text-left">Category</th><th className="px-6 py-4 text-left">Criticality</th><th className="px-6 py-4 text-right">Reorder Pt / Qty</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {parts.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No parts defined yet.</td></tr>}
                    {parts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4"><div className="font-medium">{p.name}</div><div className="font-mono text-xs text-slate-400">{p.sku}</div></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{p.category || '—'}</td>
                        <td className="px-6 py-4">{getPriorityBadge(p.criticality || 'medium')}</td>
                        <td className="px-6 py-4 text-right text-sm tabular-nums">{p.reorder_point} / {p.reorder_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVENTORY - FIXED */}
          {currentView === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Current Stock</h2>
                <div className="flex gap-3">
                  <button onClick={fetchStockLevels} className="px-4 py-2 border rounded-2xl text-sm hover:bg-slate-50">↻ Refresh</button>
                  <button onClick={() => setShowReceive(true)} className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium">📥 Receive Goods</button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-6 py-4 text-left">Part</th>
                      <th className="px-6 py-4 text-left">Location</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4 text-right">Reserved</th>
                      <th className="px-6 py-4 text-left">Last Updated</th>
                      <th className="px-6 py-4 w-px"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stockLevels.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No stock data yet.<br />
                          Receive goods using the button above or from a Purchase Order.
                        </td>
                      </tr>
                    ) : (
                      stockLevels.map((item, index) => {
                        const isLowStock = item.part?.reorder_point && item.quantity < item.part.reorder_point;
                        return (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="font-medium">{item.part?.name || 'Unknown Part'}</div>
                              <div className="text-xs text-slate-400 font-mono">{item.part?.sku}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{item.locationName}</td>
                            <td className="px-6 py-4 text-right font-medium tabular-nums">
                              {item.quantity}
                              {isLowStock && <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Low</span>}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-slate-500 tabular-nums">{item.reserved_quantity}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{formatDate(item.last_updated_at)}</td>
                            <td className="px-4 py-4">
                              <button 
                                onClick={() => {
                                  setNewReceive({
                                    part_id: item.part_id,
                                    location_id: item.location_id,
                                    quantity: 1,
                                    unit_cost: 0,
                                    po_id: undefined,
                                    notes: ''
                                  });
                                  setShowReceive(true);
                                }}
                                className="text-xs px-3 py-1.5 border rounded-xl hover:bg-emerald-50 text-emerald-700"
                              >
                                Receive
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PURCHASE ORDERS */}
          {currentView === 'pos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Purchase Orders</h2>
                <button onClick={() => setShowCreatePO(true)} className="px-5 py-2.5 bg-sky-600 text-white rounded-2xl text-sm font-medium">+ Create PO</button>
              </div>

              <div className="bg-white rounded-3xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-6 py-4 text-left">PO Number</th>
                      <th className="px-6 py-4 text-left">Supplier</th>
                      <th className="px-6 py-4 text-left">Project</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 w-px"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pos.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No purchase orders created yet.</td></tr>}
                    {pos.map(po => (
                      <tr key={po.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 font-mono text-xs font-medium">{po.po_number}</td>
                        <td className="px-6 py-4">{po.supplier?.name || getSupplierName(po.supplier_id)}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{getProjectName(po.project_id)}</td>
                        <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-medium">{po.total_amount || '—'}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{formatDate(po.created_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 opacity-70 group-hover:opacity-100">
                            <button 
                              onClick={async () => {
                                try {
                                  const fullPO = await callApi<PurchaseOrder>(`/api/pos/${po.id}`);
                                  setViewingPO(fullPO);
                                  setCurrentView('po-detail');
                                } catch (e: any) {
                                  addToast(e.message, 'error');
                                }
                              }} 
                              className="text-xs px-3 py-1 border rounded-xl hover:bg-white"
                            >
                              View
                            </button>
                            {po.status === 'pending_approval' && (
                              <button onClick={() => { /* quick submit for approval if needed */ }} className="text-xs px-3 py-1 border rounded-xl text-amber-600 hover:bg-amber-50">Submit</button>
                            )}
                            {(po.status === 'approved' || po.status === 'partially_received') && (
                              <button onClick={() => { setNewReceive({ ...newReceive, po_id: po.id }); setShowReceive(true); }} className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-xl">Receive</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PO Detail Modal */}
              {selectedPO && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setSelectedPO(null)}>
                  <div className="bg-white w-full max-w-2xl rounded-3xl p-8" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between">
                      <div>
                        <div className="font-mono text-sm text-slate-400">{selectedPO.po_number}</div>
                        <div className="text-2xl font-semibold">{getSupplierName(selectedPO.supplier_id)}</div>
                      </div>
                      {getStatusBadge(selectedPO.status)}
                    </div>

                    <div className="mt-6 border-t pt-6">
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Line Items</div>
                      {selectedPO.items && selectedPO.items.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPO.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm bg-slate-50 px-4 py-2 rounded-2xl">
                              <div>{getPartName(item.part_id)} × {item.quantity}</div>
                              <div className="font-mono">@ {item.unit_price} = {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm text-slate-400">No line items loaded (fetch full PO details if needed)</div>}
                    </div>

                    <div className="mt-8 flex gap-3 justify-end">
                      <button onClick={() => setSelectedPO(null)} className="px-5 py-2 text-sm">Close</button>
                      {(selectedPO.status === 'approved' || selectedPO.status === 'partially_received') && (
                        <button onClick={() => { setNewReceive({ ...newReceive, po_id: selectedPO.id }); setSelectedPO(null); setShowReceive(true); }} className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm">Receive Goods</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PO DETAIL VIEW (Full page + Breadcrumb) */}
          {currentView === 'po-detail' && viewingPO && (
            <div>
              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <button 
                  onClick={() => { setCurrentView('pos'); setViewingPO(null); }} 
                  className="hover:text-sky-600 transition-colors"
                >
                  Purchase Orders
                </button>
                <span>›</span>
                <span className="font-mono text-slate-700">{viewingPO.po_number}</span>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="font-mono text-sm text-slate-400">{viewingPO.po_number}</div>
                  <div className="text-3xl font-semibold tracking-tight">{getSupplierName(viewingPO.supplier_id)}</div>
                  <div className="mt-1">{getStatusBadge(viewingPO.status)}</div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setCurrentView('pos'); setViewingPO(null); }} 
                    className="px-5 py-2 border rounded-2xl text-sm hover:bg-slate-50"
                  >
                    ← Back to List
                  </button>
                  {(viewingPO.status === 'approved' || viewingPO.status === 'partially_received') && (
                    <button 
                      onClick={() => { 
                        setNewReceive({ ...newReceive, po_id: viewingPO.id }); 
                        setShowReceive(true); 
                      }} 
                      className="px-5 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-medium"
                    >
                      Receive Goods
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border p-8">
                <div className="text-xs uppercase tracking-[1.5px] text-slate-400 mb-4">LINE ITEMS</div>

                {viewingPO.items && viewingPO.items.length > 0 ? (
                  <div className="divide-y">
                    {viewingPO.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-4">
                        <div>
                          <div className="font-medium">{getPartName(item.part_id)}</div>
                          <div className="text-sm text-slate-500">Quantity: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm text-slate-600">@ {item.unit_price}</div>
                          <div className="font-semibold tabular-nums text-lg">
                            {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">No line items found for this Purchase Order.</div>
                )}
              </div>
            </div>
          )}

          {/* APPROVALS */}
          {currentView === 'approvals' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Pending Approvals</h2>
                <button onClick={fetchPendingApprovals} className="text-sm px-4 py-2 border rounded-2xl">Refresh</button>
              </div>

              <div className="bg-white rounded-3xl border divide-y">
                {pendingApprovals.length === 0 && <div className="p-10 text-center text-slate-400">No pending approvals 🎉</div>}
                {pendingApprovals.map(req => (
                  <div key={req.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-medium capitalize">{req.document_type.replace('_', ' ')} #{req.document_id}</div>
                      <div className="text-xs text-slate-500">Requested by {req.requested_by} • {formatDate(req.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => approveRequest(req.id)} className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-2xl">Approve</button>
                      <button onClick={() => rejectRequest(req.id)} className="px-4 py-1.5 text-sm border text-red-600 border-red-200 hover:bg-red-50 rounded-2xl">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {currentView === 'projects' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Projects</h2>
                <button onClick={() => setShowCreateProject(true)} className="px-4 py-2 bg-sky-600 text-white rounded-2xl text-sm">+ New Project</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.length === 0 && <div className="col-span-2 p-8 bg-white rounded-3xl border text-center text-slate-400">No projects yet.</div>}
                {projects.map(p => (
                  <div key={p.id} className="bg-white border rounded-3xl p-6 hover:shadow-md transition cursor-pointer" onClick={() => viewProjectSummary(p)}>
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{p.code}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      {getStatusBadge(p.status || 'active')}
                      <span className="text-slate-400">• Budget {p.budget || '—'}</span>
                    </div>
                    <button className="mt-4 text-xs text-sky-600 hover:underline">View summary &amp; committed POs →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT DETAIL VIEW (Full page + Breadcrumb) */}
          {currentView === 'project-detail' && viewingProject && projectSummaryData && (
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <button onClick={() => { setCurrentView('projects'); setViewingProject(null); setProjectSummaryData(null); }} className="hover:text-sky-600">Projects</button>
                <span>›</span>
                <span className="font-semibold text-slate-700">{viewingProject.name}</span>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-3xl font-semibold tracking-tight">{viewingProject.name}</div>
                  <div className="text-sm text-slate-500 font-mono mt-0.5">{viewingProject.code}</div>
                </div>
                <button onClick={() => { setCurrentView('projects'); setViewingProject(null); setProjectSummaryData(null); }} className="px-5 py-2 border rounded-2xl text-sm">← Back to Projects</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border rounded-3xl p-6">
                  <div className="text-sm text-slate-500">Total Purchase Orders</div>
                  <div className="text-4xl font-semibold mt-2">{projectSummaryData.total_pos}</div>
                </div>
                <div className="bg-white border rounded-3xl p-6">
                  <div className="text-sm text-slate-500">Total Committed Amount</div>
                  <div className="text-4xl font-semibold mt-2 tabular-nums">{projectSummaryData.total_committed_amount}</div>
                </div>
                <div className="bg-white border rounded-3xl p-6">
                  <div className="text-sm text-slate-500 mb-3">Status Breakdown</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(projectSummaryData.status_breakdown || {}).map(([status, count]) => (
                      <div key={status} className="px-3 py-1 bg-slate-100 rounded-full text-xs">
                        {status.replace(/_/g, ' ')}: <span className="font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAINTENANCE */}
          {currentView === 'maintenance' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">Maintenance Operations</h2>
                <div className="flex bg-slate-100 p-1 rounded-2xl text-sm">
                  {(['contracts', 'breakdowns', 'workorders'] as const).map(tab => (
                    <button key={tab} onClick={() => setMaintenanceTab(tab)} className={`px-5 py-1.5 rounded-[14px] capitalize transition ${maintenanceTab === tab ? 'bg-white shadow font-medium' : 'text-slate-600 hover:text-slate-900'}`}>
                      {tab === 'workorders' ? 'Work Orders' : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contracts */}
              {maintenanceTab === 'contracts' && (
                <div>
                  <div className="flex justify-end mb-3"><button onClick={() => setShowCreateContract(true)} className="text-sm px-4 py-2 border rounded-2xl">+ New Contract</button></div>
                  <div className="bg-white rounded-3xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs"><tr><th className="px-6 py-3 text-left">Contract #</th><th className="px-6 py-3 text-left">Type / Status</th><th className="px-6 py-3 text-left">Period</th></tr></thead>
                      <tbody className="divide-y">
                        {contracts.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400">No maintenance contracts</td></tr>}
                        {contracts.map(c => (
                          <tr key={c.id}><td className="px-6 py-4 font-mono text-xs">{c.contract_number}</td><td className="px-6 py-4">{c.type} {getStatusBadge(c.status || '')}</td><td className="px-6 py-4 text-xs text-slate-500">{formatDate(c.start_date)} → {formatDate(c.end_date)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Breakdowns */}
              {maintenanceTab === 'breakdowns' && (
                <div>
                  <div className="flex justify-end mb-3"><button onClick={() => setShowCreateBreakdown(true)} className="text-sm px-4 py-2 border rounded-2xl">+ Log Breakdown</button></div>
                  <div className="bg-white rounded-3xl border divide-y text-sm">
                    {breakdownLogs.length === 0 && <div className="p-8 text-center text-slate-400">No breakdown reports</div>}
                    {breakdownLogs.map(log => (
                      <div key={log.id} className="px-6 py-4 flex justify-between items-start">
                        <div>
                          <div className="font-medium line-clamp-2">{log.description}</div>
                          <div className="text-xs text-slate-500 mt-1">{log.channel} • {log.reported_by || 'Anonymous'} • {formatDate(log.created_at)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs">{getPriorityBadge(log.priority)} {getStatusBadge(log.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Orders */}
              {maintenanceTab === 'workorders' && (
                <div>
                  <div className="flex justify-end mb-3 gap-2">
                    <button onClick={() => setShowCreateWorkOrder(true)} className="text-sm px-4 py-2 border rounded-2xl">+ New Work Order</button>
                    <button onClick={() => setShowCreateJobSheet(true)} className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-2xl">Submit Job Sheet</button>
                  </div>
                  <div className="bg-white rounded-3xl border overflow-hidden text-sm">
                    <table className="w-full">
                      <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3 text-left">Title</th><th className="px-6 py-3 text-left">Assigned</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Scheduled</th></tr></thead>
                      <tbody className="divide-y">
                        {workOrders.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No work orders</td></tr>}
                        {workOrders.map(wo => (
                          <tr key={wo.id}>
                            <td className="px-6 py-4">{wo.title}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{wo.assigned_to || 'Unassigned'}</td>
                            <td className="px-6 py-4">{getStatusBadge(wo.status)}</td>
                            <td className="px-6 py-4 text-xs">{formatDate(wo.scheduled_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========== MODALS ========== */}

      {/* Create Supplier Modal */}
      {showCreateSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreateSupplier(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-6">New Supplier</h3>
            <div className="space-y-4">
              <input className="w-full border rounded-2xl px-4 py-3 text-sm" placeholder="Company Name *" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input className="border rounded-2xl px-4 py-3 text-sm" placeholder="Code (e.g. TPHK)" value={newSupplier.code} onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value })} />
                <input className="border rounded-2xl px-4 py-3 text-sm" placeholder="Contact Person" value={newSupplier.contact_person} onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
              </div>
              <input className="w-full border rounded-2xl px-4 py-3 text-sm" placeholder="Email" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input className="border rounded-2xl px-4 py-3 text-sm" placeholder="Lead Time (days)" type="number" value={newSupplier.lead_time_days} onChange={e => setNewSupplier({ ...newSupplier, lead_time_days: parseInt(e.target.value) || 14 })} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCreateSupplier(false)} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
              <button onClick={createSupplier} className="flex-1 py-3 text-sm bg-sky-600 text-white rounded-2xl font-medium">Create Supplier</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Part Modal */}
      {showCreatePart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreatePart(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-6">New Part / SKU</h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <input className="border rounded-2xl px-4 py-3" placeholder="SKU *" value={newPart.sku} onChange={e => setNewPart({ ...newPart, sku: e.target.value })} />
                <select className="border rounded-2xl px-4 py-3" value={newPart.criticality} onChange={e => setNewPart({ ...newPart, criticality: e.target.value as any })}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="Part Name *" value={newPart.name} onChange={e => setNewPart({ ...newPart, name: e.target.value })} />
              <input className="w-full border rounded-2xl px-4 py-3" placeholder="Category (optional)" value={newPart.category} onChange={e => setNewPart({ ...newPart, category: e.target.value })} />
              <div className="grid grid-cols-3 gap-4">
                <input type="number" className="border rounded-2xl px-4 py-3" placeholder="Min Stock" value={newPart.min_stock} onChange={e => setNewPart({ ...newPart, min_stock: parseInt(e.target.value) })} />
                <input type="number" className="border rounded-2xl px-4 py-3" placeholder="Reorder Point" value={newPart.reorder_point} onChange={e => setNewPart({ ...newPart, reorder_point: parseInt(e.target.value) })} />
                <input type="number" className="border rounded-2xl px-4 py-3" placeholder="Reorder Qty" value={newPart.reorder_qty} onChange={e => setNewPart({ ...newPart, reorder_qty: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCreatePart(false)} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
              <button onClick={createPart} className="flex-1 py-3 text-sm bg-sky-600 text-white rounded-2xl font-medium">Create Part</button>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal (with dynamic lines) */}
      {showCreatePO && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[70] pt-10" onClick={() => setShowCreatePO(false)}>
          <div className="bg-white w-full max-w-3xl rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold tracking-tight mb-6">Create Purchase Order</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">SUPPLIER</label>
                <select className="w-full border rounded-2xl px-4 py-3 text-sm" value={newPO.supplier_id} onChange={e => setNewPO({ ...newPO, supplier_id: parseInt(e.target.value) })}>
                  <option value={0}>Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">PROJECT (OPTIONAL)</label>
                <select className="w-full border rounded-2xl px-4 py-3 text-sm" value={newPO.project_id || ''} onChange={e => setNewPO({ ...newPO, project_id: e.target.value ? parseInt(e.target.value) : undefined })}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[1px] text-slate-500">LINE ITEMS</div>
              <button onClick={addPOLine} className="text-xs px-3 py-1 border rounded-xl hover:bg-slate-50">+ Add Item</button>
            </div>

            {newPO.items.length === 0 && <div className="text-center py-6 text-sm text-slate-400 border rounded-2xl mb-4">No items added yet</div>}

            {newPO.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-center bg-slate-50 p-3 rounded-2xl">
                <div className="col-span-5">
                  <select className="w-full text-sm border rounded-xl px-3 py-2" value={item.part_id} onChange={e => updatePOLine(index, 'part_id', parseInt(e.target.value))}>
                    {parts.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" className="w-full text-sm border rounded-xl px-3 py-2" placeholder="Qty" value={item.quantity} onChange={e => updatePOLine(index, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                <div className="col-span-3">
                  <input type="number" step="0.01" className="w-full text-sm border rounded-xl px-3 py-2" placeholder="Unit Price" value={item.unit_price} onChange={e => updatePOLine(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button onClick={() => removePOLine(index)} className="text-red-500 text-xs px-3">Remove</button>
                </div>
              </div>
            ))}

            <textarea className="w-full mt-2 border rounded-2xl p-4 text-sm h-20" placeholder="Notes / justification..." value={newPO.notes || ''} onChange={e => setNewPO({ ...newPO, notes: e.target.value })} />

            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowCreatePO(false); setNewPO({ supplier_id: 0, items: [] }); }} className="flex-1 py-3 border text-sm rounded-2xl">Cancel</button>
              <button onClick={createPO} className="flex-1 py-3 bg-sky-600 text-white text-sm rounded-2xl font-medium disabled:opacity-50" disabled={!newPO.supplier_id || newPO.items.length === 0}>Create Purchase Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowReceive(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-1">Receive Goods</h3>
            <p className="text-xs text-slate-500 mb-6">This will create an inventory transaction and update stock levels.</p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-slate-500">PART</label>
                <select className="mt-1 w-full border rounded-2xl px-4 py-3" value={newReceive.part_id} onChange={e => setNewReceive({ ...newReceive, part_id: parseInt(e.target.value) })}>
                  <option value={0}>Select part...</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">LOCATION / WAREHOUSE</label>
                <select className="mt-1 w-full border rounded-2xl px-4 py-3" value={newReceive.location_id} onChange={e => setNewReceive({ ...newReceive, location_id: parseInt(e.target.value) })}>
                  <option value={0}>Select location...</option>
                  {locations.length > 0 ? locations.map(l => <option key={l.id} value={l.id}>{l.name} {l.code ? `(${l.code})` : ''}</option>) : <option disabled>No locations defined (add via API)</option>}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">QUANTITY</label>
                  <input type="number" className="mt-1 w-full border rounded-2xl px-4 py-3" value={newReceive.quantity} onChange={e => setNewReceive({ ...newReceive, quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">UNIT COST (optional)</label>
                  <input type="number" step="0.01" className="mt-1 w-full border rounded-2xl px-4 py-3" value={newReceive.unit_cost} onChange={e => setNewReceive({ ...newReceive, unit_cost: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">LINK TO PO (optional)</label>
                <input type="number" className="mt-1 w-full border rounded-2xl px-4 py-3" placeholder="PO ID" value={newReceive.po_id || ''} onChange={e => setNewReceive({ ...newReceive, po_id: e.target.value ? parseInt(e.target.value) : undefined })} />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowReceive(false)} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
              <button onClick={receiveGoods} className="flex-1 py-3 text-sm bg-emerald-600 text-white rounded-2xl font-medium">Confirm Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* Other simple modals (Project, Contract, etc) - abbreviated for brevity but fully functional */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreateProject(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-6">New Project</h3>
            <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Project Name *" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
            <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Code (optional)" value={newProject.code} onChange={e => setNewProject({ ...newProject, code: e.target.value })} />
            <textarea className="w-full border rounded-2xl px-4 py-3 h-24 mb-6" placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
            <div className="flex gap-3">
              <button onClick={() => setShowCreateProject(false)} className="flex-1 py-3 text-sm border rounded-2xl">Cancel</button>
              <button onClick={createProject} className="flex-1 py-3 text-sm bg-sky-600 text-white rounded-2xl font-medium">Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Summary Modal */}
      {selectedProject && projectSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => { setSelectedProject(null); setProjectSummary(null); }}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-2xl tracking-tight">{selectedProject.name}</h3>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-3xl font-semibold">{projectSummary.total_pos}</div><div className="text-xs text-slate-500 mt-1">Total POs</div></div>
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-3xl font-semibold tabular-nums">{projectSummary.total_committed_amount}</div><div className="text-xs text-slate-500 mt-1">Committed (HKD)</div></div>
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-3xl font-semibold">{Object.keys(projectSummary.status_breakdown || {}).length}</div><div className="text-xs text-slate-500 mt-1">Statuses</div></div>
            </div>
            <button onClick={() => { setSelectedProject(null); setProjectSummary(null); }} className="mt-8 w-full py-3 text-sm border rounded-2xl">Close</button>
          </div>
        </div>
      )}

      {/* Maintenance quick modals (Contract / Breakdown / Work Order / Job Sheet) */}
      {showCreateContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreateContract(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-xl mb-5">New Maintenance Contract</h3>
            <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Contract Number *" value={newContract.contract_number} onChange={e => setNewContract({ ...newContract, contract_number: e.target.value })} />
            <div className="grid grid-cols-2 gap-3 mb-6">
              <select className="border rounded-2xl px-4 py-3" value={newContract.type} onChange={e => setNewContract({ ...newContract, type: e.target.value })}>
                <option value="paid">Paid</option><option value="free">Free / Warranty</option>
              </select>
              <select className="border rounded-2xl px-4 py-3" value={newContract.status} onChange={e => setNewContract({ ...newContract, status: e.target.value })}>
                <option value="active">Active</option><option value="expired">Expired</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateContract(false)} className="flex-1 py-3 border rounded-2xl">Cancel</button>
              <button onClick={createContract} className="flex-1 py-3 bg-sky-600 text-white rounded-2xl">Create Contract</button>
            </div>
          </div>
        </div>
      )}

      {showCreateBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreateBreakdown(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-xl mb-5">Log Equipment Breakdown</h3>
            <textarea className="w-full border rounded-2xl p-4 h-28 mb-4" placeholder="Describe the issue..." value={newBreakdown.description} onChange={e => setNewBreakdown({ ...newBreakdown, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3 mb-6">
              <select className="border rounded-2xl px-4 py-3" value={newBreakdown.channel} onChange={e => setNewBreakdown({ ...newBreakdown, channel: e.target.value })}>
                <option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="others">Other</option>
              </select>
              <select className="border rounded-2xl px-4 py-3" value={newBreakdown.priority} onChange={e => setNewBreakdown({ ...newBreakdown, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateBreakdown(false)} className="flex-1 py-3 border rounded-2xl">Cancel</button>
              <button onClick={createBreakdown} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl">Log Breakdown</button>
            </div>
          </div>
        </div>
      )}

      {showCreateWorkOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreateWorkOrder(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-xl mb-5">Create Work Order</h3>
            <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Work Order Title *" value={newWorkOrder.title} onChange={e => setNewWorkOrder({ ...newWorkOrder, title: e.target.value })} />
            <textarea className="w-full border rounded-2xl p-4 h-20 mb-4" placeholder="Description / scope of work" value={newWorkOrder.description} onChange={e => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })} />
            <input className="w-full border rounded-2xl px-4 py-3 mb-6" placeholder="Assigned To (name or email)" value={newWorkOrder.assigned_to} onChange={e => setNewWorkOrder({ ...newWorkOrder, assigned_to: e.target.value })} />
            <div className="flex gap-3">
              <button onClick={() => setShowCreateWorkOrder(false)} className="flex-1 py-3 border rounded-2xl">Cancel</button>
              <button onClick={createWorkOrder} className="flex-1 py-3 bg-sky-600 text-white rounded-2xl">Create Work Order</button>
            </div>
          </div>
        </div>
      )}

      {showCreateJobSheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setShowCreateJobSheet(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 text-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-xl mb-5">Complete Work with Job Sheet</h3>
            <select className="w-full border rounded-2xl px-4 py-3 mb-3" value={newJobSheet.work_order_id || ''} onChange={e => setNewJobSheet({ ...newJobSheet, work_order_id: parseInt(e.target.value) })}>
              <option value="">Select Work Order...</option>
              {workOrders.filter(w => w.status !== 'completed').map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
            <input className="w-full border rounded-2xl px-4 py-3 mb-3" placeholder="Performed By *" value={newJobSheet.performed_by} onChange={e => setNewJobSheet({ ...newJobSheet, performed_by: e.target.value })} />
            <textarea className="w-full border rounded-2xl p-4 h-20 mb-3" placeholder="Work done / findings" value={newJobSheet.work_done} onChange={e => setNewJobSheet({ ...newJobSheet, work_done: e.target.value })} />
            <input className="w-full border rounded-2xl px-4 py-3 mb-6" placeholder="Parts used (comma separated)" value={newJobSheet.parts_used} onChange={e => setNewJobSheet({ ...newJobSheet, parts_used: e.target.value })} />
            <div className="flex gap-3">
              <button onClick={() => setShowCreateJobSheet(false)} className="flex-1 py-3 border rounded-2xl">Cancel</button>
              <button onClick={createJobSheet} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl">Submit &amp; Complete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[80] space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-5 py-3 rounded-2xl shadow-lg text-sm flex items-center gap-3 max-w-xs ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
