import React, { useState, useRef, useCallback } from 'react';
import { Upload, Music, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadAudioFile, isSupabaseConfigured, UploadResult } from '@/lib/supabaseClient';
import { Track } from './PlaylistDnD';

interface TrackUploaderProps {
  sessionId: string;
  onTrackUploaded: (track: Track) => void;
  currentTrackCount: number;
  maxTracks?: number;
  disabled?: boolean;
}

type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'success' | 'error';

export const TrackUploader: React.FC<TrackUploaderProps> = ({
  sessionId,
  onTrackUploaded,
  currentTrackCount,
  maxTracks = 10,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const canUpload = currentTrackCount < maxTracks && !disabled;

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('audio/') && !file.name.endsWith('.mp3')) {
      setError('Seuls les fichiers MP3 sont acceptés');
      setStatus('error');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 50 Mo');
      setStatus('error');
      return;
    }

    setSelectedFile(file);
    setStatus('selecting');
    setError(null);
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !sessionId) return;

    setStatus('uploading');
    setProgress(0);
    setError(null);

    // Simulate progress for UX (Supabase doesn't provide progress)
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      let result: UploadResult;

      if (isSupabaseConfigured) {
        // Real Supabase upload
        result = await uploadAudioFile(selectedFile, sessionId, setProgress);
      } else {
        // Mock upload for development
        await new Promise(resolve => setTimeout(resolve, 1500));
        result = {
          success: true,
          url: URL.createObjectURL(selectedFile),
          path: `mock/${sessionId}/${selectedFile.name}`,
        };
        console.log('[MOCK] File uploaded:', result.url);
      }

      clearInterval(progressInterval);

      if (result.success && result.url) {
        setProgress(100);
        setStatus('success');

        // Extract title from filename
        const title = selectedFile.name
          .replace(/\.[^/.]+$/, '') // Remove extension
          .replace(/[_-]/g, ' ')    // Replace separators
          .trim();

        // Create new track
        const newTrack: Track = {
          id: Date.now(),
          title: title || 'Sans titre',
          artist: 'Upload utilisateur',
          src: result.url,
        };

        // Callback to parent
        onTrackUploaded(newTrack);

        // Reset after success
        setTimeout(() => {
          setStatus('idle');
          setSelectedFile(null);
          setProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } else {
        setStatus('error');
        setError(result.error || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [selectedFile, sessionId, onTrackUploaded]);

  // Cancel selection
  const handleCancel = useCallback(() => {
    setStatus('idle');
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Trigger file picker
  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,.mp3"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canUpload || status === 'uploading'}
      />

      {/* Upload Area */}
      {status === 'idle' && (
        <button
          onClick={triggerFilePicker}
          disabled={!canUpload}
          className={`
            w-full p-4 rounded-lg border-2 border-dashed transition-all
            flex flex-col items-center justify-center gap-2
            ${canUpload 
              ? 'border-white/20 hover:border-[#8A2EFF]/50 hover:bg-white/5 cursor-pointer' 
              : 'border-white/10 opacity-50 cursor-not-allowed'
            }
          `}
        >
          <Upload size={24} strokeWidth={1.5} className="text-white/50" />
          <span className="text-sm text-white/50">
            {canUpload 
              ? 'Cliquez pour ajouter un MP3' 
              : `Limite atteinte (${maxTracks} titres max)`
            }
          </span>
          <span className="text-xs text-white/30">
            {currentTrackCount}/{maxTracks} titres • Max 50 Mo
          </span>
        </button>
      )}

      {/* File Selected - Ready to upload */}
      {status === 'selecting' && selectedFile && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8A2EFF 0%, #FF2FB3 100%)' }}
            >
              <Music size={18} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{selectedFile.name}</p>
              <p className="text-white/50 text-xs">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex-1 border-white/20 text-white/70 hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              size="sm"
              className="flex-1 text-white border-none"
              style={{
                background: 'linear-gradient(135deg, #8A2EFF 0%, #FF2FB3 100%)',
              }}
            >
              <Upload size={14} strokeWidth={1.5} className="mr-1" />
              Upload
            </Button>
          </div>

          {/* Supabase status indicator */}
          {!isSupabaseConfigured && (
            <p className="text-xs text-yellow-400/70 text-center">
              ⚠️ Mode démo (Supabase non configuré)
            </p>
          )}
        </div>
      )}

      {/* Uploading */}
      {status === 'uploading' && (
        <div className="p-4 rounded-lg bg-white/5 border border-[#8A2EFF]/30 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 size={20} strokeWidth={1.5} className="text-[#8A2EFF] animate-spin" />
            <div className="flex-1">
              <p className="text-white text-sm">Upload en cours...</p>
              <p className="text-white/50 text-xs">{selectedFile?.name}</p>
            </div>
            <span className="text-[#8A2EFF] text-sm font-mono">{progress}%</span>
          </div>
          
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8A2EFF 0%, #FF2FB3 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
          <CheckCircle size={20} strokeWidth={1.5} className="text-green-400" />
          <div className="flex-1">
            <p className="text-green-400 text-sm">Upload réussi !</p>
            <p className="text-green-400/60 text-xs">Titre ajouté à la playlist</p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} strokeWidth={1.5} className="text-red-400" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">Erreur d'upload</p>
              <p className="text-red-400/60 text-xs">{error}</p>
            </div>
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrackUploader;
