export interface Supplier {
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

export interface Part {
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

export interface Location {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface Project {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  budget?: string;
}

export interface PurchaseOrder {
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

export interface POItem {
  id: number;
  po_id: number;
  part_id: number;
  quantity: number;
  unit_price: string;
  received_quantity?: number;
  part?: Part;
}

export interface ApprovalRequest {
  id: number;
  document_type: string;
  document_id: number;
  requested_by: string;
  status: string;
  created_at: string;
}

export interface MaintenanceContract {
  id: number;
  contract_number: string;
  project_id?: number ;
 type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface BreakdownLog {
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

export interface WorkOrder {
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

export interface JobSheet {
  id: number;
  work_order_id: number;
  performed_by: string;
  work_done?: string;
  parts_used?: string;
  customer_name?: string;
  notes?: string;
  completed_at: string;
}

export type ViewMode = 'dashboard' | 'suppliers' | 'parts' | 'inventory' | 'pos' | 'po-detail' | 'project-detail' | 'approvals' | 'projects' | 'maintenance';
export type MaintenanceTab = 'contracts' | 'breakdowns' | 'workorders';
