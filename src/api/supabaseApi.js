import { supabase } from './supabaseClient';

/**
 * Supabase Data Provider for localyt.tv Web Demo
 */

export const getSupabasePlaylists = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('playlists').select('*').order('id', { ascending: true });
  if (error) {
    console.error('Supabase fetch error (playlists):', error);
    return null;
  }
  return data;
};

export const getSupabasePlaylistMetadata = async () => {
  if (!supabase) return null;
  const { data: playlists, error: pError } = await supabase.from('playlists').select('*').order('id', { ascending: true });
  if (pError || !playlists) return null;

  const { data: items, error: iError } = await supabase.from('playlist_items').select('*');
  if (iError) return null;

  return playlists.map(p => {
    const pItems = (items || []).filter(item => item.playlist_id === p.id);
    return {
      playlist_id: p.id,
      count: pItems.length,
      first_video: pItems[0] || null,
      recent_video: pItems[pItems.length - 1] || pItems[0] || null
    };
  });
};

export const getSupabasePlaylistItems = async (playlistId) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('playlist_items')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });
  if (error) {
    console.error('Supabase fetch error (playlist_items):', error);
    return null;
  }
  return data;
};

export const getSupabaseOrbPresets = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('orb_presets').select('*');
  if (error) return null;
  return data;
};

export const getSupabaseAppBanners = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('app_banners').select('*');
  if (error) return null;
  return data;
};
