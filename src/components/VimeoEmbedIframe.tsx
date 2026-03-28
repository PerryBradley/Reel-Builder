import { useEffect, useRef } from 'react'

type VimeoEmbedIframeProps = {
  src: string
  onEnded: () => void
  /** Changes when the user navigates clips so ended state resets cleanly (e.g. Next/Previous). */
  playbackKey: number
  /** When true, playProgress/finish use last-clip rules (scrub to end still shows replay). */
  isLastClip: boolean
  /** Hide the iframe (e.g. while replay overlay is up) so the player cannot loop visibly underneath. */
  hideVideo?: boolean
  className?: string
  title?: string
}

type VimeoPlayerMessage = {
  event?: string
  data?: unknown
}

function parseVimeoMessage(raw: unknown): VimeoPlayerMessage | null {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as VimeoPlayerMessage
    } catch {
      return null
    }
  }
  if (raw && typeof raw === 'object' && 'event' in raw) {
    return raw as VimeoPlayerMessage
  }
  return null
}

/** playProgress: data.data.percent; timeupdate: seconds / duration */
function playProgressPercent(data: VimeoPlayerMessage): number | null {
  const d = data.data
  if (!d || typeof d !== 'object') return null
  const obj = d as { percent?: unknown; seconds?: unknown; duration?: unknown }
  if (typeof obj.percent === 'number') return obj.percent
  if (
    typeof obj.seconds === 'number' &&
    typeof obj.duration === 'number' &&
    obj.duration > 0
  ) {
    return obj.seconds / obj.duration
  }
  return null
}

export default function VimeoEmbedIframe({
  src,
  onEnded,
  playbackKey,
  isLastClip,
  hideVideo = false,
  className,
  title,
}: VimeoEmbedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded
  const isLastClipRef = useRef(isLastClip)
  isLastClipRef.current = isLastClip

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let endedFired = false
    let lastClipNearEndLatch = false

    function triggerEnded() {
      console.log('[Vimeo] triggerEnded called, endedFired was:', endedFired)
      if (endedFired) return
      endedFired = true
      onEndedRef.current()
    }

    function onMessage(e: MessageEvent) {
      const data = parseVimeoMessage(e.data)
      if (data) {
        console.log('[Vimeo message]', data.event, data)
      }
      if (!data?.event) return

      if (data.event === 'ready') {
        const win = iframeRef.current?.contentWindow
        if (!win) return
        const subscribe = (value: string) => {
          win.postMessage(JSON.stringify({ method: 'addEventListener', value }), '*')
        }
        subscribe('finish')
        subscribe('ended')
        subscribe('playProgress')
        subscribe('timeupdate')
        console.log('[Vimeo] ready — subscribing to finish + playProgress')
        return
      }

      if (data.event === 'finish' || data.event === 'ended') {
        if (isLastClipRef.current) {
          lastClipNearEndLatch = true
          console.log('[Vimeo] last clip onEnded called')
          onEndedRef.current()
          return
        }
        triggerEnded()
        return
      }

      if (data.event === 'playProgress' || data.event === 'timeupdate') {
        const pct = playProgressPercent(data)
        if (pct == null) return

        if (isLastClipRef.current) {
          if (pct >= 0.98) {
            if (!lastClipNearEndLatch) {
              lastClipNearEndLatch = true
              console.log('[Vimeo] last clip onEnded called')
              onEndedRef.current()
            }
          } else if (pct < 0.85) {
            lastClipNearEndLatch = false
          }
          return
        }

        if (pct >= 0.98) {
          triggerEnded()
        }
      }
    }

    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [src, playbackKey])

  return (
    <div
      className={className}
      style={{
        overflow: 'hidden',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
      }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        className="h-full w-full min-h-0 border-0 outline-none shadow-none"
        style={{ visibility: hideVideo ? 'hidden' : 'visible', display: 'block' }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
      />
    </div>
  )
}
