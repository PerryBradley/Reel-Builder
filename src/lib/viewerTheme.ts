import type { BrandingBackground } from './brandingTypes'

/** Class bundles for public viewer UI (dark vs light page background). */
export type ViewerThemeClasses = {
  page: string
  reelTitle: string
  panel: string
  emptyState: string
  clipTitle: string
  clipMuted: string
  thumbShell: string
  /** Thumbnail image frame (border / shadow); keep player/thumb areas flat on light theme. */
  thumbFrame: string
  thumbBorder: string
  thumbBorderActive: string
  modalBackdrop: string
  modalClose: string
  invalidBox: string
  videoFrame: string
  navPrevNext: string
  navCounter: string
  playlistHeading: string
  playlistItemActive: string
  playlistItemIdle: string
  playlistPanelBorder: string
  /** Showcase: wrapper around featured player (margin/background only). */
  showcaseFeatureSection: string
  /** Showcase: thumbnail grid below player (spacing + layout). */
  showcaseThumbGrid: string
}

export function getViewerThemeClasses(bg: BrandingBackground): ViewerThemeClasses {
  if (bg === 'black') {
    return {
      page: 'min-h-dvh bg-zinc-950 text-zinc-100',
      reelTitle: 'text-zinc-400',
      panel: '',
      emptyState: 'text-zinc-400',
      clipTitle: 'text-zinc-100',
      clipMuted: 'text-zinc-500',
      thumbShell: 'bg-zinc-900/35',
      thumbFrame: 'relative overflow-hidden rounded-xl border shadow-sm',
      thumbBorder: 'border-zinc-800 hover:border-zinc-700',
      thumbBorderActive: 'border-purple-500',
      modalBackdrop: 'bg-black/80',
      modalClose: 'border-zinc-700 bg-black/60 text-white hover:bg-black/80',
      invalidBox: 'border-zinc-800 bg-zinc-950 text-zinc-400',
      videoFrame: 'overflow-hidden rounded-xl bg-transparent',
      navPrevNext:
        'rounded-lg border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800/80',
      navCounter: 'text-zinc-500',
      playlistHeading: 'text-zinc-500',
      playlistItemActive: 'border-purple-500 bg-purple-500/10',
      playlistItemIdle: 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50',
      playlistPanelBorder: 'border-zinc-800',
      showcaseFeatureSection: 'mt-6 mb-0 bg-transparent',
      showcaseThumbGrid: 'mt-4 grid grid-cols-2 gap-3 bg-transparent sm:grid-cols-3',
    }
  }
  return {
    page: 'min-h-dvh text-zinc-900',
    reelTitle: '!text-zinc-900',
    panel: '',
    emptyState: 'text-zinc-600',
    clipTitle: '!text-zinc-900',
    clipMuted: 'text-zinc-600',
    thumbShell: 'bg-transparent',
    thumbFrame: 'relative overflow-hidden rounded-xl border',
    thumbBorder: 'border-zinc-200 hover:border-zinc-300',
    thumbBorderActive: 'border-purple-600',
    modalBackdrop: 'bg-zinc-900/70',
    modalClose: 'border-zinc-300 bg-white/90 text-zinc-900 hover:bg-white',
    invalidBox: 'border-zinc-200 bg-zinc-100 text-zinc-600',
    videoFrame: 'overflow-hidden rounded-xl bg-transparent',
    navPrevNext:
      'rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white',
    navCounter: 'text-zinc-600',
    playlistHeading: 'text-zinc-600',
    playlistItemActive: 'border-purple-600 bg-purple-500/15',
    playlistItemIdle: 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
    playlistPanelBorder: 'border-zinc-200',
    showcaseFeatureSection: 'mt-6 mb-0 bg-transparent',
    showcaseThumbGrid: 'mt-0 grid grid-cols-2 gap-3 bg-transparent sm:grid-cols-3',
  }
}
