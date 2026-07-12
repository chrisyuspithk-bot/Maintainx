import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '../drizzle/schema';
import { receiveGoods } from './services/inventory.service';
import { eq, and } from 'drizzle-orm';
import {
  submitForApproval,
  approveRequest,
  rejectRequest,
  getPendingApprovals,
} from './services/approval.service';

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', logger());
app.use('*', cors());

function getDb(c: any) {
  const sqlClient = neon(c.env.DATABASE_URL);
  return drizzle(sqlClient, { schema });
}

// ==================== Health Check ====================
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'SPIT MaintainX Phase 1+2' });
});

// ==================== Suppliers ====================
app.get('/api/suppliers', async (c) => {
  const db = getDb(c);
  const suppliers = await db.query.suppliers.findMany();
  return c.json({ success: true, data: suppliers });
});

app.post('/api/suppliers', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [supplier] = await db.insert(schema.suppliers).values({
      name: body.name,
      code: body.code || null,
      contact_person: body.contact_person || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      payment_terms: body.payment_terms || null,
      lead_time_days: body.lead_time_days || 14,
      notes: body.notes || null,
      created_by: body.created_by || 'system',
    }).returning();

    return c.json({ success: true, data: supplier }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ==================== Parts ====================
app.get('/api/parts', async (c) => {
  const db = getDb(c);
  const parts = await db.query.parts.findMany();
  return c.json({ success: true, data: parts });
});

app.post('/api/parts', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [part] = await db.insert(schema.parts).values({
      sku: body.sku,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      unit: body.unit || 'pcs',
      criticality: body.criticality || 'medium',
      min_stock: body.min_stock || 0,
      max_stock: body.max_stock || null,
      reorder_point: body.reorder_point || 5,
      reorder_qty: body.reorder_qty || 10,
      default_supplier_id: body.default_supplier_id || null,
      notes: body.notes || null,
      created_by: body.created_by || 'system',
    }).returning();

    return c.json({ success: true, data: part }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ==================== Inventory ====================
app.get('/api/inventory', async (c) => {
  const db = getDb(c);
  const inventory = await db.select().from(schema.stockLevels);
  return c.json({ success: true, data: inventory });
});

// ==================== Create Purchase Order ====================
app.post('/api/pos', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const poNumber = `PO-${Date.now()}`;

    const [po] = await db.insert(schema.purchaseOrders).values({
      po_number: poNumber,
      supplier_id: body.supplier_id,
      project_id: body.project_id || null, // Phase 3: optional project linking
      // status defaults to 'pending_approval' from schema
      notes: body.notes || null,
      created_by: body.created_by || 'system',
    }).returning();

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const items = body.items.map((item: any) => ({
        po_id: po.id,
        part_id: item.part_id,
        quantity: item.quantity,
        unit_price: String(item.unit_price),
      }));
      await db.insert(schema.purchaseOrderItems).values(items);
    }

    return c.json({ success: true, data: po }, 201);
  } catch (error: any) {
    console.error('Create PO Error:', error);
    return c.json({ success: false, error: error.message || 'Failed to create PO' }, 400);
  }
});

// ==================== Receive Goods ====================
app.post('/api/inventory/receive', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const result = await receiveGoods(db, {
      partId: body.part_id,
      locationId: body.location_id,
      quantity: body.quantity,
      unitCost: body.unit_cost,
      poId: body.po_id,
      notes: body.notes,
      createdBy: body.created_by || 'system',
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Receive Goods Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ==================== Stock Locations (for Inventory) ====================
app.get('/api/locations', async (c) => {
  const db = getDb(c);
  const locations = await db.query.stockLocations.findMany({
    orderBy: (stockLocations, { asc }) => [asc(stockLocations.name)],
  });
  return c.json({ success: true, data: locations });
});

app.post('/api/locations', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [location] = await db.insert(schema.stockLocations).values({
      name: body.name,
      code: body.code || null,
      description: body.description || null,
    }).returning();
    return c.json({ success: true, data: location }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// ==================== Phase 2: Approval System ====================

// Submit for Approval
app.post('/api/approvals/submit', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const request = await submitForApproval(
      db,
      body.document_type,
      body.document_id,
      body.requested_by || 'system'
    );
    return c.json({ success: true, data: request }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Approve
app.post('/api/approvals/:id/approve', async (c) => {
  const db = getDb(c);
  const approvalRequestId = parseInt(c.req.param('id'));
  const body = await c.req.json();

  try {
    const approval = await approveRequest(
      db,
      approvalRequestId,
      body.approved_by || 'system',
      body.comment
    );
    return c.json({ success: true, data: approval });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Reject
app.post('/api/approvals/:id/reject', async (c) => {
  const db = getDb(c);
  const approvalRequestId = parseInt(c.req.param('id'));
  const body = await c.req.json();

  try {
    const approval = await rejectRequest(
      db,
      approvalRequestId,
      body.approved_by || 'system',
      body.comment
    );
    return c.json({ success: true, data: approval });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// List Pending Approvals
app.get('/api/approvals/pending', async (c) => {
  const db = getDb(c);
  const pending = await getPendingApprovals(db);
  return c.json({ success: true, data: pending });
});

// ==================== Phase 3: Projects ====================

// List all Projects
app.get('/api/projects', async (c) => {
  const db = getDb(c);
  const projectsList = await db.query.projects.findMany({
    orderBy: (projects, { desc }) => [desc(projects.created_at)],
  });
  return c.json({ success: true, data: projectsList });
});

// Create new Project
app.post('/api/projects', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [project] = await db.insert(schema.projects).values({
      name: body.name,
      code: body.code || null,
      description: body.description || null,
      status: body.status || 'active',
      budget: body.budget ? String(body.budget) : null,
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
      created_by: body.created_by || 'system',
    }).returning();

    return c.json({ success: true, data: project }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Get single Project
app.get('/api/projects/:id', async (c) => {
  const db = getDb(c);
  const projectId = parseInt(c.req.param('id'));

  const project = await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, projectId),
  });

  if (!project) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }

  return c.json({ success: true, data: project });
});

// Project Summary (total POs, total committed amount, status breakdown)
app.get('/api/projects/:id/summary', async (c) => {
  const db = getDb(c);
  const projectId = parseInt(c.req.param('id'));

  // Check if project exists
  const project = await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, projectId),
  });

  if (!project) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }

  // Get all POs for this project
  const pos = await db.query.purchaseOrders.findMany({
    where: (purchaseOrders, { eq }) => eq(purchaseOrders.project_id, projectId),
  });

  const totalPOs = pos.length;
  const totalAmount = pos.reduce((sum, po) => {
    return sum + (po.total_amount ? parseFloat(po.total_amount) : 0);
  }, 0);

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  pos.forEach(po => {
    statusBreakdown[po.status] = (statusBreakdown[po.status] || 0) + 1;
  });

  return c.json({
    success: true,
    data: {
      project_id: projectId,
      project_name: project.name,
      total_pos: totalPOs,
      total_committed_amount: totalAmount.toFixed(2),
      status_breakdown: statusBreakdown,
    },
  });
});

// ==================== Phase 2 Cleanup: PO Read Endpoints ====================

// List all Purchase Orders (with basic pagination + optional project filter)
app.get('/api/pos', async (c) => {
  const db = getDb(c);

  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  const projectId = c.req.query('project_id');

  const whereCondition = projectId 
    ? (purchaseOrders: any, { eq }: any) => eq(purchaseOrders.project_id, parseInt(projectId))
    : undefined;

  const pos = await db.query.purchaseOrders.findMany({
    limit,
    offset,
    where: whereCondition,
    with: {
      project: true, // Include project info (name, code, etc.)
    },
    orderBy: (purchaseOrders, { desc }) => [desc(purchaseOrders.created_at)],
  });

  return c.json({
    success: true,
    data: pos,
    pagination: {
      limit,
      offset,
      count: pos.length,
    },
  });
});

// Get single Purchase Order with items
app.get('/api/pos/:id', async (c) => {
  const db = getDb(c);
  const poId = parseInt(c.req.param('id'));

  const po = await db.query.purchaseOrders.findFirst({
    where: (purchaseOrders, { eq }) => eq(purchaseOrders.id, poId),
    with: {
      items: true,
    },
  });

  if (!po) {
    return c.json({ success: false, error: 'Purchase Order not found' }, 404);
  }

  return c.json({ success: true, data: po });
});

// ============================================
// Phase 4: Maintenance Core Endpoints
// ============================================

// --- Maintenance Contracts ---
app.get('/api/maintenance-contracts', async (c) => {
  const db = getDb(c);
  const contracts = await db.query.maintenanceContracts.findMany({
    orderBy: (maintenanceContracts, { desc }) => [desc(maintenanceContracts.created_at)],
  });
  return c.json({ success: true, data: contracts });
});

app.post('/api/maintenance-contracts', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [contract] = await db.insert(schema.maintenanceContracts).values({
      contract_number: body.contract_number || `MC-${Date.now()}`,
      project_id: body.project_id || null,
      type: body.type || 'paid',
      status: body.status || 'active',
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
      notes: body.notes || null,
      created_by: body.created_by || 'system',
    }).returning();

    return c.json({ success: true, data: contract }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

app.get('/api/maintenance-contracts/:id', async (c) => {
  const db = getDb(c);
  const id = parseInt(c.req.param('id'));

  const contract = await db.query.maintenanceContracts.findFirst({
    where: (maintenanceContracts, { eq }) => eq(maintenanceContracts.id, id),
  });

  if (!contract) {
    return c.json({ success: false, error: 'Maintenance Contract not found' }, 404);
  }

  return c.json({ success: true, data: contract });
});

// --- Breakdown Logs ---
app.get('/api/breakdown-logs', async (c) => {
  const db = getDb(c);

  const maintenanceContractId = c.req.query('maintenance_contract_id');
  const projectId = c.req.query('project_id');
  const status = c.req.query('status');

  let whereConditions = [];

  if (maintenanceContractId) {
    whereConditions.push((breakdownLogs: any, { eq }: any) => eq(breakdownLogs.maintenance_contract_id, parseInt(maintenanceContractId)));
  }
  if (projectId) {
    whereConditions.push((breakdownLogs: any, { eq }: any) => eq(breakdownLogs.project_id, parseInt(projectId)));
  }
  if (status) {
    whereConditions.push((breakdownLogs: any, { eq }: any) => eq(breakdownLogs.status, status));
  }

  const logs = await db.query.breakdownLogs.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: (breakdownLogs, { desc }) => [desc(breakdownLogs.created_at)],
  });

  return c.json({ success: true, data: logs });
});

app.post('/api/breakdown-logs', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [log] = await db.insert(schema.breakdownLogs).values({
      maintenance_contract_id: body.maintenance_contract_id || null,
      project_id: body.project_id || null,
      channel: body.channel, // phone, whatsapp, email
      reported_by: body.reported_by || null,
      contact_info: body.contact_info || null,
      description: body.description,
      priority: body.priority || 'medium',
      status: body.status || 'open',
    }).returning();

    return c.json({ success: true, data: log }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// --- Work Orders ---
app.get('/api/work-orders', async (c) => {
  const db = getDb(c);

  const maintenanceContractId = c.req.query('maintenance_contract_id');
  const projectId = c.req.query('project_id');
  const status = c.req.query('status');

  let whereConditions = [];

  if (maintenanceContractId) {
    whereConditions.push((workOrders: any, { eq }: any) => eq(workOrders.maintenance_contract_id, parseInt(maintenanceContractId)));
  }
  if (projectId) {
    // Note: work_orders doesn't have direct project_id, so we filter via breakdown_log or maintenance_contract if needed
  }
  if (status) {
    whereConditions.push((workOrders: any, { eq }: any) => eq(workOrders.status, status));
  }

  const workOrdersList = await db.query.workOrders.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: (workOrders, { desc }) => [desc(workOrders.created_at)],
  });

  return c.json({ success: true, data: workOrdersList });
});

app.get('/api/work-orders/:id', async (c) => {
  const db = getDb(c);
  const id = parseInt(c.req.param('id'));

  const workOrder = await db.query.workOrders.findFirst({
    where: (workOrders, { eq }) => eq(workOrders.id, id),
    with: {
      jobSheet: true,
    },
  });

  if (!workOrder) {
    return c.json({ success: false, error: 'Work Order not found' }, 404);
  }

  return c.json({ success: true, data: workOrder });
});

app.post('/api/work-orders', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [workOrder] = await db.insert(schema.workOrders).values({
      breakdown_log_id: body.breakdown_log_id || null,
      maintenance_contract_id: body.maintenance_contract_id || null,
      title: body.title,
      description: body.description || null,
      status: body.status || 'open',
      assigned_to: body.assigned_to || null,
      scheduled_date: body.scheduled_date ? new Date(body.scheduled_date) : null,
      created_by: body.created_by || 'system',
    }).returning();

    return c.json({ success: true, data: workOrder }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// --- Job Sheets ---
app.post('/api/job-sheets', async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  try {
    const [jobSheet] = await db.insert(schema.jobSheets).values({
      work_order_id: body.work_order_id,
      performed_by: body.performed_by,
      work_done: body.work_done || null,
      parts_used: body.parts_used || null,
      customer_name: body.customer_name || null,
      customer_signature: body.customer_signature || null,
      notes: body.notes || null,
    }).returning();

    // Optionally update Work Order status to completed
    if (body.work_order_id) {
      await db.update(schema.workOrders)
        .set({ 
          status: 'completed',
          completed_at: new Date()
        })
        .where(eq(schema.workOrders.id, body.work_order_id));
    }

    return c.json({ success: true, data: jobSheet }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

// --- Basic Project Job Sheet (for Phase 3 Projects) ---
app.post('/api/projects/:id/job-sheet', async (c) => {
  const db = getDb(c);
  const projectId = parseInt(c.req.param('id'));
  const body = await c.req.json();

  try {
    const [jobSheet] = await db.insert(schema.jobSheets).values({
      work_order_id: body.work_order_id || null,
      performed_by: body.performed_by,
      work_done: body.work_done || `Project ${projectId} Job Sheet`,
      parts_used: body.parts_used || null,
      customer_name: body.customer_name || null,
      customer_signature: body.customer_signature || null,
      notes: body.notes || `Job sheet for Project ID: ${projectId}`,
    }).returning();

    return c.json({ success: true, data: jobSheet }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
});

export default app;
