import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Music, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Track {
  id: number;
  title: string;
  artist: string;
  src: string;
  coverArt?: string;
}

interface SortableTrackItemProps {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track) => void;
  isHost: boolean;
}

const SortableTrackItem: React.FC<SortableTrackItemProps> = ({
  track,
  isSelected,
  onSelect,
  isHost,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-all group
        ${isSelected 
          ? 'bg-white/10 border border-[#8A2EFF]/50' 
          : 'bg-[var(--bt-surface-alpha)] border border-white/10 hover:bg-white/5'
        }
        ${isDragging ? 'shadow-lg shadow-[#8A2EFF]/20 z-50' : ''}
      `}
    >
      {/* Drag Handle */}
      {isHost && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={16} strokeWidth={1.5} />
        </button>
      )}

      {/* Track Info */}
      <button
        onClick={() => isHost && onSelect(track)}
        disabled={!isHost}
        className={`flex-1 flex items-center gap-3 text-left ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {/* Cover Art */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8A2EFF 0%, #FF2FB3 100%)' }}
        >
          {isSelected ? (
            <Play size={18} strokeWidth={1.5} className="text-white ml-0.5" fill="currentColor" />
          ) : (
            <Music size={18} strokeWidth={1.5} className="text-white/80" />
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate text-sm">{track.title}</p>
          <p className="text-white/50 text-xs truncate">{track.artist}</p>
        </div>
      </button>

      {/* Selected Indicator */}
      {isSelected && (
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: '#8A2EFF' }}
        />
      )}
    </div>
  );
};

interface PlaylistDnDProps {
  tracks: Track[];
  selectedTrack: Track | null;
  onTrackSelect: (track: Track) => void;
  onReorder: (tracks: Track[]) => void;
  isHost: boolean;
  maxTracks?: number;
}

export const PlaylistDnD: React.FC<PlaylistDnDProps> = ({
  tracks,
  selectedTrack,
  onTrackSelect,
  onReorder,
  isHost,
  maxTracks = 10,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      const newTracks = arrayMove(tracks, oldIndex, newIndex);
      onReorder(newTracks);
    }
  };

  // Limit tracks display
  const displayTracks = tracks.slice(0, maxTracks);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-white/50 text-xs">
          {displayTracks.length} / {maxTracks} titres
        </p>
        {isHost && (
          <p className="text-white/30 text-xs">
            Glisser pour réorganiser
          </p>
        )}
      </div>

      {/* Scrollable Playlist */}
      <ScrollArea className="h-[400px] pr-2 playlist-scroll">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayTracks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {displayTracks.map((track) => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack.id === track.id}
                  onSelect={onTrackSelect}
                  isHost={isHost}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </div>
  );
};

export default PlaylistDnD;
