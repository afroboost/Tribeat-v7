# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## État Actuel - WebRTC Voice Broadcast Implémenté

### ✅ Fonctionnalités WebRTC (28 Jan 2026)

#### PeerJS Integration
- **Signaling** : ID basé sur session (`beattribe-host-{sessionId}`)
- **Hôte** : Crée un Peer serveur, broadcast vers tous les participants
- **Participant** : Se connecte au Peer de l'Hôte, reçoit audio
- **STUN servers** : Google STUN pour traversée NAT

#### Diffusion Audio
```
Host (mic) ──► PeerJS ──► Participant 1 (audio)
                    └──► Participant 2 (audio)
                    └──► Participant N (audio)
```

#### Mixage
- Audio du micro et musique jouent **simultanément**
- Duck Effect : Musique baisse à 30% quand l'hôte parle

### Architecture Technique

```typescript
// usePeerAudio.ts
const peer = new Peer(peerId, {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  },
});

// Host broadcasts to all
peer.on('connection', (dataConn) => {
  const call = peer.call(dataConn.peer, micStream);
});

// Participant receives
peer.on('call', (call) => {
  call.answer();
  call.on('stream', (remoteStream) => {
    audioElement.srcObject = remoteStream;
    audioElement.play();
  });
});
```

### Fichiers Créés/Modifiés

| Fichier | Description |
|---------|-------------|
| `/hooks/usePeerAudio.ts` | Hook PeerJS complet |
| `/hooks/useMicrophone.ts` | Capture audio + stream |
| `/components/audio/MicrophoneControl.tsx` | Ajout `onStreamReady` |
| `/pages/SessionPage.tsx` | Intégration PeerJS |

### UI Indicators

| Indicateur | Signification |
|------------|---------------|
| 🔗 WebRTC | Connexion PeerJS établie |
| 📡 Live | En cours de broadcast |
| Micro On | Capture active |

### Gestion du Mute

- Quand l'hôte coupe son micro :
  1. `hostMicStream` devient `null`
  2. `stopBroadcast()` appelé
  3. Flux PeerJS arrêté
  4. Indicateur passe de "📡 Live" à "🔗 WebRTC"

### Checklist

- [x] PeerJS installé
- [x] Signaling via ID session
- [x] Hôte broadcast via `peer.call()`
- [x] Participant reçoit via `peer.on('call')`
- [x] Audio caché pour playback
- [x] Gestion mute → arrêt flux
- [x] Upload/Autoplay NON MODIFIÉ ✅
- [x] Build réussi ✅

### Test Multi-Appareils

1. **PC (Hôte)** : Créer session, activer micro
2. **Mobile (Participant)** : Rejoindre session
3. **Parler** dans le micro PC
4. **Écouter** sur le mobile (< 1 seconde de latence)

### Erreurs Gérées

| Type | Message |
|------|---------|
| `peer-unavailable` | "L'hôte n'est pas encore connecté" |
| `network` | "Erreur réseau WebRTC" |
| `unavailable-id` | "Session déjà en cours" |

## Configuration

```env
REACT_APP_SUPABASE_URL=https://tfghpbgbtpgrjlhomlvz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_***
REACT_APP_SUPABASE_BUCKET=audio-tracks
```

## Credentials
- **Admin**: `/admin` → MDP: `BEATTRIBE2026`

---
*Dernière mise à jour: 28 Jan 2026 - WebRTC Voice Broadcast avec PeerJS*
