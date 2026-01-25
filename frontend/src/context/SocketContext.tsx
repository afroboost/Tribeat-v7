import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';

// Event types for real-time communication
export type SocketEventType = 
  | 'CMD_MUTE_USER'
  | 'CMD_UNMUTE_USER'
  | 'CMD_EJECT_USER'
  | 'CMD_VOLUME_CHANGE'
  | 'SYNC_PLAYLIST'
  | 'SYNC_PLAYBACK'
  | 'USER_JOINED'
  | 'USER_LEFT';

export interface SocketEvent {
  type: SocketEventType;
  sessionId: string;
  senderId: string;
  targetUserId?: string;
  payload?: unknown;
  timestamp: number;
}

export interface MutePayload {
  muted: boolean;
}

export interface VolumePayload {
  volume: number;
}

export interface PlaylistPayload {
  tracks: Array<{
    id: number;
    title: string;
    artist: string;
    src: string;
  }>;
  selectedTrackId: number;
}

export interface PlaybackPayload {
  isPlaying: boolean;
  currentTime: number;
  trackId: number;
}

interface SocketContextValue {
  // Connection state
  isConnected: boolean;
  userId: string;
  sessionId: string | null;
  
  // Join/Leave
  joinSession: (sessionId: string, userId: string, isHost: boolean) => void;
  leaveSession: () => void;
  
  // Host Commands
  muteUser: (targetUserId: string) => void;
  unmuteUser: (targetUserId: string) => void;
  ejectUser: (targetUserId: string) => void;
  setUserVolume: (targetUserId: string, volume: number) => void;
  
  // Sync Commands
  syncPlaylist: (tracks: PlaylistPayload['tracks'], selectedTrackId: number) => void;
  syncPlayback: (isPlaying: boolean, currentTime: number, trackId: number) => void;
  
  // Event listeners
  onMuted: (callback: (muted: boolean) => void) => () => void;
  onEjected: (callback: () => void) => () => void;
  onVolumeChange: (callback: (volume: number) => void) => () => void;
  onPlaylistSync: (callback: (payload: PlaylistPayload) => void) => () => void;
  onPlaybackSync: (callback: (payload: PlaybackPayload) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

// Generate unique user ID
function generateUserId(): string {
  const stored = sessionStorage.getItem('bt_user_id');
  if (stored) return stored;
  
  const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  sessionStorage.setItem('bt_user_id', newId);
  return newId;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId] = useState(generateUserId);
  const isHostRef = useRef(false);
  
  // Event listeners storage
  const listenersRef = useRef<{
    muted: Set<(muted: boolean) => void>;
    ejected: Set<() => void>;
    volumeChange: Set<(volume: number) => void>;
    playlistSync: Set<(payload: PlaylistPayload) => void>;
    playbackSync: Set<(payload: PlaybackPayload) => void>;
  }>({
    muted: new Set(),
    ejected: new Set(),
    volumeChange: new Set(),
    playlistSync: new Set(),
    playbackSync: new Set(),
  });

  // Send event through BroadcastChannel
  const sendEvent = useCallback((event: Omit<SocketEvent, 'timestamp'>) => {
    if (!channelRef.current) return;
    
    const fullEvent: SocketEvent = {
      ...event,
      timestamp: Date.now(),
    };
    
    console.log('[SOCKET OUT]', fullEvent.type, {
      target: fullEvent.targetUserId,
      session: fullEvent.sessionId,
    });
    
    channelRef.current.postMessage(fullEvent);
  }, []);

  // Handle incoming events
  const handleMessage = useCallback((event: MessageEvent<SocketEvent>) => {
    const data = event.data;
    
    // Ignore own messages
    if (data.senderId === userId) return;
    
    // Ignore messages from other sessions
    if (data.sessionId !== sessionId) return;
    
    console.log('[SOCKET IN]', data.type, {
      from: data.senderId,
      target: data.targetUserId,
      latency: `${Date.now() - data.timestamp}ms`,
    });

    // Handle targeted events (for specific user)
    if (data.targetUserId && data.targetUserId !== userId) return;

    switch (data.type) {
      case 'CMD_MUTE_USER':
        listenersRef.current.muted.forEach(cb => cb(true));
        showToast('🔇 L\'hôte vous a mis en sourdine', 'warning');
        break;
        
      case 'CMD_UNMUTE_USER':
        listenersRef.current.muted.forEach(cb => cb(false));
        showToast('🔊 L\'hôte a réactivé votre son', 'success');
        break;
        
      case 'CMD_EJECT_USER':
        listenersRef.current.ejected.forEach(cb => cb());
        showToast('❌ Vous avez été exclu par l\'hôte', 'error');
        // Redirect after short delay for toast visibility
        setTimeout(() => navigate('/'), 1500);
        break;
        
      case 'CMD_VOLUME_CHANGE':
        const volPayload = data.payload as VolumePayload;
        listenersRef.current.volumeChange.forEach(cb => cb(volPayload.volume));
        break;
        
      case 'SYNC_PLAYLIST':
        if (!isHostRef.current) {
          const plPayload = data.payload as PlaylistPayload;
          listenersRef.current.playlistSync.forEach(cb => cb(plPayload));
        }
        break;
        
      case 'SYNC_PLAYBACK':
        if (!isHostRef.current) {
          const pbPayload = data.payload as PlaybackPayload;
          listenersRef.current.playbackSync.forEach(cb => cb(pbPayload));
        }
        break;
    }
  }, [userId, sessionId, navigate, showToast]);

  // Join session
  const joinSession = useCallback((newSessionId: string, newUserId: string, isHost: boolean) => {
    // Close existing channel
    if (channelRef.current) {
      channelRef.current.close();
    }
    
    // Create channel for this session
    const channelName = `beattribe_session_${newSessionId}`;
    channelRef.current = new BroadcastChannel(channelName);
    channelRef.current.onmessage = handleMessage;
    
    setSessionId(newSessionId);
    isHostRef.current = isHost;
    setIsConnected(true);
    
    console.log('[SOCKET]', `Joined session ${newSessionId} as ${isHost ? 'HOST' : 'PARTICIPANT'}`);
    
    // Announce joining
    sendEvent({
      type: 'USER_JOINED',
      sessionId: newSessionId,
      senderId: newUserId,
      payload: { isHost },
    });
  }, [handleMessage, sendEvent]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (channelRef.current && sessionId) {
      sendEvent({
        type: 'USER_LEFT',
        sessionId,
        senderId: userId,
      });
      channelRef.current.close();
      channelRef.current = null;
    }
    
    setSessionId(null);
    setIsConnected(false);
    isHostRef.current = false;
  }, [sessionId, userId, sendEvent]);

  // Host commands
  const muteUser = useCallback((targetUserId: string) => {
    if (!sessionId) return;
    sendEvent({
      type: 'CMD_MUTE_USER',
      sessionId,
      senderId: userId,
      targetUserId,
    });
  }, [sessionId, userId, sendEvent]);

  const unmuteUser = useCallback((targetUserId: string) => {
    if (!sessionId) return;
    sendEvent({
      type: 'CMD_UNMUTE_USER',
      sessionId,
      senderId: userId,
      targetUserId,
    });
  }, [sessionId, userId, sendEvent]);

  const ejectUser = useCallback((targetUserId: string) => {
    if (!sessionId) return;
    sendEvent({
      type: 'CMD_EJECT_USER',
      sessionId,
      senderId: userId,
      targetUserId,
    });
  }, [sessionId, userId, sendEvent]);

  const setUserVolume = useCallback((targetUserId: string, volume: number) => {
    if (!sessionId) return;
    sendEvent({
      type: 'CMD_VOLUME_CHANGE',
      sessionId,
      senderId: userId,
      targetUserId,
      payload: { volume } as VolumePayload,
    });
  }, [sessionId, userId, sendEvent]);

  // Sync commands
  const syncPlaylist = useCallback((tracks: PlaylistPayload['tracks'], selectedTrackId: number) => {
    if (!sessionId || !isHostRef.current) return;
    sendEvent({
      type: 'SYNC_PLAYLIST',
      sessionId,
      senderId: userId,
      payload: { tracks, selectedTrackId } as PlaylistPayload,
    });
  }, [sessionId, userId, sendEvent]);

  const syncPlayback = useCallback((isPlaying: boolean, currentTime: number, trackId: number) => {
    if (!sessionId || !isHostRef.current) return;
    sendEvent({
      type: 'SYNC_PLAYBACK',
      sessionId,
      senderId: userId,
      payload: { isPlaying, currentTime, trackId } as PlaybackPayload,
    });
  }, [sessionId, userId, sendEvent]);

  // Event listener registration
  const onMuted = useCallback((callback: (muted: boolean) => void) => {
    listenersRef.current.muted.add(callback);
    return () => { listenersRef.current.muted.delete(callback); };
  }, []);

  const onEjected = useCallback((callback: () => void) => {
    listenersRef.current.ejected.add(callback);
    return () => { listenersRef.current.ejected.delete(callback); };
  }, []);

  const onVolumeChange = useCallback((callback: (volume: number) => void) => {
    listenersRef.current.volumeChange.add(callback);
    return () => { listenersRef.current.volumeChange.delete(callback); };
  }, []);

  const onPlaylistSync = useCallback((callback: (payload: PlaylistPayload) => void) => {
    listenersRef.current.playlistSync.add(callback);
    return () => { listenersRef.current.playlistSync.delete(callback); };
  }, []);

  const onPlaybackSync = useCallback((callback: (payload: PlaybackPayload) => void) => {
    listenersRef.current.playbackSync.add(callback);
    return () => { listenersRef.current.playbackSync.delete(callback); };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  const value: SocketContextValue = {
    isConnected,
    userId,
    sessionId,
    joinSession,
    leaveSession,
    muteUser,
    unmuteUser,
    ejectUser,
    setUserVolume,
    syncPlaylist,
    syncPlayback,
    onMuted,
    onEjected,
    onVolumeChange,
    onPlaylistSync,
    onPlaybackSync,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
