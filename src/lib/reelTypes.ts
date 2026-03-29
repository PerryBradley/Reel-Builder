export type ReelTemplate = 'grid' | 'showcase' | 'playlist'

export type IsoTimestamp = string

export type ReelId = string

export interface Clip {
  vimeoUrl: string
  // Vimeo-provided title fetched via oEmbed.
  // Kept separate so the Builder can edit a user-facing display name.
  vimeoTitle?: string
  displayName?: string

  // Legacy support: earlier versions stored Vimeo title in `title`.
  title?: string
  thumbnail: string
  /** Human-readable duration (e.g. "1:32") for display. */
  duration?: string
  /** Duration in seconds for timer-based auto-advance. */
  durationSeconds?: number
}

export interface ViewEvent {
  timestamp: IsoTimestamp
  city: string
  country: string
}

export interface Reel {
  id: ReelId
  name: string
  template: ReelTemplate
  created: IsoTimestamp
  clips: Clip[]
  views: ViewEvent[]
  /** Saved branding preset id (see brandingPresetsStore). */
  brandingPresetId?: string
  /** Public share slug for /reel/:token (Supabase). */
  shareToken?: string | null
}

