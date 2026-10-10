import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Credentials (from environment or defaults)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://giguvusbbgonlvsqtrei.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-eLh4iHUShl5pYEyXOLEvg_YBvfrLST';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Supabase URL and Anon Key are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const curatedDir = path.join(__dirname, '..', 'curated_json');

async function seedSupabase() {
  console.log('🚀 Starting Full Directory Sync to Supabase...');
  console.log(`📁 Reading JSON files from: ${curatedDir}`);

  if (!fs.existsSync(curatedDir)) {
    console.error(`Error: Directory ${curatedDir} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(curatedDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.warn('⚠️ No JSON files found in curated_json folder.');
    return;
  }

  console.log(`Found ${files.length} playlist JSON file(s):`, files);

  // Step 1: Clean existing data (Full directory overwrite)
  console.log('🧹 Clearing existing global playlists & videos in Supabase...');
  const { error: delItemsErr } = await supabase.from('playlist_items').delete().neq('id', 0);
  if (delItemsErr) console.warn('Warning deleting playlist_items:', delItemsErr.message);

  const { error: delPlaylistsErr } = await supabase.from('playlists').delete().neq('id', 0);
  if (delPlaylistsErr) console.warn('Warning deleting playlists:', delPlaylistsErr.message);

  let totalPlaylistsAdded = 0;
  let totalVideosAdded = 0;

  // Step 2: Ingest each JSON file
  for (const file of files) {
    const filePath = path.join(curatedDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let data;
    try {
      data = JSON.parse(content);
    } catch (err) {
      console.error(`❌ Failed to parse JSON in file ${file}:`, err.message);
      continue;
    }

    const playlistMeta = data.playlist || {};
    const playlistName = playlistMeta.name || path.basename(file, '.json');
    const playlistDesc = playlistMeta.description || '';

    // Insert playlist
    const { data: insertedPlaylist, error: pErr } = await supabase
      .from('playlists')
      .insert({
        name: playlistName,
        description: playlistDesc,
        custom_ascii: playlistMeta.custom_ascii || null,
        custom_thumbnail_url: playlistMeta.custom_thumbnail_url || null
      })
      .select()
      .single();

    if (pErr || !insertedPlaylist) {
      console.error(`❌ Error inserting playlist "${playlistName}":`, pErr?.message);
      continue;
    }

    const playlistId = insertedPlaylist.id;
    totalPlaylistsAdded++;

    const videos = data.videos || [];
    console.log(`📌 Playlist "${playlistName}" created (ID: ${playlistId}). Inserting ${videos.length} videos...`);

    if (videos.length > 0) {
      const itemsToInsert = videos.map((v, index) => ({
        playlist_id: playlistId,
        video_url: v.video_url || v.url || `https://www.youtube.com/watch?v=${v.video_id}`,
        video_id: v.video_id || v.videoId || '',
        title: v.title || 'Untitled Video',
        thumbnail_url: v.thumbnail_url || v.thumbnailUrl || '',
        author: v.author || 'Unknown Channel',
        view_count: String(v.view_count || '0'),
        position: v.position !== undefined ? v.position : index,
        is_local: v.is_local ? 1 : 0,
        duration_seconds: v.duration_seconds || null,
        description: v.description || null
      }));

      // Insert videos in batches of 100 to avoid payload limits
      const BATCH_SIZE = 100;
      for (let i = 0; i < itemsToInsert.length; i += BATCH_SIZE) {
        const batch = itemsToInsert.slice(i, i + BATCH_SIZE);
        const { error: vErr } = await supabase.from('playlist_items').insert(batch);
        if (vErr) {
          console.error(`❌ Error inserting video batch for playlist "${playlistName}":`, vErr.message);
        } else {
          totalVideosAdded += batch.length;
        }
      }
    }
  }

  console.log(`\n🎉 Full Directory Sync Complete!`);
  console.log(`✅ ${totalPlaylistsAdded} Playlist(s) and ${totalVideosAdded} Video(s) are now live on localyt.tv!`);
}

seedSupabase().catch(err => {
  console.error('Fatal seed error:', err);
});
