import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const storageBucket = process.env.REACT_APP_SUPABASE_BUCKET || 'audio-tracks';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

// Create Supabase client (or null if not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Storage bucket name
export const AUDIO_BUCKET = storageBucket;

// Log RLS configuration instructions to console
export function logBucketConfigInstructions() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  SUPABASE STORAGE - Configuration requise pour le bucket         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. Créez le bucket "audio-tracks" :                             ║
║     → Dashboard > Storage > New Bucket                           ║
║     → Name: audio-tracks                                         ║
║     → Public: OUI                                                ║
║                                                                  ║
║  2. Ajoutez la policy pour autoriser les uploads (SQL Editor) :  ║
║                                                                  ║
║     CREATE POLICY "Allow public uploads"                         ║
║     ON storage.objects FOR INSERT                                ║
║     TO anon                                                      ║
║     WITH CHECK (bucket_id = 'audio-tracks');                     ║
║                                                                  ║
║     CREATE POLICY "Allow public read"                            ║
║     ON storage.objects FOR SELECT                                ║
║     TO anon                                                      ║
║     USING (bucket_id = 'audio-tracks');                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload an audio file to Supabase Storage
 * Uses direct fetch to avoid "body stream already read" error
 */
export async function uploadAudioFile(
  file: File,
  sessionId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return { 
      success: false, 
      error: 'Supabase non configuré. Ajoutez vos clés API dans .env' 
    };
  }

  try {
    // Validate file type
    if (!file.type.includes('audio/')) {
      return { success: false, error: 'Seuls les fichiers audio sont acceptés' };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'Le fichier ne doit pas dépasser 50 Mo' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${sessionId}/${timestamp}_${sanitizedName}`;

    console.log('[SUPABASE STORAGE] Starting upload:', { 
      bucket: AUDIO_BUCKET, 
      path: filePath,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Use direct fetch to avoid SDK stream issues
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${AUDIO_BUCKET}/${filePath}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': file.type || 'audio/mpeg',
        'x-upsert': 'false',
      },
      body: file,
    });

    // Read response only once
    const responseText = await response.text();
    let responseData: { error?: string; message?: string; statusCode?: string; Key?: string } = {};
    
    try {
      if (responseText) {
        responseData = JSON.parse(responseText);
      }
    } catch {
      // Response might not be JSON
      console.log('[SUPABASE STORAGE] Response:', responseText);
    }

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || `Erreur HTTP ${response.status}`;
      console.error('[SUPABASE STORAGE] Upload failed:', {
        status: response.status,
        error: errorMessage,
        hint: response.status === 404 
          ? '⚠️ Le bucket "audio-tracks" n\'existe pas. Créez-le dans Supabase Dashboard > Storage'
          : response.status === 403
          ? '⚠️ Permissions RLS insuffisantes. Vérifiez les policies du bucket.'
          : ''
      });

      // Provide helpful error messages
      if (response.status === 404) {
        return { 
          success: false, 
          error: 'Bucket "audio-tracks" introuvable. Créez-le dans Supabase Dashboard.' 
        };
      }
      if (response.status === 403) {
        return { 
          success: false, 
          error: 'Permission refusée. Activez l\'accès public dans les policies du bucket.' 
        };
      }
      if (response.status === 413) {
        return { 
          success: false, 
          error: 'Fichier trop volumineux pour Supabase (limite dépassée).' 
        };
      }
      
      return { success: false, error: errorMessage };
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${AUDIO_BUCKET}/${filePath}`;

    console.log('[SUPABASE STORAGE] ✅ Upload success:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
    };
  } catch (err) {
    console.error('[SUPABASE STORAGE] Exception:', err);
    
    // Network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return { 
        success: false, 
        error: 'Erreur réseau. Vérifiez votre connexion internet.' 
      };
    }
    
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur inconnue lors de l\'upload' 
    };
  }
}

/**
 * Delete an audio file from Supabase Storage
 */
export async function deleteAudioFile(filePath: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[SUPABASE] Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[SUPABASE] Delete exception:', err);
    return false;
  }
}

/**
 * List all audio files in a session folder
 */
export async function listSessionFiles(sessionId: string): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list(sessionId);

    if (error) {
      console.error('[SUPABASE] List error:', error);
      return [];
    }

    return data.map(file => `${sessionId}/${file.name}`);
  } catch (err) {
    console.error('[SUPABASE] List exception:', err);
    return [];
  }
}

// ============================================
// REALTIME CHANNEL FUNCTIONS
// ============================================

export type RealtimeEventType = 
  | 'CMD_MUTE_USER'
  | 'CMD_UNMUTE_USER'
  | 'CMD_EJECT_USER'
  | 'CMD_VOLUME_CHANGE'
  | 'SYNC_PLAYLIST'
  | 'SYNC_PLAYBACK'
  | 'USER_JOINED'
  | 'USER_LEFT';

export interface RealtimePayload {
  type: RealtimeEventType;
  senderId: string;
  targetUserId?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Create a Supabase Realtime channel for a session
 */
export function createSessionChannel(
  sessionId: string,
  onMessage: (payload: RealtimePayload) => void
): RealtimeChannel | null {
  if (!supabase) {
    console.warn('[SUPABASE] Not configured, using fallback');
    return null;
  }

  const channelName = `session:${sessionId}`;
  
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false }, // Don't receive own messages
    },
  });

  // Listen for broadcast messages
  channel.on('broadcast', { event: 'session_event' }, ({ payload }) => {
    console.log('[SUPABASE REALTIME] Received:', payload);
    onMessage(payload as RealtimePayload);
  });

  // Subscribe to channel
  channel.subscribe((status) => {
    console.log('[SUPABASE REALTIME] Channel status:', status);
  });

  return channel;
}

/**
 * Send a broadcast message to all session participants
 */
export async function broadcastToSession(
  channel: RealtimeChannel,
  payload: RealtimePayload
): Promise<boolean> {
  try {
    await channel.send({
      type: 'broadcast',
      event: 'session_event',
      payload,
    });
    console.log('[SUPABASE REALTIME] Broadcast sent:', payload.type);
    return true;
  } catch (err) {
    console.error('[SUPABASE REALTIME] Broadcast error:', err);
    return false;
  }
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  if (!supabase) return;
  
  try {
    await supabase.removeChannel(channel);
    console.log('[SUPABASE REALTIME] Channel removed');
  } catch (err) {
    console.error('[SUPABASE REALTIME] Unsubscribe error:', err);
  }
}

// ============================================
// DATABASE FUNCTIONS (for playlist persistence)
// ============================================

export interface PlaylistRecord {
  id?: string;
  session_id: string;
  tracks: Array<{
    id: number;
    title: string;
    artist: string;
    src: string;
    uploaded?: boolean;
  }>;
  selected_track_id: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save playlist to database
 */
export async function savePlaylist(playlist: PlaylistRecord): Promise<boolean> {
  if (!supabase) {
    console.warn('[SUPABASE] Not configured, playlist not saved');
    return false;
  }

  try {
    const { error } = await supabase
      .from('playlists')
      .upsert({
        session_id: playlist.session_id,
        tracks: playlist.tracks,
        selected_track_id: playlist.selected_track_id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id',
      });

    if (error) {
      console.error('[SUPABASE] Save playlist error:', error);
      return false;
    }

    console.log('[SUPABASE] Playlist saved');
    return true;
  } catch (err) {
    console.error('[SUPABASE] Save playlist exception:', err);
    return false;
  }
}

/**
 * Load playlist from database
 */
export async function loadPlaylist(sessionId: string): Promise<PlaylistRecord | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Not found is ok
        console.error('[SUPABASE] Load playlist error:', error);
      }
      return null;
    }

    return data as PlaylistRecord;
  } catch (err) {
    console.error('[SUPABASE] Load playlist exception:', err);
    return null;
  }
}

export default supabase;
