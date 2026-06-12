import { Client } from 'pg';

const dbUrl = "postgresql://postgres.lzclegyagczdyfplmzem:Jonelsmith1982*@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

async function patch() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Connected. Applying schema patches...");

    // Add platform column if it doesn't exist
    await client.query(`
      ALTER TABLE channels ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'youtube';
    `);
    console.log("Added platform column to channels.");

    // Fix quoted column names in snapshots/videos for consistent access
    await client.query(`
      ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS "totalViews" BIGINT;
      UPDATE snapshots SET "totalViews" = totalviews WHERE "totalViews" IS NULL;
    `).catch(() => console.log("totalViews already OK or not needed"));

    console.log("Schema patched successfully!");
  } catch (e) {
    console.error("Patch failed:", e);
  } finally {
    await client.end();
  }
}

patch();
