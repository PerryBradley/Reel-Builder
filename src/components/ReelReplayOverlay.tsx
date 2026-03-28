type ReelReplayOverlayProps = {
  visible: boolean
  onReplay: () => void
}

export default function ReelReplayOverlay({ visible, onReplay }: ReelReplayOverlayProps) {
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onReplay}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/75 text-white transition-colors hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      aria-label="Replay from first clip"
    >
      <div
        className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/90 bg-white/10 shadow-lg backdrop-blur-sm"
        aria-hidden
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="ml-1 h-14 w-14"
        >
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        </svg>
      </div>
      <span className="text-lg font-medium tracking-wide">Replay</span>
    </button>
  )
}
