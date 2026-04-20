export type VimeoOEmbedResult = {
  title: string
  thumbnailUrl: string
  /** Duration in seconds. May be absent for some videos (e.g. domain-restricted). */
  durationSeconds?: number
}

export function getVimeoIdFromUrl(vimeoUrl: string): string | null {
  const raw = vimeoUrl.trim()
  if (!raw) return null

  // Embed URLs: https://player.vimeo.com/video/123456789?h=...
  const playerEmbed = raw.match(/player\.vimeo\.com\/video\/(\d+)/i)
  if (playerEmbed?.[1]) return playerEmbed[1]

  try {
    const u = new URL(raw)
    const parts = u.pathname.split('/').filter(Boolean)
    // https://player.vimeo.com/video/123456789
    if (parts.length >= 2 && parts[0] === 'video' && /^\d+$/.test(parts[1]!)) {
      return parts[1]!
    }
    // https://vimeo.com/123456789
    if (parts.length >= 1 && /^\d+$/.test(parts[0]!)) return parts[0]!
  } catch {
    // ignore
  }

  const match = raw.match(/vimeo\.com\/(?:video\/)?(\d+)(?:$|[/?#])/i)
  return match?.[1] ?? null
}

/**
 * Vimeo iframe src with autoplay.
 * @param muted When true (default), `muted=1` helps satisfy browser autoplay without a prior gesture; set false after user interaction for audible playback.
 */
export function getVimeoAutoplayEmbedSrc(vimeoUrl: string, muted: boolean = true): string {
  const match = vimeoUrl.match(/(\d{6,12})/)
  if (!match?.[1]) return vimeoUrl
  const videoId = match[1]
  const mutedParam = muted ? '1' : '0'
  return `https://player.vimeo.com/video/${videoId}?api=1&autoplay=1&loop=0&muted=${mutedParam}`
}

export async function fetchVimeoOEmbed(vimeoUrl: string): Promise<VimeoOEmbedResult> {
  const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Vimeo oEmbed failed (${res.status})`)
  }

  const data: unknown = await res.json()
  if (!data || typeof data !== 'object') {
    throw new Error('Vimeo oEmbed returned unexpected data')
  }

  const obj = data as Record<string, unknown>
  const title = typeof obj.title === 'string' ? obj.title : 'Untitled'
  const thumbnailUrl = typeof obj.thumbnail_url === 'string' ? obj.thumbnail_url : ''
  const durationSeconds =
    typeof obj.duration === 'number' && obj.duration > 0 ? Math.floor(obj.duration) : undefined

  if (!thumbnailUrl) {
    // Still allow creation; the UI will show a fallback thumbnail.
    return { title, thumbnailUrl, durationSeconds }
  }

  return { title, thumbnailUrl, durationSeconds }
}

/** Format seconds as "m:ss" for display. */
export function formatDurationSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Parse duration string ("1:32" or "92") to seconds. Returns 60 as fallback. */
export function parseDurationToSeconds(duration?: string): number {
  if (!duration || typeof duration !== 'string') return 60
  const parts = duration.trim().split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0]!, 10)
    const s = parseInt(parts[1]!, 10)
    if (!Number.isNaN(m) && !Number.isNaN(s)) return m * 60 + s
  }
  if (parts.length === 1) {
    const n = parseInt(parts[0]!, 10)
    if (!Number.isNaN(n) && n > 0) return n
  }
  return 60
}

