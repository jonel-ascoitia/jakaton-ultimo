import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data/db.json');

async function migrate() {
  const dbUrl = "postgresql://postgres.lzclegyagczdyfplmzem:Jonelsmith1982*@aws-1-us-east-1.pooler.supabase.com:5432/postgres";
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS config (
        id VARCHAR(50) PRIMARY KEY,
        stagnationThreshold FLOAT,
        youtubeApiKey TEXT,
        geminiApiKey TEXT
      );

      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT,
        customName TEXT,
        uploadsPlaylistId TEXT,
        snippet JSONB
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        id SERIAL PRIMARY KEY,
        channelId VARCHAR(255) REFERENCES channels(id) ON DELETE CASCADE,
        date VARCHAR(20),
        subscribers INTEGER,
        totalViews BIGINT,
        videoCount INTEGER,
        UNIQUE(channelId, date)
      );

      CREATE TABLE IF NOT EXISTS videos (
        id VARCHAR(255) PRIMARY KEY,
        channelId VARCHAR(255) REFERENCES channels(id) ON DELETE CASCADE,
        title TEXT,
        views BIGINT,
        likes INTEGER,
        comments INTEGER,
        durationSec INTEGER,
        publishedAt VARCHAR(100)
      );
    `);
    console.log("Tables created successfully.");

    // Load Local DB
    if (!fs.existsSync(DB_FILE)) {
      console.error("Local db.json not found!");
      return;
    }
    const localDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

    // Migrate Config
    await client.query(`
      INSERT INTO config (id, stagnationThreshold, youtubeApiKey, geminiApiKey)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET 
        stagnationThreshold = EXCLUDED.stagnationThreshold,
        youtubeApiKey = EXCLUDED.youtubeApiKey,
        geminiApiKey = EXCLUDED.geminiApiKey
    `, ['main', localDb.config.stagnationThreshold, localDb.config.youtubeApiKey, localDb.config.geminiApiKey]);
    console.log("Config migrated.");

    // Migrate Channels
    for (const channel of localDb.channels) {
      await client.query(`
        INSERT INTO channels (id, title, customName, uploadsPlaylistId, snippet)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [channel.id, channel.title, channel.customName, channel.uploadsPlaylistId, JSON.stringify(channel.snippet)]);
    }
    console.log(`Migrated ${localDb.channels.length} channels.`);

    // Migrate Snapshots
    for (const snap of localDb.snapshots) {
      await client.query(`
        INSERT INTO snapshots (channelId, date, subscribers, totalViews, videoCount)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (channelId, date) DO NOTHING
      `, [snap.channelId, snap.date, snap.subscribers, snap.totalViews, snap.videoCount]);
    }
    console.log(`Migrated ${localDb.snapshots.length} snapshots.`);

    // Migrate Videos
    for (const video of localDb.videos) {
      await client.query(`
        INSERT INTO videos (id, channelId, title, views, likes, comments, durationSec, publishedAt)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          views = EXCLUDED.views,
          likes = EXCLUDED.likes,
          comments = EXCLUDED.comments
      `, [video.id, video.channelId, video.title, video.views, video.likes, video.comments, video.durationSec, video.publishedAt]);
    }
    console.log(`Migrated ${localDb.videos.length} videos.`);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
