import { useMemo } from 'react'
import { getVimeoIdFromUrl } from '../lib/vimeo'

type VimeoPlayerProps = {
  vimeoUrl: string
  autoplay?: boolean
  className?: string
}

export default function VimeoPlayer({ vimeoUrl, autoplay, className }: VimeoPlayerProps) {
  const vimeoId = useMemo(() => getVimeoIdFromUrl(vimeoUrl), [vimeoUrl])
  const src = useMemo(() => {
    if (!vimeoId) return null
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      muted: '0',
      api: '1',
      loop: '0',
      title: '0',
      byline: '0',
      portrait: '0',
    })
    return `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}?${params.toString()}`
  }, [autoplay, vimeoId])

  if (!src) return <div className={className}>Invalid Vimeo URL</div>

  return (
    <div className={className}>
      <iframe
        src={src}
        className="aspect-video w-full rounded-xl border border-zinc-800 bg-zinc-950/10"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo player"
      />
    </div>
  )
}

