import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Enums
// ============================================

export const documentStatusEnum = pgEnum('document_status', [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'sent',
  'partially_received',
  'received',
  'closed',
  'cancelled',
]);

export const approvalActionEnum = pgEnum('approval_action', [
  'approved',
  'rejected',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'receipt',
  'issue',
  'adjustment_in',
  'adjustment_out',
  'return_to_supplier',
]);

export const partCriticalityEnum = pgEnum('part_criticality', [
  'low',
  'medium',
  'high',
  'critical',
]);

// ============================================
// Core Tables
// ============================================

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  contact_person: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  payment_terms: text('payment_terms'),
  lead_time_days: integer('lead_time_days').default(14),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: text('created_by').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('suppliers_name_idx').on(table.name),
}));

export const parts = pgTable('parts', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  unit: text('unit').default('pcs'),
  criticality: partCriticalityEnum('criticality').default('medium'),
  min_stock: integer('min_stock').default(0),
  max_stock: integer('max_stock'),
  reorder_point: integer('reorder_point').default(5),
  reorder_qty: integer('reorder_qty').default(10),
  default_supplier_id: integer('default_supplier_id').references(() => suppliers.id),
  average_cost: decimal('average_cost', { precision: 12, scale: 2 }),
  last_cost: decimal('last_cost', { precision: 12, scale: 2 }),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: text('created_by').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  skuIdx: uniqueIndex('parts_sku_idx').on(table.sku),
}));

export const stockLocations = pgTable('stock_locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Projects (Phase 3)
// ============================================

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  status: text('status').default('active'), // active, completed, on_hold, cancelled
  budget: decimal('budget', { precision: 12, scale: 2 }),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const stockLevels = pgTable('stock_levels', {
  id: serial('id').primaryKey(),
  part_id: integer('part_id').notNull().references(() => parts.id, { onDelete: 'cascade' }),
  location_id: integer('location_id').notNull().references(() => stockLocations.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  reserved_quantity: integer('reserved_quantity').notNull().default(0),
  last_updated_at: timestamp('last_updated_at').defaultNow().notNull(),
}, (table) => ({
  partLocationIdx: uniqueIndex('stock_part_location_idx').on(table.part_id, table.location_id),
}));

export const inventoryTransactions = pgTable('inventory_transactions', {
  id: serial('id').primaryKey(),
  part_id: integer('part_id').notNull().references(() => parts.id),
  location_id: integer('location_id').notNull().references(() => stockLocations.id),
  transaction_type: transactionTypeEnum('transaction_type').notNull(),
  quantity: integer('quantity').notNull(),
  unit_cost: decimal('unit_cost', { precision: 12, scale: 2 }),
  reference_type: text('reference_type'),
  reference_id: integer('reference_id'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: text('created_by').notNull(),
}, (table) => ({
  partIdx: index('inv_trans_part_idx').on(table.part_id),
}));

// ============================================
// Requisitions & Purchase Orders (with Approval)
// ============================================

export const requisitions = pgTable('requisitions', {
  id: serial('id').primaryKey(),
  requisition_number: text('requisition_number').notNull().unique(),
  status: documentStatusEnum('status').default('pending_approval').notNull(),
  requested_by: text('requested_by').notNull(),
  department: text('department'),
  project_id: integer('project_id'),
  justification: text('justification'),
  total_estimated_cost: decimal('total_estimated_cost', { precision: 12, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const requisitionItems = pgTable('requisition_items', {
  id: serial('id').primaryKey(),
  requisition_id: integer('requisition_id').notNull().references(() => requisitions.id, { onDelete: 'cascade' }),
  part_id: integer('part_id').notNull().references(() => parts.id),
  quantity: integer('quantity').notNull(),
  estimated_unit_price: decimal('estimated_unit_price', { precision: 12, scale: 2 }),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  po_number: text('po_number').notNull().unique(),
  supplier_id: integer('supplier_id').notNull().references(() => suppliers.id),
  project_id: integer('project_id').references(() => projects.id),
  status: documentStatusEnum('status').default('pending_approval').notNull(),
  requisition_id: integer('requisition_id').references(() => requisitions.id),
  order_date: timestamp('order_date').defaultNow(),
  expected_delivery_date: timestamp('expected_delivery_date'),
  total_amount: decimal('total_amount', { precision: 12, scale: 2 }),
  notes: text('notes'),
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  po_id: integer('po_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  part_id: integer('part_id').notNull().references(() => parts.id),
  quantity: integer('quantity').notNull(),
  unit_price: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  received_quantity: integer('received_quantity').default(0),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Approval System (Phase 2 - 1 Level)
// ============================================

export const approvalRequests = pgTable('approval_requests', {
  id: serial('id').primaryKey(),
  document_type: text('document_type').notNull(), // 'requisition' | 'purchase_order'
  document_id: integer('document_id').notNull(),
  requested_by: text('requested_by').notNull(),
  status: text('status').default('pending').notNull(), // pending | approved | rejected
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  approval_request_id: integer('approval_request_id').notNull().references(() => approvalRequests.id),
  action: approvalActionEnum('action').notNull(),
  comment: text('comment'),
  approved_by: text('approved_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const requisitionsRelations = relations(requisitions, ({ one, many }) => ({
  items: many(requisitionItems),
  project: one(projects, {
    fields: [requisitions.project_id],
    references: [projects.id],
    relationName: 'project_requisitions',
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  purchaseOrders: many(purchaseOrders, { relationName: 'project_purchase_orders' }),
  requisitions: many(requisitions, { relationName: 'project_requisitions' }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplier_id], references: [suppliers.id] }),
  project: one(projects, {
    fields: [purchaseOrders.project_id],
    references: [projects.id],
    relationName: 'project_purchase_orders',
  }),
  items: many(purchaseOrderItems),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ many }) => ({
  approvals: many(approvals),
}));

// ============================================
// Phase 4: Maintenance (Core)
// ============================================

export const maintenanceContracts = pgTable('maintenance_contracts', {
  id: serial('id').primaryKey(),
  contract_number: text('contract_number').notNull().unique(),
  project_id: integer('project_id').references(() => projects.id),
  type: text('type').default('paid'), // free, paid
  status: text('status').default('active'), // active, expired, terminated
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  notes: text('notes'),
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const breakdownLogs = pgTable('breakdown_logs', {
  id: serial('id').primaryKey(),
  maintenance_contract_id: integer('maintenance_contract_id').references(() => maintenanceContracts.id),
  project_id: integer('project_id').references(() => projects.id),
  channel: text('channel').notNull(), // phone, whatsapp, email, others
  reported_by: text('reported_by'),
  contact_info: text('contact_info'),
  description: text('description').notNull(),
  priority: text('priority').default('medium'), // low, medium, high, critical
  status: text('status').default('open'), // open, in_progress, resolved, closed
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  breakdown_log_id: integer('breakdown_log_id').references(() => breakdownLogs.id),
  maintenance_contract_id: integer('maintenance_contract_id').references(() => maintenanceContracts.id),
  asset_id: integer('asset_id'), // optional for now
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('open'), // open, assigned, in_progress, completed, cancelled
  assigned_to: text('assigned_to'),
  scheduled_date: timestamp('scheduled_date'),
  completed_at: timestamp('completed_at'),
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const jobSheets = pgTable('job_sheets', {
  id: serial('id').primaryKey(),
  work_order_id: integer('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  performed_by: text('performed_by').notNull(),
  work_done: text('work_done'),
  parts_used: text('parts_used'),
  customer_name: text('customer_name'),
  customer_signature: text('customer_signature'),
  notes: text('notes'),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Phase 4 Relations (must be defined AFTER all tables)
// ============================================

export const maintenanceContractsRelations = relations(maintenanceContracts, ({ one, many }) => ({
  project: one(projects, { fields: [maintenanceContracts.project_id], references: [projects.id] }),
  breakdownLogs: many(breakdownLogs),
  workOrders: many(workOrders),
}));

export const breakdownLogsRelations = relations(breakdownLogs, ({ one, many }) => ({
  maintenanceContract: one(maintenanceContracts, { fields: [breakdownLogs.maintenance_contract_id], references: [maintenanceContracts.id] }),
  project: one(projects, { fields: [breakdownLogs.project_id], references: [projects.id] }),
  workOrders: many(workOrders),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  breakdownLog: one(breakdownLogs, { fields: [workOrders.breakdown_log_id], references: [breakdownLogs.id] }),
  maintenanceContract: one(maintenanceContracts, { fields: [workOrders.maintenance_contract_id], references: [maintenanceContracts.id] }),
  jobSheet: one(jobSheets),
}));

export const jobSheetsRelations = relations(jobSheets, ({ one }) => ({
  workOrder: one(workOrders, { fields: [jobSheets.work_order_id], references: [workOrders.id] }),
}));

// Reverse relation for purchaseOrderItems (fixes "infer relation" error)
export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.po_id],
    references: [purchaseOrders.id],
  }),
}));
