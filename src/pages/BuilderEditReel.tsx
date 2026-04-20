import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Clip, Reel, ReelId, ReelTemplate } from '../lib/reelTypes'
import { getReelById, regenerateReelLink, shareUrlFromReel, updateReel } from '../lib/reelStore'
import { fetchVimeoOEmbed, formatDurationSeconds } from '../lib/vimeo'
import BrandingPresetPicker from '../components/BrandingPresetPicker'
import ClipReorder from '../components/ClipReorder'
import TemplatePicker from '../components/TemplatePicker'
import { warmPageBackgroundStyle } from '../lib/warmPageBackground'

const inputClass =
  'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400'

export default function BuilderEditReel() {
  const params = useParams()
  const reelId = params.id as ReelId | undefined

  const [reel, setReel] = useState<Reel | null>(null)
  const [reelLoading, setReelLoading] = useState(true)

  const [name, setName] = useState('')
  const [template, setTemplate] = useState<ReelTemplate>('grid')
  const [clips, setClips] = useState<Clip[]>([])

  const [vimeoUrl, setVimeoUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [brandingPresetId, setBrandingPresetId] = useState<string | undefined>(undefined)
  const savedTimerRef = useRef<number | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!reelId) {
      setReel(null)
      setReelLoading(false)
      return
    }
    let cancelled = false
    setReelLoading(true)
    void getReelById(reelId).then((r) => {
      if (cancelled) return
      setReel(r)
      setReelLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reelId])

  useEffect(() => {
    if (!reel) return
    setName(reel.name)
    setTemplate(reel.template)
    setClips(reel.clips)
    setBrandingPresetId(reel.brandingPresetId)
  }, [reel])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
    }
  }, [])

  useEffect(() => {
    setShareUrl(shareUrlFromReel(reel))
  }, [reel])

  async function handleCopyShareUrl() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = shareUrl
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      } catch {
        setError('Unable to copy link in this browser.')
      }
    }
  }

  async function handleGenerateNewLink() {
    if (!reelId) return
    const ok = window.confirm(
      'Are you sure? This will reset all view analytics and the old link will stop working.'
    )
    if (!ok) return

    const newId = await regenerateReelLink(reelId)
    if (!newId) return
    const refreshed = await getReelById(reelId)
    if (refreshed) setReel(refreshed)
  }

  async function handleAddClip() {
    if (!reelId) return
    setError(null)
    const trimmed = vimeoUrl.trim()
    if (!trimmed) {
      setError('Paste a Vimeo URL.')
      return
    }
    if (clips.some((c) => c.vimeoUrl === trimmed)) {
      setError('That clip is already added.')
      return
    }

    setBusy(true)
    try {
      const meta = await fetchVimeoOEmbed(trimmed)
      const nextClip: Clip = {
        vimeoUrl: trimmed,
        vimeoTitle: meta.title,
        displayName: meta.title,
        thumbnail: meta.thumbnailUrl,
        duration: meta.durationSeconds != null ? formatDurationSeconds(meta.durationSeconds) : undefined,
        durationSeconds: meta.durationSeconds,
      }

      setClips((prev) => [...prev, nextClip])
      setVimeoUrl('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch Vimeo metadata.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveChanges() {
    if (!reelId) return
    setError(null)
    await updateReel(reelId, {
      name: name.trim(),
      template,
      clips,
      brandingPresetId,
    })
    setSaved(true)
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
    savedTimerRef.current = window.setTimeout(() => setSaved(false), 1500)
  }

  if (reelLoading) {
    return (
      <div className="min-h-dvh text-zinc-900" style={warmPageBackgroundStyle}>
        <div className="mx-auto w-full max-w-5xl p-6">
          <p className="text-sm text-zinc-600">Loading…</p>
        </div>
      </div>
    )
  }

  if (!reel) {
    return (
      <div className="min-h-dvh text-zinc-900" style={warmPageBackgroundStyle}>
        <div className="mx-auto w-full max-w-5xl p-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
            <h1 className="text-xl font-semibold text-zinc-900">Reel not found</h1>
            <p className="mt-2 text-sm text-zinc-600">The reel may have been created on another browser.</p>
            <div className="mt-4">
              <Link to="/builder" className="text-sm font-medium text-zinc-900 underline hover:no-underline">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh text-zinc-900" style={warmPageBackgroundStyle}>
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-3">
            <Link
              to="/builder"
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
            >
              ← Home
            </Link>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1
                className="!text-zinc-900 mt-1 text-2xl font-semibold"
                style={{ color: '#000000' }}
              >
                Edit reel
              </h1>
              <p className="mt-1 text-sm text-zinc-600">Reorder clips, update template, then save.</p>
            </div>

            <div className="md:w-[320px]">
              {shareUrl ? (
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Preview
                </a>
              ) : (
                <span
                  className="mb-3 w-full cursor-not-allowed rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-50"
                  title="Generate a link first"
                >
                  Preview
                </span>
              )}
              {shareUrl ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
                  <div className="font-semibold text-zinc-900">Share URL</div>
                  <div className="mt-2 flex items-start gap-2">
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 break-all text-zinc-900 underline"
                    >
                      {shareUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleCopyShareUrl()}
                      className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSaveChanges()}
                className={[
                  'mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium transition',
                  saved
                    ? 'border border-emerald-600 bg-emerald-500 text-white'
                    : 'bg-zinc-900 text-white hover:opacity-90',
                ].join(' ')}
              >
                {saved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-zinc-700" htmlFor="reel-name">
              Reel name
            </label>
            <input id="reel-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700" htmlFor="vimeo-url">
                  Add a Vimeo URL
                </label>
                <input
                  id="vimeo-url"
                  value={vimeoUrl}
                  onChange={(e) => setVimeoUrl(e.target.value)}
                  className={inputClass}
                  placeholder="Paste a link like https://vimeo.com/123456789"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleAddClip()}
                disabled={busy}
                className="h-[44px] rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                {busy ? 'Fetching...' : 'Add Clip'}
              </button>
            </div>

            {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
          </div>

          {clips.length > 0 ? (
            <div className="mt-6">
              <ClipReorder
                clips={clips}
                onChange={setClips}
                onRemoveClip={(v) => setClips((prev) => prev.filter((c) => c.vimeoUrl !== v))}
              />
            </div>
          ) : (
            <div className="mt-6 text-sm text-zinc-600">No clips added yet.</div>
          )}

          <div className="mt-6 max-w-xl">
            <BrandingPresetPicker value={brandingPresetId} onChange={setBrandingPresetId} id="edit-reel-branding" />
          </div>

          <div className="mt-6">
            <TemplatePicker value={template} onChange={setTemplate} />
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => void handleGenerateNewLink()}
              className="text-left text-xs text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              Generate New Link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
