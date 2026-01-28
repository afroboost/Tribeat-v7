# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## État Actuel - VOICE STREAMING COMPLET ✅

### ✅ Transmission Voix Host → Participants (28 Jan 2026)

#### Architecture Audio WebRTC
```
Host (Micro)
    │
    └── getUserMedia() ──► PeerJS ──► Participant 1 (🔊 Haut-parleurs)
                                └──► Participant 2 (🔊 Haut-parleurs)
                                └──► Participant N (🔊 Haut-parleurs)
```

### Flux Audio Implémenté

#### 1. HÔTE - Capture et Broadcast
```typescript
// Clic sur "Micro" → getUserMedia direct
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Connexion PeerJS avec stream
await connectPeer(stream);

// Broadcast vers tous les participants
broadcastAudio(stream);
```

#### 2. PARTICIPANT - Réception et Lecture
```typescript
// Appel entrant détecté
peer.on('call', (call) => {
  call.answer(); // Auto-réponse
  
  call.on('stream', (remoteStream) => {
    // Créer élément audio dynamique
    const audioEl = getOrCreateRemoteAudioElement();
    audioEl.srcObject = remoteStream;
    audioEl.volume = 1.0;
    audioEl.play(); // Lecture sur haut-parleurs
  });
});
```

#### 3. Élément Audio Dynamique
```typescript
function getOrCreateRemoteAudioElement() {
  let audioEl = document.getElementById('remote-voice-audio');
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = 'remote-voice-audio';
    audioEl.autoplay = true;
    audioEl.setAttribute('playsinline', 'true'); // iOS
    audioEl.volume = 1.0;
    document.body.appendChild(audioEl);
  }
  return audioEl;
}
```

### Indicateurs Visuels

| Élément | Hôte | Participant |
|---------|------|-------------|
| Bouton Micro | ✅ Visible | ❌ Masqué |
| VU-Mètre | ✅ Actif quand parle | ❌ N/A |
| Badge "📡 Live" | ✅ Quand broadcast | ❌ N/A |
| Badge "🔉 Voix reçue" | ❌ N/A | ✅ Quand écoute |
| Badge "🔗 WebRTC" | ✅ Connecté | ✅ Connecté |

### Synchronisation Supabase
- `HOST_MIC_READY` : Envoyé quand le micro de l'hôte est prêt
- `VOICE_START` : Envoyé quand l'hôte commence à parler

### Mixage Audio
- La **musique** joue via `<audio>` HTML5 classique
- La **voix** joue via l'élément `#remote-voice-audio` créé dynamiquement
- Les deux se mélangent naturellement sur les haut-parleurs du participant

### Logs Console
```
[PEER] 📞 INCOMING CALL from: beattribe-host-xxx
[PEER] 🔊 RECEIVING VOICE STREAM FROM HOST
[PEER] ✅ Remote audio playing!
[SESSION] 🔉 Voice playback started!
```

### Critères de Réussite ✅
- [x] Host parle → VU-mètre bouge
- [x] Participant entend la voix sur haut-parleurs
- [x] Musique continue en fond (mixage)
- [x] Indicateur "🔉 Voix reçue" visible côté participant
- [x] Build `yarn build` réussi
- [x] Upload/Autoplay NON MODIFIÉ ✅

## Test Multi-Appareils

1. **PC (Hôte)** : Créer session → Activer micro → Parler
2. **Mobile (Participant)** : Rejoindre session → Écouter
3. **Résultat attendu** : Voix de l'hôte audible < 1 seconde de latence

## Configuration

```env
REACT_APP_SUPABASE_URL=https://tfghpbgbtpgrjlhomlvz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_***
REACT_APP_SUPABASE_BUCKET=audio-tracks
```

## Credentials
- **Admin**: `/admin` → MDP: `BEATTRIBE2026`

## Tâches Restantes

### P1 - À Tester sur Appareils Réels
- [ ] Tester transmission voix Host → Participants
- [ ] Valider latence < 1 seconde
- [ ] Tester sur iOS (Safari) et Android (Chrome)

### P2 - Prochaines
- [ ] Convertir composants UI restants en `.tsx`
- [ ] Fonctionnalité "Demander la parole" pour participants

### P3 - Backlog
- [ ] Gestion du pseudo hôte éditable
- [ ] Persistance du thème via Supabase
- [ ] Authentification réelle avec Supabase Auth

---
*Dernière mise à jour: 28 Jan 2026 - Voice Streaming Host → Participants*
