import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || "";

function remapChannel(row: any) {
  return {
    id: row.id,
    title: row.title,
    customName: row.customname ?? row.customName ?? "",
    uploadsPlaylistId: row.uploadsplaylistid ?? row.uploadsPlaylistId ?? "",
    platform: row.platform ?? "youtube",
    snippet: typeof row.snippet === "string" ? JSON.parse(row.snippet) : (row.snippet ?? {})
  };
}

function remapSnapshot(row: any) {
  return {
    channelId: row.channelid ?? row.channelId,
    date: row.date,
    subscribers: Number(row.subscribers ?? 0),
    totalViews: Number(row.totalviews ?? row.totalViews ?? 0),
    videoCount: Number(row.videocount ?? row.videoCount ?? 0)
  };
}

function remapVideo(row: any) {
  return {
    id: row.id,
    channelId: row.channelid ?? row.channelId,
    title: row.title,
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    comments: Number(row.comments ?? 0),
    durationSec: Number(row.durationsec ?? row.durationSec ?? 0),
    publishedAt: row.publishedat ?? row.publishedAt ?? ""
  };
}

function remapConfig(row: any) {
  return {
    stagnationThreshold: Number(row.stagnationthreshold ?? row.stagnationThreshold ?? 0.5),
    youtubeApiKey: row.youtubeapikey ?? row.youtubeApiKey ?? "",
    geminiApiKey: row.geminiApiKey ?? row.geminiapikey ?? ""
  };
}

export async function loadFromSupabase() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    const configRes = await client.query('SELECT * FROM config LIMIT 1');
    const channelsRes = await client.query('SELECT * FROM channels');
    const snapshotsRes = await client.query('SELECT * FROM snapshots');
    const videosRes = await client.query('SELECT * FROM videos');
    
    const config = configRes.rows.length > 0 
      ? remapConfig(configRes.rows[0]) 
      : { stagnationThreshold: 0.5, youtubeApiKey: "", geminiApiKey: "" };
    
    return {
      config,
      channels: channelsRes.rows.map(remapChannel),
      snapshots: snapshotsRes.rows.map(remapSnapshot),
      videos: videosRes.rows.map(remapVideo)
    };
  } catch (e) {
    console.error("Error loading from Supabase:", e);
    return { config: { stagnationThreshold: 0.5, youtubeApiKey: "", geminiApiKey: "" }, channels: [], snapshots: [], videos: [] };
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
        INSERT INTO channels (id, title, "customName", "uploadsPlaylistId", snippet, platform)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET 
          title = EXCLUDED.title,
          snippet = EXCLUDED.snippet,
          platform = EXCLUDED.platform
      `, [c.id, c.title, c.customName, c.uploadsPlaylistId, JSON.stringify(c.snippet || {}), c.platform || "youtube"]);
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
        ON CONFLICT (id) DO UPDATE SET 
          views = EXCLUDED.views, 
          likes = EXCLUDED.likes, 
          comments = EXCLUDED.comments
      `, [v.id, v.channelId, v.title, v.views, v.likes, v.comments, v.durationSec, v.publishedAt]);
    }
  } catch (e) {
    console.error("Error saving to Supabase:", e);
  } finally {
    await client.end();
  }
}
