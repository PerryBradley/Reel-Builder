import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Clip, Reel, ReelTemplate, ReelId } from '../lib/reelTypes'
import { createReel, getReelById, getShareUrl, updateReel } from '../lib/reelStore'
import { fetchVimeoOEmbed, formatDurationSeconds } from '../lib/vimeo'
import BrandingPresetPicker from '../components/BrandingPresetPicker'
import ClipReorder from '../components/ClipReorder'
import TemplatePicker from '../components/TemplatePicker'

const inputClass =
  'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400'

export default function BuilderNewReel() {
  const [name, setName] = useState('')
  const [template, setTemplate] = useState<ReelTemplate>('showcase')
  const [clips, setClips] = useState<Clip[]>([])

  const [vimeoUrl, setVimeoUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [generatedReelId, setGeneratedReelId] = useState<ReelId | null>(null)
  const [generatedReel, setGeneratedReel] = useState<Reel | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [brandingPresetId, setBrandingPresetId] = useState<string | undefined>(undefined)
  const savedTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!generatedReelId) {
      setGeneratedReel(null)
      setShareUrl(null)
      return
    }
    let cancelled = false
    void getReelById(generatedReelId).then((r) => {
      if (!cancelled) setGeneratedReel(r)
    })
    void getShareUrl(generatedReelId).then((url) => {
      if (!cancelled) setShareUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [generatedReelId])

  useEffect(() => {
    if (generatedReel) {
      setBrandingPresetId(generatedReel.brandingPresetId)
    }
  }, [generatedReel])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
    }
  }, [])

  async function handleAddClip() {
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

  async function handleGenerateLink() {
    console.log('[BuilderNewReel] handleGenerateLink fired')
    setError(null)
    const n = name.trim()
    if (!n) {
      setError('Reel name is required.')
      console.log('[BuilderNewReel] generate blocked: missing name')
      return
    }
    if (clips.length === 0) {
      setError('Add at least one Vimeo clip.')
      console.log('[BuilderNewReel] generate blocked: no clips')
      return
    }

    try {
      if (!generatedReelId) {
        const reel = await createReel({ name: n, template, clips, brandingPresetId })
        console.log('[BuilderNewReel] generated new reel id', reel.id)
        setGeneratedReelId(reel.id)
      } else {
        await updateReel(generatedReelId, { name: n, template, clips, brandingPresetId })
        console.log('[BuilderNewReel] updated existing reel id', generatedReelId)
        void getShareUrl(generatedReelId).then(setShareUrl)
        void getReelById(generatedReelId).then(setGeneratedReel)
      }
    } catch (err) {
      console.error('[BuilderNewReel] generate failed', err)
      setError('Failed to generate link. Please try again.')
    }
  }

  async function ensureSavedReel(): Promise<ReelId | null> {
    console.log('[BuilderNewReel] ensureSavedReel start')
    setError(null)
    const n = name.trim()
    if (!n) {
      setError('Reel name is required.')
      console.log('[BuilderNewReel] save blocked: missing name')
      return null
    }
    if (clips.length === 0) {
      setError('Add at least one Vimeo clip.')
      console.log('[BuilderNewReel] save blocked: no clips')
      return null
    }

    try {
      if (!generatedReelId) {
        const reel = await createReel({ name: n, template, clips, brandingPresetId })
        console.log('[BuilderNewReel] created reel id for save/preview', reel.id)
        setGeneratedReelId(reel.id)
        return reel.id
      }

      const existing = await getReelById(generatedReelId)
      if (!existing) {
        const reel = await createReel({ name: n, template, clips, brandingPresetId })
        console.log('[BuilderNewReel] stale reel id, recreated', reel.id)
        setGeneratedReelId(reel.id)
        return reel.id
      }

      await updateReel(generatedReelId, {
        name: n,
        template,
        clips,
        brandingPresetId,
      })
      console.log('[BuilderNewReel] updated reel id for save/preview', generatedReelId)
      return generatedReelId
    } catch (err) {
      console.error('[BuilderNewReel] ensureSavedReel failed', err)
      setError('Failed to save reel. Please try again.')
      return null
    }
  }

  async function handleSaveChanges() {
    const reelId = await ensureSavedReel()
    if (!reelId) return
    setSaved(true)
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
    savedTimerRef.current = window.setTimeout(() => setSaved(false), 1500)
  }

  async function handlePreview() {
    console.log('[BuilderNewReel] handlePreview fired')
    const reelId = await ensureSavedReel()
    if (!reelId) {
      console.log('[BuilderNewReel] preview aborted: no reel id')
      return
    }
    const previewUrl = await getShareUrl(reelId)
    console.log('[BuilderNewReel] opening preview url', previewUrl)
    if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
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
                Create a new reel
              </h1>
              <p className="mt-1 text-sm text-zinc-600">Add clips, pick a template, then generate a link.</p>
            </div>
            <div className="md:w-[320px]">
              <button
                type="button"
                onClick={() => void handlePreview()}
                className="mb-3 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateLink()}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Generate Link
              </button>
              {shareUrl ? (
                <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
                  <div className="font-semibold text-zinc-900">Share URL</div>
                  <a href={shareUrl} target="_blank" rel="noreferrer" className="break-all text-zinc-900 underline">
                    {shareUrl}
                  </a>

                  {generatedReel ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveChanges()}
                        className={[
                          'w-full rounded-lg px-4 py-2 text-sm font-medium transition',
                          saved
                            ? 'border border-emerald-600 bg-emerald-500 text-white'
                            : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50',
                        ].join(' ')}
                      >
                        {saved ? 'Saved ✓' : 'Save changes'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="reel-name">
                Reel name
              </label>
              <input
                id="reel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Honda — Executive Producer Reel"
              />
            </div>

            <div>
              <TemplatePicker value={template} onChange={setTemplate} />
            </div>
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
            <BrandingPresetPicker value={brandingPresetId} onChange={setBrandingPresetId} id="new-reel-branding" />
          </div>
        </div>
      </div>
    </div>
  )
}
