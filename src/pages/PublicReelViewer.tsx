import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { BrandingPreset } from '../lib/brandingTypes'
import type { Clip, Reel } from '../lib/reelTypes'
import { appendViewEvent, getReelByShareToken } from '../lib/reelStore'
import { getBrandingPreset } from '../lib/brandingPresetsStore'
import { fetchIpLocation } from '../lib/ipapi'
import { getFallbackViewerBranding, resolveBrandingForReel } from '../lib/resolveBrandingForReel'
import { getViewerThemeClasses, type ViewerThemeClasses } from '../lib/viewerTheme'
import PlaylistPlayer from '../components/PlaylistPlayer'
import NavControls from '../components/NavControls'
import ReelReplayOverlay from '../components/ReelReplayOverlay'
import VimeoEmbedIframe from '../components/VimeoEmbedIframe'
import { getVimeoAutoplayEmbedSrc, getVimeoIdFromUrl } from '../lib/vimeo'

function getClipDisplayName(clip: Clip) {
  return clip.displayName ?? clip.vimeoTitle ?? clip.title ?? 'Untitled'
}

function GridTemplate({
  clips,
  currentIndex,
  onSelectClip,
  onPrev,
  onNext,
  onClipEnded,
  showReplayOverlay,
  onReplay,
  theme,
}: {
  clips: Clip[]
  currentIndex: number
  onSelectClip: (idx: number) => void
  onPrev: () => void
  onNext: () => void
  onClipEnded: () => void
  showReplayOverlay: boolean
  onReplay: () => void
  theme: ViewerThemeClasses
}) {
  const [isModalOpen, setModalOpen] = useState(false)
  const totalClips = clips.length
  const safeIndex = Math.min(Math.max(0, currentIndex), totalClips - 1)
  const featured = clips[safeIndex] ?? clips[0]
  const featuredSrc = featured ? getVimeoAutoplayEmbedSrc(featured.vimeoUrl) : null
  const featuredVimeoOk = featured ? getVimeoIdFromUrl(featured.vimeoUrl) : null

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 bg-transparent sm:grid-cols-3">
        {clips.map((clip, idx) => (
          <button
            key={clip.vimeoUrl}
            type="button"
            onClick={() => {
              onSelectClip(idx)
              setModalOpen(true)
            }}
            className="text-left"
          >
            <div
              className={[
                theme.thumbFrame,
                theme.thumbShell,
                idx === safeIndex ? theme.thumbBorderActive : theme.thumbBorder,
              ].join(' ')}
            >
              <img
                src={clip.thumbnail}
                alt={getClipDisplayName(clip)}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className={['mt-2 truncate text-sm font-medium', theme.clipTitle].join(' ')}>
              {getClipDisplayName(clip)}
            </div>
          </button>
        ))}
      </div>

      {isModalOpen && featured ? (
        <div
          className={['fixed inset-0 z-50 flex items-center justify-center p-4', theme.modalBackdrop].join(' ')}
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className={[
                'absolute right-0 top-0 -translate-y-3 rounded-full border px-3 py-1 text-sm',
                theme.modalClose,
              ].join(' ')}
              aria-label="Close video"
            >
              ×
            </button>
            {featuredSrc && featuredVimeoOk ? (
              <div className="relative w-full">
                <VimeoEmbedIframe
                  key={featured.vimeoUrl}
                  src={featuredSrc}
                  playbackKey={safeIndex}
                  isLastClip={safeIndex === totalClips - 1}
                  hideVideo={showReplayOverlay}
                  onEnded={onClipEnded}
                  className={['aspect-video w-full', theme.videoFrame].join(' ')}
                  title={getClipDisplayName(featured)}
                />
                <ReelReplayOverlay visible={showReplayOverlay} onReplay={onReplay} />
              </div>
            ) : (
              <div
                className={['flex aspect-video w-full items-center justify-center rounded-xl border text-sm', theme.invalidBox].join(
                  ' '
                )}
              >
                Invalid or unsupported Vimeo URL
              </div>
            )}
            <NavControls
              currentIndex={safeIndex}
              totalClips={totalClips}
              onPrev={onPrev}
              onNext={onNext}
              buttonClassName={theme.navPrevNext}
              counterClassName={theme.navCounter}
            />
          </div>
        </div>
      ) : null}

      <NavControls
        currentIndex={safeIndex}
        totalClips={totalClips}
        onPrev={onPrev}
        onNext={onNext}
        buttonClassName={theme.navPrevNext}
        counterClassName={theme.navCounter}
      />
    </>
  )
}

function ShowcaseTemplate({
  clips,
  currentIndex,
  onSelectClip,
  onPrev,
  onNext,
  onClipEnded,
  showReplayOverlay,
  onReplay,
  theme,
}: {
  clips: Clip[]
  currentIndex: number
  onSelectClip: (idx: number) => void
  onPrev: () => void
  onNext: () => void
  onClipEnded: () => void
  showReplayOverlay: boolean
  onReplay: () => void
  theme: ViewerThemeClasses
}) {
  const totalClips = clips.length
  const safeIndex = Math.min(Math.max(0, currentIndex), totalClips - 1)
  const featured = clips[safeIndex] ?? clips[0]
  const featuredSrc = featured ? getVimeoAutoplayEmbedSrc(featured.vimeoUrl) : null

  return (
    <>
      <div className={theme.showcaseFeatureSection}>
        {featured && featuredSrc ? (
          <div className="relative w-full bg-transparent">
            <VimeoEmbedIframe
              key={featured.vimeoUrl}
              src={featuredSrc}
              playbackKey={safeIndex}
              isLastClip={safeIndex === totalClips - 1}
              hideVideo={showReplayOverlay}
              onEnded={onClipEnded}
              className={['aspect-video w-full', theme.videoFrame].join(' ')}
              title={getClipDisplayName(featured)}
            />
            <ReelReplayOverlay visible={showReplayOverlay} onReplay={onReplay} />
          </div>
        ) : featured ? (
          <div
            className={['flex aspect-video w-full items-center justify-center rounded-xl border text-sm', theme.invalidBox].join(' ')}
          >
            Invalid or unsupported Vimeo URL
          </div>
        ) : null}
      </div>

      <div className={theme.showcaseThumbGrid}>
        {clips.map((clip, idx) => (
          <button
            key={clip.vimeoUrl}
            type="button"
            onClick={() => onSelectClip(idx)}
            className="text-left"
          >
            <div
              className={[
                theme.thumbFrame,
                theme.thumbShell,
                idx === safeIndex ? theme.thumbBorderActive : theme.thumbBorder,
              ].join(' ')}
            >
              <img
                src={clip.thumbnail}
                alt={getClipDisplayName(clip)}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className={['mt-2 truncate text-sm font-medium', theme.clipTitle].join(' ')}>
              {getClipDisplayName(clip)}
            </div>
          </button>
        ))}
      </div>

      <NavControls
        currentIndex={safeIndex}
        totalClips={totalClips}
        onPrev={onPrev}
        onNext={onNext}
        buttonClassName={theme.navPrevNext}
        counterClassName={theme.navCounter}
      />
    </>
  )
}

export default function PublicReelViewer() {
  const params = useParams()
  const shareToken = params.id

  const [reel, setReel] = useState<Reel | null | undefined>(undefined)
  const [brandingPreset, setBrandingPreset] = useState<BrandingPreset | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showReplayOverlay, setShowReplayOverlay] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!shareToken) {
      setReel(null)
      setBrandingPreset(null)
      return
    }
    let cancelled = false
    setReel(undefined)
    setBrandingPreset(null)
    void getReelByShareToken(shareToken).then(async (r) => {
      if (cancelled) return
      if (!r) {
        setReel(null)
        return
      }
      let p: BrandingPreset | null = null
      if (r.brandingPresetId) {
        p = await getBrandingPreset(r.brandingPresetId)
      }
      if (cancelled) return
      setBrandingPreset(p)
      setReel(r)
    })
    return () => {
      cancelled = true
    }
  }, [shareToken])

  useEffect(() => {
    if (!shareToken || reel == null || reel === undefined) return
    let cancelled = false

    ;(async () => {
      try {
        const location = await fetchIpLocation()
        if (cancelled) return
        const event = {
          timestamp: new Date().toISOString(),
          city: location.city,
          country: location.country,
        }
        await appendViewEvent(shareToken, event)
      } catch (err) {
        void err
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shareToken, reel])

  const clipsLength = reel?.clips.length ?? 0
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, clipsLength - 1))
  indexRef.current = safeIndex

  const handleClipEnded = useCallback(() => {
    const i = indexRef.current
    if (i < clipsLength - 1) {
      setShowReplayOverlay(false)
      setCurrentIndex(i + 1)
    } else {
      setShowReplayOverlay(true)
    }
  }, [clipsLength])

  const handleReplay = useCallback(() => {
    setShowReplayOverlay(false)
    setCurrentIndex(0)
  }, [])

  if (reel === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white p-4">
        <p className="text-sm text-zinc-600">Loading…</p>
      </div>
    )
  }

  if (!reel) {
    const branding = getFallbackViewerBranding()
    const theme = getViewerThemeClasses(branding.background)
    return (
      <div
        className={theme.page}
        style={{
          fontFamily: branding.fontStack,
          ...(branding.background === 'white' ? { backgroundColor: '#ffffff' } : {}),
        }}
      >
        <header className="px-6 pb-4 pt-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            {branding.logoDataUrl ? (
              <a
                href={branding.logoLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full justify-center"
                aria-label={branding.fallbackText}
              >
                <img
                  src={branding.logoDataUrl}
                  alt=""
                  className="max-h-[120px] w-auto max-w-full object-contain object-center"
                />
              </a>
            ) : (
              <div className={['text-xl font-semibold tracking-wide', theme.clipTitle].join(' ')}>{branding.fallbackText}</div>
            )}
          </div>
        </header>
        <div className="mx-auto w-full max-w-4xl">
          <div className={theme.panel}>
            <h1 className={['text-xl font-semibold', theme.clipTitle].join(' ')}>Reel not found</h1>
            <p className={['mt-2 text-sm', theme.clipMuted].join(' ')}>
              The reel may have been created on another browser.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const branding = resolveBrandingForReel(reel, brandingPreset)
  const theme = getViewerThemeClasses(branding.background)

  const totalClips = clipsLength

  const goNext = () => {
    setShowReplayOverlay(false)
    setCurrentIndex((i) => (i + 1 < totalClips ? i + 1 : i))
  }
  const goPrev = () => {
    setShowReplayOverlay(false)
    setCurrentIndex((i) => (i > 0 ? i - 1 : i))
  }
  const selectClip = (idx: number) => {
    setShowReplayOverlay(false)
    setCurrentIndex(idx)
  }

  const template = reel.template === 'playlist' ? 'playlist' : reel.template === 'showcase' ? 'showcase' : 'grid'

  return (
    <div
      className={theme.page}
      style={{
        fontFamily: branding.fontStack,
        ...(branding.background === 'white' ? { backgroundColor: '#ffffff' } : {}),
      }}
    >
      <header className="px-6 pb-3 pt-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          {branding.logoDataUrl ? (
            <a
              href={branding.logoLinkUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-4 inline-flex max-w-full justify-center"
              aria-label={branding.fallbackText}
            >
              <img
                src={branding.logoDataUrl}
                alt=""
                className="max-h-[120px] w-auto max-w-full object-contain object-center"
              />
            </a>
          ) : (
            <div className={['mb-4 text-xl font-semibold tracking-wide', theme.clipTitle].join(' ')}>{branding.fallbackText}</div>
          )}
          <h1
            className={[
              '!mt-3 mb-0 w-full text-center !text-[1.375rem] font-medium uppercase tracking-widest',
              theme.reelTitle,
            ].join(' ')}
          >
            {reel.name}
          </h1>
        </div>
      </header>
      <div className="mx-auto w-full max-w-4xl">
        <div className={theme.panel}>
          {template === 'grid' ? (
            <GridTemplate
              clips={reel.clips}
              currentIndex={safeIndex}
              onSelectClip={selectClip}
              onPrev={goPrev}
              onNext={goNext}
              onClipEnded={handleClipEnded}
              showReplayOverlay={showReplayOverlay}
              onReplay={handleReplay}
              theme={theme}
            />
          ) : template === 'showcase' ? (
            <ShowcaseTemplate
              clips={reel.clips}
              currentIndex={safeIndex}
              onSelectClip={selectClip}
              onPrev={goPrev}
              onNext={goNext}
              onClipEnded={handleClipEnded}
              showReplayOverlay={showReplayOverlay}
              onReplay={handleReplay}
              theme={theme}
            />
          ) : (
            <PlaylistPlayer clips={reel.clips} viewerTheme={theme} />
          )}

          {reel.clips.length === 0 ? (
            <div className={['mt-8 text-left text-sm', theme.emptyState].join(' ')}>No clips added yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
