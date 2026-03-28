type BrandHeaderProps = {
  logoDataUrl?: string
  logoHref?: string
  centered?: boolean
  largeLogo?: boolean
  /** Reel title shown centred below the logo on its own line (public viewer). */
  reelTitle?: string
}

export default function BrandHeader({ logoDataUrl, logoHref, centered, largeLogo, reelTitle }: BrandHeaderProps) {
  const logo = logoDataUrl ?? localStorage.getItem('filmConstructionGlobalLogo:v1')
  const logoSize = largeLogo ? 'h-[4.5rem] max-w-[495px]' : 'h-8 max-w-[220px]'
  const hasReelTitle = Boolean(reelTitle)

  if (hasReelTitle) {
    return (
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="flex flex-col items-center gap-3">
          {logo ? (
            <a
              href={logoHref ?? 'https://filmconstruction.com'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center"
              aria-label="Film Construction"
            >
              <img
                src={logo}
                alt="Film Construction"
                className={['w-auto object-contain', logoSize].join(' ')}
              />
            </a>
          ) : (
            <div className="text-lg font-semibold tracking-wide text-zinc-100">Film Construction</div>
          )}
          <h1 className="text-center text-[0.75rem] font-medium uppercase tracking-widest text-zinc-400">
            {reelTitle}
          </h1>
        </div>
      </header>
    )
  }

  return (
    <header
      className={[
        'flex items-center border-b border-zinc-800 px-6 py-5',
        centered ? 'justify-center' : '',
      ].join(' ')}
    >
      {logo ? (
        <a
          href={logoHref ?? 'https://filmconstruction.com'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center"
          aria-label="Film Construction"
        >
          <img
            src={logo}
            alt="Film Construction"
            className={['w-auto object-contain', logoSize].join(' ')}
          />
        </a>
      ) : (
        <div className="text-lg font-semibold tracking-wide text-zinc-100">Film Construction</div>
      )}
    </header>
  )
}

