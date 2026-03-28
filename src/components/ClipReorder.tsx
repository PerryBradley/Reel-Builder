import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Clip } from '../lib/reelTypes'

type ClipReorderProps = {
  clips: Clip[]
  onChange: (next: Clip[]) => void
  onRemoveClip?: (vimeoUrl: string) => void
}

function SortableClipRow({
  clip,
  onRemove,
  onUpdateDisplayName,
}: {
  clip: Clip
  onRemove?: (vimeoUrl: string) => void
  onUpdateDisplayName: (vimeoUrl: string, nextDisplayName: string) => void
}) {
  const displayName = clip.displayName ?? clip.vimeoTitle ?? clip.title ?? 'Untitled'
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(displayName)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: clip.vimeoUrl,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className="cursor-grab text-zinc-500 hover:text-zinc-900"
      >
        ⋮⋮
      </button>

      {clip.thumbnail ? (
        <img
          src={clip.thumbnail}
          alt={displayName}
          className="h-12 w-20 flex-none rounded-md bg-zinc-100 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-12 w-20 flex-none rounded-md bg-zinc-100" aria-label="Thumbnail unavailable" />
      )}

      <div className="min-w-0 flex-1 text-left">
        {isEditingName ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              const next = draftName.trim() || 'Untitled'
              setIsEditingName(false)
              onUpdateDisplayName(clip.vimeoUrl, next)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const next = draftName.trim() || 'Untitled'
                setIsEditingName(false)
                onUpdateDisplayName(clip.vimeoUrl, next)
              }
              if (e.key === 'Escape') {
                setIsEditingName(false)
                setDraftName(displayName)
              }
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(displayName)
              setIsEditingName(true)
            }}
            className="truncate text-left text-sm font-medium text-zinc-900 hover:underline"
            aria-label="Edit clip display name"
          >
            {displayName}
          </button>
        )}
        {clip.duration ? <div className="text-xs text-zinc-600">{clip.duration}</div> : null}
      </div>

      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(clip.vimeoUrl)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Remove
        </button>
      ) : null}
    </div>
  )
}

export default function ClipReorder({ clips, onChange, onRemoveClip }: ClipReorderProps) {
  const sensors = useSensors(useSensor(PointerSensor))

  function updateDisplayName(vimeoUrl: string, nextDisplayName: string) {
    onChange(clips.map((c) => (c.vimeoUrl === vimeoUrl ? { ...c, displayName: nextDisplayName } : c)))
  }

  function handleDragEnd(event: { active: { id: string | number }; over: { id: string | number } | null }) {
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    const oldIndex = clips.findIndex((c) => c.vimeoUrl === String(active.id))
    const newIndex = clips.findIndex((c) => c.vimeoUrl === String(over.id))

    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(clips, oldIndex, newIndex))
  }

  return (
    <div>
      <div className="mb-2 text-left text-sm font-medium text-zinc-700">Clips</div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={clips.map((c) => c.vimeoUrl)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {clips.map((clip) => (
              <SortableClipRow
                key={clip.vimeoUrl}
                clip={clip}
                onRemove={onRemoveClip}
                onUpdateDisplayName={updateDisplayName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

