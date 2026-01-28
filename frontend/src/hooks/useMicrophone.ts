import { useState, useCallback, useRef, useEffect } from 'react';

// Types
export interface MicrophoneState {
  isCapturing: boolean;
  isMuted: boolean;
  volume: number;
  audioLevel: number; // 0-100 for VU meter
  error: string | null;
  deviceId: string | null;
  devices: MediaDeviceInfo[];
}

export interface UseMicrophoneOptions {
  autoGainControl?: boolean;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  onAudioLevel?: (level: number) => void;
}

export interface UseMicrophoneReturn {
  state: MicrophoneState;
  startCapture: () => Promise<boolean>;
  stopCapture: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  setDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<MediaDeviceInfo[]>;
  audioStream: MediaStream | null;
  audioContext: AudioContext | null;
  gainNode: GainNode | null;
}

const initialState: MicrophoneState = {
  isCapturing: false,
  isMuted: false,
  volume: 100,
  audioLevel: 0,
  error: null,
  deviceId: null,
  devices: [],
};

/**
 * Hook for capturing microphone audio with VU meter
 */
export function useMicrophone(options: UseMicrophoneOptions = {}): UseMicrophoneReturn {
  const {
    autoGainControl = true,
    echoCancellation = true,
    noiseSuppression = true,
    onAudioLevel,
  } = options;

  const [state, setState] = useState<MicrophoneState>(initialState);
  
  // Refs for audio processing
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<MicrophoneState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Refresh available audio devices
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      updateState({ devices: audioInputs });
      return audioInputs;
    } catch (err) {
      console.error('[MIC] Failed to enumerate devices:', err);
      updateState({ error: 'Impossible de lister les microphones' });
      return [];
    }
  }, [updateState]);

  // Calculate audio level from analyser data
  const calculateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for better VU meter
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const level = Math.min(100, Math.round((rms / 128) * 100));

    updateState({ audioLevel: level });
    onAudioLevel?.(level);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(calculateAudioLevel);
  }, [onAudioLevel, updateState]);

  // Start capturing audio
  const startCapture = useCallback(async (): Promise<boolean> => {
    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      updateState({ error: 'Votre navigateur ne supporte pas la capture audio' });
      return false;
    }

    try {
      updateState({ error: null });

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: {
          autoGainControl,
          echoCancellation,
          noiseSuppression,
          deviceId: state.deviceId ? { exact: state.deviceId } : undefined,
        },
      };

      console.log('[MIC] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create audio context and nodes
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = state.volume / 100;
      gainNodeRef.current = gainNode;

      // Create analyser for VU meter
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect nodes: source -> gain -> analyser
      source.connect(gainNode);
      gainNode.connect(analyser);
      // Note: We don't connect to destination to avoid feedback
      // The stream is available for WebRTC transmission

      // Start VU meter animation
      calculateAudioLevel();

      // Get device ID from track
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();

      updateState({
        isCapturing: true,
        isMuted: false,
        deviceId: settings.deviceId || null,
      });

      console.log('[MIC] ✅ Capture started:', audioTrack.label);
      
      // Refresh devices list
      await refreshDevices();

      return true;
    } catch (err) {
      console.error('[MIC] ❌ Capture failed:', err);
      
      let errorMessage = 'Erreur lors de l\'accès au microphone';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Accès au microphone refusé. Veuillez autoriser l\'accès.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'Aucun microphone détecté sur cet appareil.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Le microphone est utilisé par une autre application.';
        }
      }

      updateState({ error: errorMessage, isCapturing: false });
      return false;
    }
  }, [
    autoGainControl,
    echoCancellation,
    noiseSuppression,
    state.deviceId,
    state.volume,
    updateState,
    calculateAudioLevel,
    refreshDevices,
  ]);

  // Stop capturing audio
  const stopCapture = useCallback(() => {
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear refs
    analyserRef.current = null;
    gainNodeRef.current = null;
    sourceRef.current = null;

    updateState({
      isCapturing: false,
      audioLevel: 0,
    });

    console.log('[MIC] Capture stopped');
  }, [updateState]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        updateState({ isMuted: !audioTrack.enabled });
        console.log('[MIC] Muted:', !audioTrack.enabled);
      }
    }
  }, [updateState]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume / 100;
    }
    
    updateState({ volume: clampedVolume });
  }, [updateState]);

  // Change device
  const setDevice = useCallback(async (deviceId: string) => {
    updateState({ deviceId });
    
    // If already capturing, restart with new device
    if (state.isCapturing) {
      stopCapture();
      await startCapture();
    }
  }, [state.isCapturing, stopCapture, startCapture, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  return {
    state,
    startCapture,
    stopCapture,
    toggleMute,
    setVolume,
    setDevice,
    refreshDevices,
    audioStream: streamRef.current,
    audioContext: audioContextRef.current,
    gainNode: gainNodeRef.current,
  };
}

export default useMicrophone;
