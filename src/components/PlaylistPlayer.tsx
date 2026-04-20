import { useCallback, useRef, useState } from 'react'
import type { Clip } from '../lib/reelTypes'
import { getVimeoAutoplayEmbedSrc, getVimeoIdFromUrl } from '../lib/vimeo'
import type { ViewerThemeClasses } from '../lib/viewerTheme'
import { getViewerThemeClasses } from '../lib/viewerTheme'
import NavControls from './NavControls'
import ReelReplayOverlay from './ReelReplayOverlay'
import VimeoEmbedIframe from './VimeoEmbedIframe'

function getClipDisplayName(clip: Clip) {
  return clip.displayName ?? clip.vimeoTitle ?? clip.title ?? 'Untitled'
}

type PlaylistPlayerProps = {
  clips: Clip[]
  viewerTheme?: ViewerThemeClasses
  /** When true, embed uses unmuted autoplay (use after a user gesture on the public viewer). */
  startedWithAudio?: boolean
}

export default function PlaylistPlayer({ clips, viewerTheme, startedWithAudio }: PlaylistPlayerProps) {
  const theme = viewerTheme ?? getViewerThemeClasses('black')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showReplayOverlay, setShowReplayOverlay] = useState(false)
  const indexRef = useRef(0)

  const totalClips = clips.length
  const safeIndex = Math.min(Math.max(0, currentIndex), totalClips - 1)
  indexRef.current = safeIndex
  const currentClip = clips[safeIndex] ?? null
  const embedSrc = currentClip
    ? getVimeoAutoplayEmbedSrc(currentClip.vimeoUrl, !startedWithAudio)
    : null
  const vimeoId = currentClip ? getVimeoIdFromUrl(currentClip.vimeoUrl) : null

  const handleEnded = useCallback(() => {
    console.log('[Playlist] handleEnded called, index:', indexRef.current, 'total:', totalClips)
    const i = indexRef.current
    if (i < totalClips - 1) {
      setShowReplayOverlay(false)
      setCurrentIndex(i + 1)
    } else {
      setShowReplayOverlay(true)
    }
  }, [totalClips])

  const handleReplay = useCallback(() => {
    setShowReplayOverlay(false)
    setCurrentIndex(0)
  }, [])

  const goToClip = (index: number) => {
    setShowReplayOverlay(false)
    setCurrentIndex(index)
  }
  const goNext = () => goToClip(Math.min(safeIndex + 1, totalClips - 1))
  const goPrev = () => goToClip(Math.max(safeIndex - 1, 0))

  if (totalClips === 0) {
    return <div className={['mt-6 text-sm', theme.emptyState].join(' ')}>No clips added yet.</div>
  }

  return (
    <div className="mt-6 flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 min-w-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-transparent">
          {embedSrc && vimeoId && currentClip ? (
            <>
              <VimeoEmbedIframe
                key={currentClip.vimeoUrl}
                src={embedSrc}
                playbackKey={safeIndex}
                isLastClip={safeIndex === totalClips - 1}
                hideVideo={showReplayOverlay}
                onEnded={handleEnded}
                className="h-full w-full"
                title={getClipDisplayName(currentClip)}
              />
              <ReelReplayOverlay visible={showReplayOverlay} onReplay={handleReplay} />
            </>
          ) : (
            <div className={['flex h-full items-center justify-center text-sm', theme.emptyState].join(' ')}>
              Invalid Vimeo URL
            </div>
          )}
        </div>

        <NavControls
          currentIndex={safeIndex}
          totalClips={totalClips}
          onPrev={goPrev}
          onNext={goNext}
          buttonClassName={theme.navPrevNext}
          counterClassName={theme.navCounter}
        />
      </div>

      <div className="w-full lg:w-64 lg:flex-shrink-0">
        <div className={['text-xs font-medium uppercase tracking-wider', theme.playlistHeading].join(' ')}>
          Playlist
        </div>
        <div className="mt-2 flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[420px]">
          {clips.map((clip, idx) => (
            <button
              key={clip.vimeoUrl}
              type="button"
              onClick={() => goToClip(idx)}
              className={[
                'flex min-w-[140px] flex-shrink-0 items-center gap-3 rounded-lg border p-2 text-left transition-colors lg:min-w-0',
                idx === safeIndex ? theme.playlistItemActive : theme.playlistItemIdle,
              ].join(' ')}
            >
              <img
                src={clip.thumbnail}
                alt=""
                className="h-12 w-20 flex-shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className={['truncate text-sm font-medium', theme.clipTitle].join(' ')}>
                  {getClipDisplayName(clip)}
                </div>
                {clip.duration ? (
                  <div className={['text-xs', theme.clipMuted].join(' ')}>{clip.duration}</div>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
