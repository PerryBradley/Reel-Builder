import type { Reel, ReelId, ReelTemplate } from './reelTypes'
import type { Clip, ViewEvent } from './reelTypes'
import { getDefaultBrandingPresetId } from './brandingPresetsStore'
import { supabase } from './supabase'

function safeParseJsonArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value as T[]
}

function normalizeClip(clip: unknown): Clip | null {
  if (!clip || typeof clip !== 'object') return null
  const obj = clip as Record<string, unknown>

  const vimeoUrl = typeof obj.vimeoUrl === 'string' ? obj.vimeoUrl : null
  const thumbnail = typeof obj.thumbnail === 'string' ? obj.thumbnail : ''
  if (!vimeoUrl) return null

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

  if (typeof obj.title === 'string') normalized.title = obj.title

  return normalized
}

function rowToReel(row: Record<string, unknown>): Reel | null {
  const id = typeof row.id === 'string' ? row.id : null
  const name = typeof row.name === 'string' ? row.name : null
  const template =
    row.template === 'grid' || row.template === 'showcase' || row.template === 'playlist'
      ? row.template
      : 'showcase'
  const created = typeof row.created_at === 'string' ? row.created_at : new Date().toISOString()

  if (!id || !name) return null

  const clipsRaw = safeParseJsonArray<unknown>(row.clips)
  const clips = clipsRaw.map((c) => normalizeClip(c)).filter((c): c is Clip => c !== null)

  const viewsRaw = safeParseJsonArray<unknown>(row.views)
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

  const brandingPresetId =
    typeof row.branding_preset_id === 'string' && row.branding_preset_id.length > 0
      ? row.branding_preset_id
      : undefined

  const rawShare =
    (typeof row.share_token === 'string' && row.share_token) ||
    (typeof row.shareToken === 'string' && row.shareToken) ||
    ''
  const shareToken = rawShare.length > 0 ? rawShare : null

  const reel: Reel = {
    id,
    name,
    template,
    created,
    clips,
    views,
    shareToken,
  }
  if (brandingPresetId) reel.brandingPresetId = brandingPresetId
  return reel
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user
}

export async function listReels(): Promise<Reel[]> {
  const user = await requireUser()
  const { data, error } = await supabase
    .from('reels')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map((r) => rowToReel(r as Record<string, unknown>)).filter((r): r is Reel => r !== null)
}

export async function getReelById(id: ReelId): Promise<Reel | null> {
  const user = await requireUser()
  const { data, error } = await supabase.from('reels').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()

  if (error || !data) return null
  return rowToReel(data as Record<string, unknown>)
}

/** Same as getReelById (Supabase migration API name). */
export const getReel = getReelById

export async function getReelByShareToken(shareToken: string): Promise<Reel | null> {
  const { data, error } = await supabase.from('reels').select('*').eq('share_token', shareToken).maybeSingle()

  if (error || !data) return null
  return rowToReel(data as Record<string, unknown>)
}

export async function saveReel(reel: Reel): Promise<void> {
  const user = await requireUser()
  let shareToken = reel.shareToken?.trim() || null
  if (!shareToken) {
    const { data } = await supabase
      .from('reels')
      .select('share_token')
      .eq('id', reel.id)
      .eq('user_id', user.id)
      .maybeSingle()
    const existing =
      data && typeof (data as { share_token?: unknown }).share_token === 'string'
        ? (data as { share_token: string }).share_token.trim()
        : ''
    shareToken = existing.length > 0 ? existing : crypto.randomUUID()
  }

  const { error } = await supabase.from('reels').upsert(
    {
      id: reel.id,
      user_id: user.id,
      name: reel.name,
      template: reel.template,
      clips: reel.clips,
      views: reel.views,
      branding_preset_id: reel.brandingPresetId ?? null,
      share_token: shareToken,
      created_at: reel.created,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) throw error
}

export async function createReel(input: {
  name: string
  template: ReelTemplate
  clips: Clip[]
  brandingPresetId?: string | null
}): Promise<Reel> {
  const user = await requireUser()
  const shareToken = crypto.randomUUID()

  const resolvedBranding =
    input.brandingPresetId != null && input.brandingPresetId !== ''
      ? input.brandingPresetId
      : await getDefaultBrandingPresetId()

  const { data, error } = await supabase
    .from('reels')
    .insert({
      user_id: user.id,
      name: input.name,
      template: input.template,
      clips: input.clips,
      views: [],
      branding_preset_id: resolvedBranding ?? null,
      share_token: shareToken,
    })
    .select('*')
    .single()

  if (error || !data) throw error ?? new Error('Failed to create reel')

  const reel = rowToReel(data as Record<string, unknown>)
  if (!reel) throw new Error('Invalid reel row')
  return reel
}

export async function updateReel(id: ReelId, patch: Partial<Omit<Reel, 'id'>>): Promise<void> {
  const reel = await getReelById(id)
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
  await saveReel(next)
}

export async function appendViewEvent(shareToken: string, event: ViewEvent): Promise<void> {
  const { error } = await supabase.rpc('append_reel_view', {
    p_share_token: shareToken,
    p_event: event,
  })
  if (error) console.error('[reelStore] appendViewEvent', error)
}

export async function getViewCount(id: ReelId): Promise<number> {
  const reel = await getReelById(id)
  return reel?.views.length ?? 0
}

export async function getLastViewEvent(id: ReelId): Promise<ViewEvent | null> {
  const reel = await getReelById(id)
  if (!reel || reel.views.length === 0) return null
  return reel.views[reel.views.length - 1] ?? null
}

/** Public viewer path is `/reel/:id` where the segment is `share_token`, not the reel row UUID. */
export function buildPublicReelUrl(shareToken: string): string {
  return `${window.location.origin}/reel/${encodeURIComponent(shareToken)}`
}

export function shareUrlFromReel(reel: Reel | null | undefined): string | null {
  const t = reel?.shareToken?.trim()
  if (!t) return null
  return buildPublicReelUrl(t)
}

export async function getShareUrl(reelId: ReelId): Promise<string | null> {
  const reel = await getReelById(reelId)
  return shareUrlFromReel(reel)
}

export async function regenerateReelLink(id: ReelId): Promise<ReelId | null> {
  const reel = await getReelById(id)
  if (!reel) return null

  const newToken = crypto.randomUUID()
  const { error } = await supabase
    .from('reels')
    .update({
      share_token: newToken,
      views: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return null
  return id
}

export async function deleteReel(id: ReelId): Promise<void> {
  const user = await requireUser()
  await supabase.from('reels').delete().eq('id', id).eq('user_id', user.id)
}

export async function deleteAllUserReels(): Promise<void> {
  const user = await requireUser()
  await supabase.from('reels').delete().eq('user_id', user.id)
}
