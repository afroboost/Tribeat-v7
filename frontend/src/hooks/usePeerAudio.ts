import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';

// Types
export interface PeerState {
  isConnected: boolean;
  isHost: boolean;
  peerId: string | null;
  hostPeerId: string | null;
  connectedPeers: string[];
  error: string | null;
  isBroadcasting: boolean;
  isReady: boolean; // True when PeerJS + stream are both ready
}

export interface UsePeerAudioOptions {
  sessionId: string;
  isHost: boolean;
  audioStream?: MediaStream | null; // Required for host before connecting
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string) => void;
  onReceiveAudio?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onReady?: () => void; // Called when host mic is ready for broadcast
}

export interface UsePeerAudioReturn {
  state: PeerState;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  broadcastAudio: (stream: MediaStream) => void;
  stopBroadcast: () => void;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
}

const initialState: PeerState = {
  isConnected: false,
  isHost: false,
  peerId: null,
  hostPeerId: null,
  connectedPeers: [],
  error: null,
  isBroadcasting: false,
  isReady: false,
};

/**
 * Hook for WebRTC audio broadcasting using PeerJS
 * Host broadcasts to all participants, participants receive
 * IMPORTANT: Host must provide audioStream before connecting
 */
export function usePeerAudio(options: UsePeerAudioOptions): UsePeerAudioReturn {
  const {
    sessionId,
    isHost,
    audioStream,
    onPeerConnected,
    onPeerDisconnected,
    onReceiveAudio,
    onError,
    onReady,
  } = options;

  const [state, setState] = useState<PeerState>({
    ...initialState,
    isHost,
  });

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const currentStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const dataConnectionsRef = useRef<Map<string, DataConnection>>(new Map());

  // Update state helper
  const updateState = useCallback((updates: Partial<PeerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Generate peer ID based on session and role
  const generatePeerId = useCallback((forHost: boolean) => {
    const cleanSessionId = sessionId.replace(/[^a-zA-Z0-9]/g, '');
    if (forHost) {
      return `beattribe-host-${cleanSessionId}`;
    }
    // Participants get unique IDs
    return `beattribe-${cleanSessionId}-${Date.now().toString(36)}`;
  }, [sessionId]);

  // Get host peer ID
  const getHostPeerId = useCallback(() => {
    const cleanSessionId = sessionId.replace(/[^a-zA-Z0-9]/g, '');
    return `beattribe-host-${cleanSessionId}`;
  }, [sessionId]);

  // Connect to PeerJS server
  const connect = useCallback(async (): Promise<boolean> => {
    // For HOST: Don't connect if no audio stream is provided
    if (isHost && !audioStream) {
      console.log('[WebRTC] ⏳ Host waiting for audio stream before connecting...');
      updateState({ error: null }); // Clear any previous error
      return false;
    }

    if (peerRef.current) {
      console.log('[WebRTC] Already connected');
      return true;
    }

    return new Promise((resolve) => {
      try {
        const peerId = generatePeerId(isHost);
        const hostPeerId = getHostPeerId();

        console.log('[WebRTC] Connecting to PeerJS...', { peerId, isHost, hostPeerId });

        // Create peer with ROBUST STUN/TURN configuration
        const peer = new Peer(peerId, {
          debug: 2, // More verbose logging
          config: {
            iceServers: [
              // Google's public STUN servers
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              // Additional public STUN servers for better NAT traversal
              { urls: 'stun:stun.stunprotocol.org:3478' },
            ],
          },
        });

        peerRef.current = peer;

        // Handle peer open
        peer.on('open', (id) => {
          console.log('[WebRTC] ✅ ID PeerJS créé:', id);
          updateState({
            isConnected: true,
            peerId: id,
            hostPeerId,
            error: null,
            isReady: isHost ? true : false, // Host is ready when connected with stream
          });

          // If host and we have a stream, start broadcasting immediately
          if (isHost && audioStream) {
            console.log('[WebRTC] Host ready - stream available');
            currentStreamRef.current = audioStream;
            onReady?.();
          }

          // If participant, connect to host for data channel
          if (!isHost) {
            console.log('[WebRTC] Participant connecting to host:', hostPeerId);
            const dataConn = peer.connect(hostPeerId);
            
            dataConn.on('open', () => {
              console.log('[WebRTC] Data connection to host established');
              dataConnectionsRef.current.set(hostPeerId, dataConn);
              updateState({ isReady: true });
            });

            dataConn.on('error', (err) => {
              console.warn('[WebRTC] Data connection error:', err);
            });
          }

          resolve(true);
        });

        // Handle incoming calls (for participants)
        peer.on('call', (call) => {
          console.log('[WebRTC] 📞 Incoming call from:', call.peer);
          
          // Auto-answer with empty stream (we only receive)
          call.answer();

          call.on('stream', (remoteStream) => {
            console.log('[WebRTC] 🔊 Receiving audio stream');
            
            // Play audio through ref element
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.play().catch(err => {
                console.warn('[WebRTC] Autoplay blocked:', err);
              });
            }

            onReceiveAudio?.(remoteStream);
          });

          call.on('close', () => {
            console.log('[WebRTC] Call closed');
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
          });
        });

        // Handle incoming data connections (for host)
        peer.on('connection', (dataConn) => {
          console.log('[WebRTC] 📡 Incoming connection from:', dataConn.peer);
          
          dataConn.on('open', () => {
            dataConnectionsRef.current.set(dataConn.peer, dataConn);
            setState(prev => ({
              ...prev,
              connectedPeers: [...prev.connectedPeers, dataConn.peer],
            }));
            onPeerConnected?.(dataConn.peer);

            // If we're already broadcasting, call the new peer
            if (currentStreamRef.current && isHost) {
              console.log('[WebRTC] Calling new peer with stream:', dataConn.peer);
              const call = peerRef.current?.call(dataConn.peer, currentStreamRef.current);
              if (call) {
                connectionsRef.current.set(dataConn.peer, call);
              }
            }
          });

          dataConn.on('close', () => {
            dataConnectionsRef.current.delete(dataConn.peer);
            connectionsRef.current.delete(dataConn.peer);
            setState(prev => ({
              ...prev,
              connectedPeers: prev.connectedPeers.filter(id => id !== dataConn.peer),
            }));
            onPeerDisconnected?.(dataConn.peer);
          });
        });

        // Handle errors
        peer.on('error', (err) => {
          console.error('[WebRTC] ❌ Error:', err.type, err.message);
          
          let errorMessage = 'Erreur de connexion WebRTC';
          
          if (err.type === 'peer-unavailable') {
            errorMessage = isHost 
              ? 'Impossible de créer la session WebRTC' 
              : 'L\'hôte n\'est pas encore connecté. Réessayez dans quelques secondes.';
          } else if (err.type === 'network') {
            errorMessage = 'Erreur réseau WebRTC. Vérifiez votre connexion.';
          } else if (err.type === 'unavailable-id') {
            errorMessage = 'Session WebRTC déjà en cours. Rafraîchissez la page.';
          }

          updateState({ error: errorMessage });
          onError?.(errorMessage);
          
          // Don't resolve false for peer-unavailable (participant might connect before host)
          if (err.type !== 'peer-unavailable') {
            resolve(false);
          }
        });

        peer.on('disconnected', () => {
          console.log('[WebRTC] Disconnected from server');
          updateState({ isConnected: false, isReady: false });
        });

        peer.on('close', () => {
          console.log('[WebRTC] Peer closed');
          updateState({ isConnected: false, peerId: null, isReady: false });
        });

        // Timeout for connection
        setTimeout(() => {
          if (!state.isConnected && !peerRef.current?.open) {
            console.warn('[WebRTC] Connection timeout');
            resolve(false);
          }
        }, 10000);

      } catch (err) {
        console.error('[WebRTC] Connection exception:', err);
        updateState({ error: 'Erreur lors de la connexion WebRTC' });
        resolve(false);
      }
    });
  }, [sessionId, isHost, audioStream, generatePeerId, getHostPeerId, updateState, onPeerConnected, onPeerDisconnected, onReceiveAudio, onError, onReady, state.isConnected]);

  // Broadcast audio to all connected peers (Host only)
  const broadcastAudio = useCallback((stream: MediaStream) => {
    if (!isHost || !peerRef.current) {
      console.warn('[WebRTC] Cannot broadcast: not host or not connected');
      return;
    }

    currentStreamRef.current = stream;

    console.log('[WebRTC] 📢 Broadcasting to', dataConnectionsRef.current.size, 'peers');

    // Call all connected participants
    dataConnectionsRef.current.forEach((_, peerId) => {
      if (!connectionsRef.current.has(peerId)) {
        console.log('[WebRTC] Calling peer:', peerId);
        const call = peerRef.current!.call(peerId, stream);
        
        call.on('close', () => {
          connectionsRef.current.delete(peerId);
        });

        connectionsRef.current.set(peerId, call);
      }
    });

    updateState({ isBroadcasting: true });
  }, [isHost, updateState]);

  // Stop broadcasting (Host only)
  const stopBroadcast = useCallback(() => {
    if (!isHost) return;

    console.log('[WebRTC] Stopping broadcast');

    // Close all media connections
    connectionsRef.current.forEach((call, peerId) => {
      call.close();
      console.log('[WebRTC] Closed call to:', peerId);
    });
    connectionsRef.current.clear();

    currentStreamRef.current = null;
    updateState({ isBroadcasting: false });
  }, [isHost, updateState]);

  // Disconnect from PeerJS
  const disconnect = useCallback(() => {
    stopBroadcast();

    // Close all data connections
    dataConnectionsRef.current.forEach((conn) => {
      conn.close();
    });
    dataConnectionsRef.current.clear();

    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Clear remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    updateState({
      isConnected: false,
      peerId: null,
      connectedPeers: [],
      isBroadcasting: false,
      isReady: false,
    });

    console.log('[WebRTC] Disconnected');
  }, [stopBroadcast, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    broadcastAudio,
    stopBroadcast,
    remoteAudioRef,
  };
}

export default usePeerAudio;
