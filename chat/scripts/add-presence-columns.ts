/**
 * Migration script to add presence columns to children table
 * Run with: npx ts-node scripts/add-presence-columns.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function migrate() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const client = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Adding presence columns to chat.children table...');

  // Add last_seen_at column
  const { error: error1 } = await client.rpc('exec_sql', {
    sql: `ALTER TABLE chat.children ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NULL;`
  });

  if (error1) {
    console.log('Error adding last_seen_at (may already exist):', error1.message);
  } else {
    console.log('Added last_seen_at column');
  }

  // Add is_online column
  const { error: error2 } = await client.rpc('exec_sql', {
    sql: `ALTER TABLE chat.children ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;`
  });

  if (error2) {
    console.log('Error adding is_online (may already exist):', error2.message);
  } else {
    console.log('Added is_online column');
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
