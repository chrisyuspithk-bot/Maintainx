import { eq } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { approvalRequests, approvals, purchaseOrders, requisitions } from '../../drizzle/schema';

export async function submitForApproval(
  db: NeonHttpDatabase,
  documentType: 'purchase_order' | 'requisition',
  documentId: number,
  requestedBy: string
) {
  const [request] = await db.insert(approvalRequests).values({
    document_type: documentType,
    document_id: documentId,
    requested_by: requestedBy,
    status: 'pending',
  }).returning();

  // Set document status to pending_approval (consistent with schema default)
  if (documentType === 'purchase_order') {
    await db.update(purchaseOrders)
      .set({ status: 'pending_approval' })
      .where(eq(purchaseOrders.id, documentId));
  } else if (documentType === 'requisition') {
    await db.update(requisitions)
      .set({ status: 'pending_approval' })
      .where(eq(requisitions.id, documentId));
  }

  return request;
}

export async function approveRequest(
  db: NeonHttpDatabase,
  approvalRequestId: number,
  approvedBy: string,
  comment?: string
) {
  const [approval] = await db.insert(approvals).values({
    approval_request_id: approvalRequestId,
    action: 'approved',
    comment: comment || null,
    approved_by: approvedBy,
  }).returning();

  const request = await db.query.approvalRequests.findFirst({
    where: eq(approvalRequests.id, approvalRequestId),
  });

  if (request) {
    if (request.document_type === 'purchase_order') {
      await db.update(purchaseOrders)
        .set({ status: 'approved' })
        .where(eq(purchaseOrders.id, request.document_id));
    } else if (request.document_type === 'requisition') {
      await db.update(requisitions)
        .set({ status: 'approved' })
        .where(eq(requisitions.id, request.document_id));
    }

    await db.update(approvalRequests)
      .set({ status: 'approved' })
      .where(eq(approvalRequests.id, approvalRequestId));
  }

  return approval;
}

export async function rejectRequest(
  db: NeonHttpDatabase,
  approvalRequestId: number,
  approvedBy: string,
  comment?: string
) {
  const [approval] = await db.insert(approvals).values({
    approval_request_id: approvalRequestId,
    action: 'rejected',
    comment: comment || null,
    approved_by: approvedBy,
  }).returning();

  const request = await db.query.approvalRequests.findFirst({
    where: eq(approvalRequests.id, approvalRequestId),
  });

  if (request) {
    if (request.document_type === 'purchase_order') {
      await db.update(purchaseOrders)
        .set({ status: 'rejected' })
        .where(eq(purchaseOrders.id, request.document_id));
    } else if (request.document_type === 'requisition') {
      await db.update(requisitions)
        .set({ status: 'rejected' })
        .where(eq(requisitions.id, request.document_id));
    }

    await db.update(approvalRequests)
      .set({ status: 'rejected' })
      .where(eq(approvalRequests.id, approvalRequestId));
  }

  return approval;
}

export async function getPendingApprovals(db: NeonHttpDatabase) {
  return db.query.approvalRequests.findMany({
    where: eq(approvalRequests.status, 'pending'),
    orderBy: (approvalRequests, { desc }) => [desc(approvalRequests.created_at)],
  });
}
