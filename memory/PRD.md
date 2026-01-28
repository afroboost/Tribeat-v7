# Beattribe - Product Requirements Document

## Vision
**"Unite Through Rhythm"** - Application d'écoute musicale synchronisée en temps réel.

## État Actuel - Autoplay & Repeat Implémentés

### ✅ Fonctionnalités Ajoutées (28 Jan 2026)

#### Modes de Répétition
- **none** : Pas de répétition, passe au suivant automatiquement
- **all** : Boucle sur la playlist entière
- **one** : Répète la piste en cours indéfiniment

#### Autoplay
- Transition automatique vers le titre suivant
- Synchronisation avec les participants via Supabase
- Gestion propre des événements avec cleanup useEffect

### Architecture Technique

```typescript
// useAudioSync.ts - Nouveau type
export type RepeatMode = 'none' | 'one' | 'all';

// Cycle: none → all → one → none
const cycleRepeatMode = () => {
  setRepeatMode(prev => {
    switch (prev) {
      case 'none': return 'all';
      case 'all': return 'one';
      case 'one': return 'none';
    }
  });
};

// Gestionnaire onEnded avec cleanup
useEffect(() => {
  const audio = audioRef.current;
  const handleEnded = () => {
    if (repeatMode === 'one') {
      audio.currentTime = 0;
      audio.play();
    } else {
      onTrackEnded?.(); // Parent gère next track
    }
  };
  audio.addEventListener('ended', handleEnded);
  return () => audio.removeEventListener('ended', handleEnded);
}, [repeatMode, onTrackEnded]);
```

### Fichiers Modifiés

| Fichier | Modifications |
|---------|---------------|
| `useAudioSync.ts` | Ajout RepeatMode, cycleRepeatMode, onTrackEnded callback |
| `AudioPlayer.tsx` | Bouton Repeat avec Lucide icons (Repeat/Repeat1) |
| `SessionPage.tsx` | handleTrackEnded pour autoplay + sync |

### Règles Anti-Casse Respectées

- [x] **TrackUploader.tsx** : Non modifié ✅
- [x] **TypeScript** : Pas de `any`, tout typé ✅
- [x] **useEffect cleanup** : Fonction de nettoyage pour onEnded ✅
- [x] **Sync Supabase** : currentTrackIndex synchronisé ✅
- [x] **Build** : `npm run build` réussi ✅

### UI du Bouton Repeat

```
Icône     | Mode  | Couleur
----------|-------|--------
🔁 (fin)  | none  | Gris (white/40)
🔁 (gras) | all   | Violet (#8A2EFF)
🔂 (1)    | one   | Violet (#8A2EFF)
```

### Test de Régression

- [x] Upload MP3 fonctionne toujours
- [x] Playlist drag & drop OK
- [x] Sync multi-appareils OK
- [x] Modération (mute/eject) OK

## Configuration Supabase

```env
REACT_APP_SUPABASE_URL=https://tfghpbgbtpgrjlhomlvz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_***
REACT_APP_SUPABASE_BUCKET=audio-tracks
```

## Credentials Test
- **Admin**: `/admin` → MDP: `BEATTRIBE2026`
- **Preview**: https://beattribe-live.preview.emergentagent.com

---
*Dernière mise à jour: 28 Jan 2026 - Autoplay & Repeat implémentés*
