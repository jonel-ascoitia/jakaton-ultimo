import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.lzclegyagczdyfplmzem:Jonelsmith1982*@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

export async function loadFromSupabase() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    const configRes = await client.query('SELECT * FROM config LIMIT 1');
    const channelsRes = await client.query('SELECT * FROM channels');
    const snapshotsRes = await client.query('SELECT * FROM snapshots');
    const videosRes = await client.query('SELECT * FROM videos');
    
    const config = configRes.rows.length > 0 ? configRes.rows[0] : { stagnationThreshold: 4.1, youtubeApiKey: "", geminiApiKey: "" };
    
    return {
      config,
      channels: channelsRes.rows.map(r => ({ ...r, snippet: r.snippet })),
      snapshots: snapshotsRes.rows,
      videos: videosRes.rows
    };
  } catch (e) {
    console.error("Error loading from Supabase:", e);
    return { config: { stagnationThreshold: 4.1 }, channels: [], snapshots: [], videos: [] };
  } finally {
    await client.end();
  }
}

export async function saveToSupabase(db: any) {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    await client.query(`
      INSERT INTO config (id, "stagnationThreshold", "youtubeApiKey", "geminiApiKey")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET 
        "stagnationThreshold" = EXCLUDED."stagnationThreshold",
        "youtubeApiKey" = EXCLUDED."youtubeApiKey",
        "geminiApiKey" = EXCLUDED."geminiApiKey"
    `, ['main', db.config.stagnationThreshold, db.config.youtubeApiKey, db.config.geminiApiKey]);

    for (const c of db.channels) {
      await client.query(`
        INSERT INTO channels (id, title, "customName", "uploadsPlaylistId", snippet)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
      `, [c.id, c.title, c.customName, c.uploadsPlaylistId, c.snippet]);
    }

    for (const s of db.snapshots) {
      await client.query(`
        INSERT INTO snapshots ("channelId", date, subscribers, "totalViews", "videoCount")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("channelId", date) DO NOTHING
      `, [s.channelId, s.date, s.subscribers, s.totalViews, s.videoCount]);
    }

    for (const v of db.videos) {
      await client.query(`
        INSERT INTO videos (id, "channelId", title, views, likes, comments, "durationSec", "publishedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET views = EXCLUDED.views, likes = EXCLUDED.likes, comments = EXCLUDED.comments
      `, [v.id, v.channelId, v.title, v.views, v.likes, v.comments, v.durationSec, v.publishedAt]);
    }
  } catch (e) {
    console.error("Error saving to Supabase:", e);
  } finally {
    await client.end();
  }
}
