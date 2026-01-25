import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import type { AudioState, SyncState } from '@/hooks/useAudioSync';

// Demo tracks for testing
const DEMO_TRACKS = [
  {
    id: 1,
    title: 'Midnight Groove',
    artist: 'Beattribe Collective',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverArt: '',
  },
  {
    id: 2,
    title: 'Urban Pulse',
    artist: 'DJ Neon',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverArt: '',
  },
  {
    id: 3,
    title: 'Summer Vibes',
    artist: 'The Rhythm Makers',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverArt: '',
  },
];

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isSynced: boolean;
}

// Mock participants
const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alex M.', avatar: 'AM', isSynced: true },
  { id: '2', name: 'Sarah K.', avatar: 'SK', isSynced: true },
  { id: '3', name: 'Mike R.', avatar: 'MR', isSynced: false },
  { id: '4', name: 'Emma L.', avatar: 'EL', isSynced: true },
];

export const SessionPage: React.FC = () => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  
  const [isHost, setIsHost] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(DEMO_TRACKS[0]);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS);

  // Handle audio state changes
  const handleAudioStateChange = useCallback((state: AudioState) => {
    setAudioState(state);
  }, []);

  // Handle sync state changes
  const handleSyncStateChange = useCallback((state: SyncState) => {
    setSyncState(state);
    if (state.isLive) {
      showToast('Session live démarrée !', 'success');
    }
  }, [showToast]);

  // Toggle host/participant mode
  const toggleMode = useCallback(() => {
    setIsHost(prev => !prev);
    showToast(
      isHost ? 'Mode participant activé' : 'Mode hôte activé',
      'default'
    );
  }, [isHost, showToast]);

  // Select track
  const handleTrackSelect = useCallback((track: typeof DEMO_TRACKS[0]) => {
    setSelectedTrack(track);
    showToast(`Piste sélectionnée: ${track.title}`, 'success');
  }, [showToast]);

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: '#000000',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${theme.colors.primary} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-15 blur-3xl"
          style={{ background: `radial-gradient(circle, ${theme.colors.secondary} 0%, transparent 70%)` }}
        />
      </div>

      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ 
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: theme.colors.gradient.primary }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <span 
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: theme.colors.gradient.primary,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {theme.name}
                </span>
              </Link>
              <Badge variant="outline" className="text-white/70 border-white/30">
                Session Live
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="text-white/70 hover:text-white"
              >
                {isHost ? '👑 Hôte' : '👤 Participant'}
              </Button>
              <Link to="/">
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10">
                  ← Retour
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Title */}
            <div>
              <h1 
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Session d'écoute
              </h1>
              <p className="text-white/60">
                {isHost 
                  ? 'Vous êtes l\'hôte. Contrôlez la lecture pour tous les participants.'
                  : 'Mode écoute seule. La lecture est synchronisée avec l\'hôte.'
                }
              </p>
            </div>

            {/* Audio Player */}
            <AudioPlayer
              src={selectedTrack.src}
              title={selectedTrack.title}
              artist={selectedTrack.artist}
              coverArt={selectedTrack.coverArt}
              isHost={isHost}
              onStateChange={handleAudioStateChange}
              onSyncUpdate={handleSyncStateChange}
            />

            {/* Track Selection (Host only) */}
            {isHost && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    Playlist
                  </CardTitle>
                  <CardDescription className="text-white/50">
                    Sélectionnez une piste à partager
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {DEMO_TRACKS.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => handleTrackSelect(track)}
                        className={`
                          w-full p-3 rounded-lg text-left transition-all
                          flex items-center gap-3
                          ${selectedTrack.id === track.id 
                            ? 'bg-white/10 border border-[#8A2EFF]/50' 
                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                          }
                        `}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #8A2EFF 0%, #FF2FB3 100%)' }}
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{track.title}</p>
                          <p className="text-white/50 text-sm truncate">{track.artist}</p>
                        </div>
                        {selectedTrack.id === track.id && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ background: '#8A2EFF' }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span 
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        syncState?.isLive ? 'animate-ping' : ''
                      }`}
                      style={{ background: syncState?.isLive ? '#8A2EFF' : '#666' }}
                    />
                    <span 
                      className="relative inline-flex rounded-full h-3 w-3"
                      style={{ background: syncState?.isLive ? '#8A2EFF' : '#666' }}
                    />
                  </span>
                  Statut de la session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">État</span>
                  <Badge 
                    className={syncState?.isLive 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-white/10 text-white/60 border-white/20'
                    }
                  >
                    {syncState?.isLive ? 'En direct' : 'En pause'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Mode</span>
                  <span className="text-white text-sm">{isHost ? 'Hôte' : 'Participant'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Latence</span>
                  <span className="text-white text-sm font-mono">
                    {syncState?.latency?.toFixed(0) || 0}ms
                  </span>
                </div>
                {audioState && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Position</span>
                    <span className="text-white text-sm font-mono">
                      {(audioState.currentTime * 1000).toFixed(0)}ms
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ background: 'linear-gradient(135deg, #8A2EFF 0%, #FF2FB3 100%)' }}
                      >
                        {participant.avatar}
                      </div>
                      <span className="text-white text-sm flex-1">{participant.name}</span>
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          participant.isSynced ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                        title={participant.isSynced ? 'Synchronisé' : 'En synchronisation...'}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  💡 Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/60 text-sm space-y-2">
                {isHost ? (
                  <>
                    <p>• Cliquez sur <strong>Go Live</strong> pour démarrer la diffusion</p>
                    <p>• Utilisez les contrôles pour gérer la lecture</p>
                    <p>• Les participants se synchroniseront automatiquement</p>
                  </>
                ) : (
                  <>
                    <p>• Vous êtes en mode écoute seule</p>
                    <p>• La lecture est contrôlée par l'hôte</p>
                    <p>• Ajustez le volume à votre convenance</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionPage;
