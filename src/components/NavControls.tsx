type NavControlsProps = {
  currentIndex: number
  totalClips: number
  onPrev: () => void
  onNext: () => void
  /** Override button/counter styles (e.g. public viewer light theme). */
  buttonClassName?: string
  counterClassName?: string
}

const defaultButtonClass =
  'rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800/80'

const defaultCounterClass = 'text-sm text-zinc-500'

export default function NavControls({
  currentIndex,
  totalClips,
  onPrev,
  onNext,
  buttonClassName = defaultButtonClass,
  counterClassName = defaultCounterClass,
}: NavControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-4">
      <button type="button" onClick={onPrev} disabled={currentIndex <= 0} className={buttonClassName}>
        Previous
      </button>
      <span className={counterClassName}>
        {currentIndex + 1} / {totalClips}
      </span>
      <button type="button" onClick={onNext} disabled={currentIndex >= totalClips - 1} className={buttonClassName}>
        Next
      </button>
    </div>
  )
}
