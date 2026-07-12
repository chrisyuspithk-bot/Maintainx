import { eq, and, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { stockLevels, inventoryTransactions } from '../../drizzle/schema';

export async function moveStock(db: NeonHttpDatabase, params: any) {
  const { partId, locationId, quantity, transactionType, unitCost, referenceType, referenceId, notes, createdBy } = params;

  if (quantity === 0) throw new Error('Quantity cannot be zero');

  const [transaction] = await db.insert(inventoryTransactions).values({
    part_id: partId,
    location_id: locationId,
    transaction_type: transactionType,
    quantity,
    unit_cost: unitCost ? String(unitCost) : null,
    reference_type: referenceType ?? null,
    reference_id: referenceId ?? null,
    notes: notes ?? null,
    created_by: createdBy,
  }).returning();

  const existing = await db
    .select()
    .from(stockLevels)
    .where(and(eq(stockLevels.part_id, partId), eq(stockLevels.location_id, locationId)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(stockLevels)
      .set({ quantity: sql`${stockLevels.quantity} + ${quantity}`, last_updated_at: new Date() })
      .where(eq(stockLevels.id, existing[0].id));
  } else {
    await db.insert(stockLevels).values({
      part_id: partId,
      location_id: locationId,
      quantity,
      reserved_quantity: 0,
    });
  }

  return transaction;
}

export async function receiveGoods(db: NeonHttpDatabase, params: any) {
  if (params.quantity <= 0) throw new Error('Receive quantity must be positive');
  return moveStock(db, { ...params, quantity: +params.quantity, transactionType: 'receipt' });
}
