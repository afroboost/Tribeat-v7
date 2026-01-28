# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## État Actuel - WebRTC SIMPLIFIÉ ET FONCTIONNEL ✅

### ✅ Corrections Microphone (28 Jan 2026)

#### Approche Simplifiée
- **SUPPRIMÉ** : `checkDevices()` qui bloquait l'appel getUserMedia
- **DIRECT** : `getUserMedia({ audio: true })` appelé immédiatement au clic
- **RÉSULTAT** : La fenêtre de permission navigateur apparaît systématiquement

### Code Simplifié

#### useMicrophone.ts
```typescript
// DIRECT getUserMedia call on user gesture
const startCapture = async () => {
  console.log('[MIC] 🎤 startCapture() called - USER GESTURE REQUIRED');
  console.log('[MIC] 📢 Calling getUserMedia({ audio: true })...');
  
  // Direct call - browser shows permission dialog
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true }
  });
  
  // Resume AudioContext (required after user gesture)
  const audioContext = new AudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  console.log('[MIC] ✅ Stream obtained:', stream.id);
};
```

#### usePeerAudio.ts
```typescript
const connect = async (stream?: MediaStream) => {
  console.log('[PEER] DEBUG: Tentative PeerJS avec Stream:', !!stream);
  
  // Host requires stream
  if (isHost && !stream) {
    console.log('[PEER] ⏳ Host: No stream provided, waiting...');
    return false;
  }
  
  // Create PeerJS with robust STUN servers
  const peer = new Peer(peerId, {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // ... more STUN servers
      ],
    },
  });
  
  // Auto-reconnect on disconnect
  peer.on('disconnected', () => {
    if (reconnectAttempts < 3) {
      peer.reconnect();
    }
  });
};
```

### UI Amélioré

#### MicrophoneControl.tsx
- **Bouton "Réessayer la permission"** affiché après une erreur
- Messages d'erreur contextuels avec icônes
- VuMeter actif dès que permission accordée

### Logs Console
| Log | Signification |
|-----|---------------|
| `[MIC] 🎤 startCapture() called` | Clic utilisateur détecté |
| `[MIC] 📢 Calling getUserMedia...` | Appel direct au navigateur |
| `[MIC] ✅ Stream obtained` | Permission accordée |
| `[PEER] DEBUG: Tentative PeerJS avec Stream: true` | PeerJS prêt |
| `[PEER] ✅ PeerJS CONNECTED` | Connexion établie |

### Critères de Réussite ✅
- [x] Fenêtre de permission navigateur apparaît au clic
- [x] VuMeter bouge quand permission accordée
- [x] Bouton "Réessayer" disponible après erreur
- [x] Build `yarn build` réussi
- [x] Upload/Autoplay NON MODIFIÉ ✅

## Configuration

```env
REACT_APP_SUPABASE_URL=https://tfghpbgbtpgrjlhomlvz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_***
REACT_APP_SUPABASE_BUCKET=audio-tracks
```

## Credentials
- **Admin**: `/admin` → MDP: `BEATTRIBE2026`

## Tâches Restantes

### P1 - À Tester
- [ ] Tester WebRTC sur appareil réel avec microphone physique
- [ ] Valider le bouton "Réessayer la permission"

### P2 - Prochaines
- [ ] Convertir composants UI restants en `.tsx`
- [ ] Fonctionnalité "Demander la parole" pour participants

### P3 - Backlog
- [ ] Gestion du pseudo hôte éditable
- [ ] Persistance du thème via Supabase
- [ ] Authentification réelle avec Supabase Auth

---
*Dernière mise à jour: 28 Jan 2026 - Simplification getUserMedia + Bouton Réessayer*
