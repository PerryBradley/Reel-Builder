import type { IsoTimestamp, Reel, ReelId, ReelTemplate } from './reelTypes'
import type { Clip, ViewEvent } from './reelTypes'
import { getDefaultBrandingPresetId } from './brandingPresetsStore'

const STORAGE_KEY = 'filmConstructionReels:v1'
const GLOBAL_LOGO_KEY = 'filmConstructionGlobalLogo:v1'

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function getNowIso(): IsoTimestamp {
  return new Date().toISOString()
}

function createReelId(): ReelId {
  // `crypto.randomUUID` is widely supported in modern browsers.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `reel_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function normalizeClip(clip: unknown): Clip | null {
  if (!clip || typeof clip !== 'object') return null
  const obj = clip as Record<string, unknown>

  const vimeoUrl = typeof obj.vimeoUrl === 'string' ? obj.vimeoUrl : null
  const thumbnail = typeof obj.thumbnail === 'string' ? obj.thumbnail : null
  if (!vimeoUrl || !thumbnail) return null

  // New fields
  const vimeoTitle =
    typeof obj.vimeoTitle === 'string' ? obj.vimeoTitle : typeof obj.title === 'string' ? obj.title : undefined
  const displayName =
    typeof obj.displayName === 'string'
      ? obj.displayName
      : typeof vimeoTitle === 'string'
        ? vimeoTitle
        : typeof obj.title === 'string'
          ? obj.title
          : undefined

  const duration = typeof obj.duration === 'string' ? obj.duration : undefined
  const durationSeconds =
    typeof obj.durationSeconds === 'number' && obj.durationSeconds > 0 ? obj.durationSeconds : undefined

  const normalized: Clip = {
    vimeoUrl,
    thumbnail,
    duration,
    durationSeconds,
    vimeoTitle,
    displayName,
  }

  // Preserve legacy field if present.
  if (typeof obj.title === 'string') normalized.title = obj.title

  return normalized
}

function normalizeReel(raw: unknown): Reel | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const id = typeof obj.id === 'string' ? obj.id : null
  const name = typeof obj.name === 'string' ? obj.name : null
  const template =
    obj.template === 'grid' || obj.template === 'showcase' || obj.template === 'playlist'
      ? obj.template
      : 'grid'
  const created = typeof obj.created === 'string' ? obj.created : getNowIso()

  if (!id || !name) return null

  const clipsRaw = Array.isArray(obj.clips) ? obj.clips : []
  const clips = clipsRaw.map((c) => normalizeClip(c)).filter((c): c is Clip => c !== null)

  const viewsRaw = Array.isArray(obj.views) ? obj.views : []
  const brandingPresetId =
    typeof obj.brandingPresetId === 'string' && obj.brandingPresetId.length > 0
      ? obj.brandingPresetId
      : undefined

  const views: ViewEvent[] = viewsRaw
    .map((v) => {
      if (!v || typeof v !== 'object') return null
      const o = v as Record<string, unknown>
      const timestamp = typeof o.timestamp === 'string' ? o.timestamp : null
      const city = typeof o.city === 'string' ? o.city : null
      const country = typeof o.country === 'string' ? o.country : null
      if (!timestamp || !city || !country) return null
      return { timestamp, city, country } satisfies ViewEvent
    })
    .filter((v): v is ViewEvent => v !== null)

  const reel: Reel = { id, name, template, created, clips, views }
  if (brandingPresetId) reel.brandingPresetId = brandingPresetId
  return reel
}

export function listReels(): Reel[] {
  const parsed = safeParseJson<unknown>(typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY))
  if (!parsed || !Array.isArray(parsed)) return []

  return parsed.map((r) => normalizeReel(r)).filter((r): r is Reel => r !== null)
}

export function getReelById(id: ReelId): Reel | null {
  const reels = listReels()
  return reels.find((r) => r.id === id) ?? null
}

function writeReels(reels: Reel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reels))
}

export function upsertReel(next: Reel) {
  const reels = listReels()
  const idx = reels.findIndex((r) => r.id === next.id)
  if (idx === -1) {
    reels.push(next)
  } else {
    reels[idx] = next
  }
  writeReels(reels)
}

export function createReel(input: {
  name: string
  template: ReelTemplate
  clips: Clip[]
  brandingPresetId?: string | null
}): Reel {
  const id = createReelId()
  const now = getNowIso()

  const resolvedBranding =
    input.brandingPresetId != null && input.brandingPresetId !== ''
      ? input.brandingPresetId
      : getDefaultBrandingPresetId()

  const reel: Reel = {
    id,
    name: input.name,
    template: input.template,
    created: now,
    clips: input.clips,
    views: [],
  }
  if (resolvedBranding) reel.brandingPresetId = resolvedBranding

  upsertReel(reel)
  return reel
}

export function updateReel(id: ReelId, patch: Partial<Omit<Reel, 'id'>>) {
  const reel = getReelById(id)
  if (!reel) return
  const next: Reel = { ...reel, ...patch, id }
  if (Object.prototype.hasOwnProperty.call(patch, 'brandingPresetId')) {
    const bid = patch.brandingPresetId
    if (bid === undefined || bid === null || bid === '') {
      delete next.brandingPresetId
    } else {
      next.brandingPresetId = bid
    }
  }
  upsertReel(next)
}

export function appendViewEvent(id: ReelId, event: ViewEvent) {
  const reel = getReelById(id)
  if (!reel) return
  const next: Reel = { ...reel, views: [...reel.views, event] }
  upsertReel(next)
}

export function getViewCount(id: ReelId): number {
  const reel = getReelById(id)
  return reel?.views.length ?? 0
}

export function getLastViewEvent(id: ReelId): ViewEvent | null {
  const reel = getReelById(id)
  if (!reel || reel.views.length === 0) return null
  return reel.views[reel.views.length - 1] ?? null
}

export function getShareUrl(id: ReelId): string {
  return `${window.location.origin}/reel/${encodeURIComponent(id)}`
}

export function regenerateReelLink(id: ReelId): ReelId | null {
  const reel = getReelById(id)
  if (!reel) return null

  const newId = createReelId()
  const now = getNowIso()

  const next: Reel = {
    ...reel,
    id: newId,
    created: now,
    views: [], // reset analytics
  }

  const reels = listReels()
  const nextReels = reels.filter((r) => r.id !== id)
  nextReels.push(next)
  writeReels(nextReels)

  return newId
}

export function deleteReel(id: ReelId) {
  const reels = listReels()
  const nextReels = reels.filter((r) => r.id !== id)
  writeReels(nextReels)
}

export function getGlobalLogoDataUrl(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(GLOBAL_LOGO_KEY)
}

export function setGlobalLogoDataUrl(dataUrl: string) {
  localStorage.setItem(GLOBAL_LOGO_KEY, dataUrl)
}

export function removeGlobalLogoDataUrl() {
  localStorage.removeItem(GLOBAL_LOGO_KEY)
}

