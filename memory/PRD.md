# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## État Actuel - Capture Microphone Implémentée

### ✅ Fonctionnalités Microphone (28 Jan 2026)

#### Hook `useMicrophone.ts`
- Capture audio via `navigator.mediaDevices.getUserMedia`
- VU Meter temps réel avec AudioContext + AnalyserNode
- Gestion des erreurs (permission refusée, pas de micro, micro occupé)
- Contrôle du volume via GainNode
- Switch de périphérique audio

#### Composant `MicrophoneControl.tsx`
- Bouton Micro avec états visuels (Off/On/Muted)
- VU Meter segmenté pour feedback visuel
- Duck Effect : baisse automatique du volume musique quand l'hôte parle
- Gestion des erreurs avec messages clairs

#### Composant `VuMeter.tsx`
- Indicateur horizontal et vertical
- Version segmentée (style hardware)
- Couleurs dynamiques (vert → orange → rouge)

### Architecture Duck Effect

```typescript
// SessionPage.tsx
const handleDuckMusic = useCallback((shouldDuck: boolean) => {
  const audioEl = document.querySelector('audio');
  if (shouldDuck && !musicDucked) {
    originalVolumeRef.current = audioEl.volume;
    audioEl.volume = audioEl.volume * 0.3; // Duck to 30%
  } else if (!shouldDuck && musicDucked) {
    audioEl.volume = originalVolumeRef.current; // Restore
  }
}, [musicDucked]);
```

### Interface Participant

```typescript
// ParticipantControls.tsx
interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMicActive?: boolean; // Indicateur micro actif
  audioLevel?: number;   // Pour VU meter
  // ...
}
```

### Gestion des Erreurs Microphone

| Code | Message affiché |
|------|-----------------|
| NotAllowedError | "Accès au microphone refusé" |
| NotFoundError | "Aucun microphone détecté" |
| NotReadableError | "Microphone utilisé par une autre app" |

### Fichiers Créés/Modifiés

| Fichier | Description |
|---------|-------------|
| `/hooks/useMicrophone.ts` | Hook de capture audio |
| `/components/audio/VuMeter.tsx` | Indicateur de niveau |
| `/components/audio/MicrophoneControl.tsx` | Composant UI complet |
| `/components/audio/ParticipantControls.tsx` | Ajout indicateur mic |
| `/pages/SessionPage.tsx` | Intégration duck effect |

### Checklist

- [x] Capture via getUserMedia
- [x] VU Meter fonctionnel
- [x] Duck Effect implémenté
- [x] Gestion erreurs propre
- [x] Build réussi ✅

### Prochaines Étapes WebRTC

Pour la diffusion audio P2P en temps réel :
1. **Signaling** : Utiliser Supabase Realtime pour l'échange SDP/ICE
2. **PeerJS** ou **simple-peer** : Pour établir les connexions P2P
3. **Architecture** :
   - Hôte → Tous (broadcast voix)
   - Participant → Hôte (demande de parole)

```
┌─────────────────┐     Supabase Realtime (signaling)     ┌─────────────────┐
│      Host       │◄────────────────────────────────────►│   Participant   │
│                 │                                       │                 │
│  MediaStream    │         WebRTC P2P (audio)           │  MediaStream    │
│  (mic capture)  │◄─────────────────────────────────────►│  (playback)     │
└─────────────────┘                                       └─────────────────┘
```

## Configuration

```env
REACT_APP_SUPABASE_URL=https://tfghpbgbtpgrjlhomlvz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_***
REACT_APP_SUPABASE_BUCKET=audio-tracks
```

## Credentials
- **Admin**: `/admin` → MDP: `BEATTRIBE2026`

---
*Dernière mise à jour: 28 Jan 2026 - Capture microphone avec VU Meter et Duck Effect*
