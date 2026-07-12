import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

async function seed() {
  console.log('🌱 Seeding SPIT MaintainX Phase 1 demo data...');

  // Insert suppliers safely (ignore if already exists)
  await db.insert(schema.suppliers).values([
    {
      name: 'TechParts HK Limited',
      code: 'TPHK',
      contact_person: 'Kenny Wong',
      email: 'sales@techpartshk.com',
      phone: '+852 2345 6789',
      payment_terms: 'Net 30',
      lead_time_days: 7,
      created_by: 'chris.yu@spit.hk',
    },
    {
      name: 'SecureIoT Supplies',
      code: 'SIOT',
      contact_person: 'May Cheung',
      email: 'orders@secureiot.hk',
      phone: '+852 9876 5432',
      payment_terms: 'Net 15',
      lead_time_days: 14,
      created_by: 'chris.yu@spit.hk',
    }
  ]).onConflictDoNothing();

  console.log('✅ Seed completed (or skipped duplicates).');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
