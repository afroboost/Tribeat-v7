import { useState, useCallback, useRef, useEffect } from 'react';

// Types for audio synchronization
export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
}

export interface SyncState {
  isHost: boolean;
  isLive: boolean;
  isSynced: boolean;
  latency: number;
  lastSyncTimestamp: number;
}

export interface AudioSyncOptions {
  isHost?: boolean;
  onStateChange?: (state: AudioState) => void;
  onSyncUpdate?: (syncState: SyncState) => void;
}

interface UseAudioSyncReturn {
  // Audio element ref
  audioRef: React.RefObject<HTMLAudioElement>;
  
  // Audio state
  audioState: AudioState;
  
  // Sync state
  syncState: SyncState;
  
  // Host controls
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Sync functions
  getTimestamp: () => number;
  syncToTimestamp: (timestamp: number) => void;
  startLiveSession: () => void;
  endLiveSession: () => void;
  
  // Load audio
  loadAudio: (src: string) => void;
}

const initialAudioState: AudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isLoading: false,
  isBuffering: false,
  error: null,
};

const initialSyncState: SyncState = {
  isHost: true,
  isLive: false,
  isSynced: true,
  latency: 0,
  lastSyncTimestamp: 0,
};

export function useAudioSync(options: AudioSyncOptions = {}): UseAudioSyncReturn {
  const { isHost = true, onStateChange, onSyncUpdate } = options;
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [audioState, setAudioState] = useState<AudioState>(initialAudioState);
  const [syncState, setSyncState] = useState<SyncState>({
    ...initialSyncState,
    isHost,
  });

  // Update audio state and notify
  const updateAudioState = useCallback((updates: Partial<AudioState>) => {
    setAudioState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Update sync state and notify
  const updateSyncState = useCallback((updates: Partial<SyncState>) => {
    setSyncState(prev => {
      const newState = { ...prev, ...updates };
      onSyncUpdate?.(newState);
      return newState;
    });
  }, [onSyncUpdate]);

  // Get current timestamp with millisecond precision
  const getTimestamp = useCallback((): number => {
    if (!audioRef.current) return 0;
    return Math.round(audioRef.current.currentTime * 1000);
  }, []);

  // Sync to a specific timestamp (for participants)
  const syncToTimestamp = useCallback((timestamp: number) => {
    if (!audioRef.current || syncState.isHost) return;
    
    const targetTime = timestamp / 1000;
    const currentTime = audioRef.current.currentTime;
    const diff = Math.abs(currentTime - targetTime);
    
    // Only sync if difference is significant (> 100ms)
    if (diff > 0.1) {
      audioRef.current.currentTime = targetTime;
      updateSyncState({
        isSynced: true,
        latency: diff * 1000,
        lastSyncTimestamp: Date.now(),
      });
    }
  }, [syncState.isHost, updateSyncState]);

  // Load audio source
  const loadAudio = useCallback((src: string) => {
    if (!audioRef.current) return;
    
    updateAudioState({ isLoading: true, error: null });
    audioRef.current.src = src;
    audioRef.current.load();
  }, [updateAudioState]);

  // Play audio
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      updateAudioState({ isPlaying: true, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de lecture';
      updateAudioState({ error: errorMessage, isPlaying: false });
    }
  }, [updateAudioState]);

  // Pause audio
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    updateAudioState({ isPlaying: false });
  }, [updateAudioState]);

  // Seek to position
  const seek = useCallback((time: number) => {
    if (!audioRef.current || !syncState.isHost) return;
    audioRef.current.currentTime = time;
    updateAudioState({ currentTime: time });
  }, [syncState.isHost, updateAudioState]);

  // Set volume (0-1)
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clampedVolume;
    updateAudioState({ volume: clampedVolume, isMuted: clampedVolume === 0 });
  }, [updateAudioState]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !audioRef.current.muted;
    audioRef.current.muted = newMuted;
    updateAudioState({ isMuted: newMuted });
  }, [updateAudioState]);

  // Start live session (host only)
  const startLiveSession = useCallback(() => {
    if (!syncState.isHost) return;
    updateSyncState({ isLive: true });
    
    // Start broadcasting timestamps
    syncIntervalRef.current = setInterval(() => {
      const timestamp = getTimestamp();
      // In a real app, this would broadcast to participants
      updateSyncState({ lastSyncTimestamp: timestamp });
    }, 100);
  }, [syncState.isHost, getTimestamp, updateSyncState]);

  // End live session
  const endLiveSession = useCallback(() => {
    updateSyncState({ isLive: false });
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, [updateSyncState]);

  // Time update loop for smooth progress
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current && audioState.isPlaying) {
        updateAudioState({ currentTime: audioRef.current.currentTime });
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    if (audioState.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioState.isPlaying, updateAudioState]);

  // Setup audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      updateAudioState({
        duration: audio.duration,
        isLoading: false,
      });
    };

    const handleTimeUpdate = () => {
      if (!audioState.isPlaying) {
        updateAudioState({ currentTime: audio.currentTime });
      }
    };

    const handlePlay = () => {
      updateAudioState({ isPlaying: true });
    };

    const handlePause = () => {
      updateAudioState({ isPlaying: false });
    };

    const handleEnded = () => {
      updateAudioState({ isPlaying: false, currentTime: 0 });
    };

    const handleWaiting = () => {
      updateAudioState({ isBuffering: true });
    };

    const handleCanPlay = () => {
      updateAudioState({ isBuffering: false, isLoading: false });
    };

    const handleError = () => {
      updateAudioState({
        error: 'Erreur de chargement audio',
        isLoading: false,
        isPlaying: false,
      });
    };

    const handleVolumeChange = () => {
      updateAudioState({
        volume: audio.volume,
        isMuted: audio.muted,
      });
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('volumechange', handleVolumeChange);

    // Set initial volume
    audio.volume = audioState.volume;

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [audioState.volume, audioState.isPlaying, updateAudioState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    audioRef,
    audioState,
    syncState,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    getTimestamp,
    syncToTimestamp,
    startLiveSession,
    endLiveSession,
    loadAudio,
  };
}

export default useAudioSync;
