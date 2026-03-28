import { useState } from 'react'
import { Link } from 'react-router-dom'
import ManageBrandingPresets from '../components/ManageBrandingPresets'
import { deleteReel, listReels, removeGlobalLogoDataUrl } from '../lib/reelStore'

const SITE_LOGO_KEY = 'filmConstruction:siteLogo'
const COMPANY_NAME_KEY = 'filmConstruction:companyName'

function formatIsoDateTime(iso: string | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BuilderDashboardLogo({ companyName }: { companyName: string }) {
  const logo = typeof localStorage !== 'undefined' ? localStorage.getItem(SITE_LOGO_KEY) : null
  const logoHref = 'https://filmconstruction.com'
  const name = companyName.trim()

  if (!logo && !name) return null

  return (
    <div className="inline-flex items-center">
      {logo ? (
        <a
          href={logoHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center"
          aria-label="Film Construction"
        >
          <img src={logo} alt="" className="h-8 w-auto max-w-[220px] object-contain" />
        </a>
      ) : null}
      {name ? <span className={`text-sm font-semibold text-zinc-900${logo ? ' ml-2' : ''}`}>{name}</span> : null}
    </div>
  )
}

export default function BuilderDashboard() {
  const [reels, setReels] = useState(() => listReels())
  const [siteLogoTick, setSiteLogoTick] = useState(0)
  const [companyName, setCompanyName] = useState(() => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(COMPANY_NAME_KEY) ?? ''
  })

  const siteLogoPreview =
    typeof localStorage !== 'undefined' ? localStorage.getItem(SITE_LOGO_KEY) : null

  function clearAllData() {
    const ok = window.confirm('Clear all saved reels and view analytics from this browser?')
    if (!ok) return
    localStorage.removeItem('filmConstructionReels:v1')
    localStorage.removeItem(SITE_LOGO_KEY)
    removeGlobalLogoDataUrl()
    window.location.reload()
  }

  function handleDeleteReel(id: string) {
    const ok = window.confirm('Are you sure you want to delete this reel? This cannot be undone.')
    if (!ok) return
    deleteReel(id)
    setReels((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleSiteLogoFile(file: File) {
    const reader = new FileReader()
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('read failed'))
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })
    localStorage.setItem(SITE_LOGO_KEY, dataUrl)
    setSiteLogoTick((t) => t + 1)
  }

  function removeSiteLogo() {
    localStorage.removeItem(SITE_LOGO_KEY)
    setSiteLogoTick((t) => t + 1)
  }

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center px-6 py-4">
          <BuilderDashboardLogo companyName={companyName} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="!text-zinc-900 mt-1 text-4xl font-semibold" style={{ color: '#000000' }}>
          Reel Builder
        </h1>
        <div className="mt-2 flex w-full flex-col items-end">
          <Link
            to="/builder/new"
            className="ml-auto inline-flex items-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            + Create a new reel
          </Link>
          <p className="mt-3 ml-auto block text-right text-sm text-zinc-500">
            Create a reel, share the link and your client gets a beautiful viewer.
          </p>
        </div>

        <details className="group mt-10 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-zinc-400 transition-transform group-open:rotate-90">›</span>
              Your Branding Presets
            </span>
          </summary>
          <div className="border-t border-zinc-200 px-4 pb-4 pt-3">
            <p className="text-sm text-zinc-600">
              Presets control the look of your public viewer — logo, colours, and fonts.
            </p>
            <div className="mt-4">
              <ManageBrandingPresets />
            </div>
          </div>
        </details>
        <p className="mt-2 mb-6 text-sm text-zinc-500">
          Set up your logo, colours and fonts once — then apply them to any reel in seconds.
        </p>

        <details className="group mt-10 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-zinc-400 transition-transform group-open:rotate-90">›</span>
              Your Reels Library
            </span>
          </summary>
          <div className="border-t border-zinc-200 px-4 pb-4 pt-3">
            {reels.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No reels yet! Hit &apos;Create new reel&apos; to get started. 🎬
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reels.map((reel) => {
                  const viewCount = reel.views.length
                  const last = reel.views[reel.views.length - 1]
                  const lastViewedAt = formatIsoDateTime(last?.timestamp)

                  return (
                    <div
                      key={reel.id}
                      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-semibold text-zinc-900">{reel.name}</div>
                          <div className="mt-1 text-sm text-zinc-600">
                            {viewCount} view{viewCount === 1 ? '' : 's'}
                            {last ? ` · Last viewed in ${last.city}, ${last.country}${lastViewedAt ? ` @ ${lastViewedAt}` : ''}` : null}
                          </div>
                          <div className="mt-2 text-sm font-medium text-zinc-600">
                            Template: {reel.template}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Link
                            to={`/builder/${encodeURIComponent(reel.id)}`}
                            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteReel(reel.id)}
                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </details>
        <p className="mt-2 mb-6 text-sm text-zinc-500">
          All your reels in one place. Click any reel to edit, or copy its link to share with a client.
        </p>

        <details className="group mt-10 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-zinc-400 transition-transform group-open:rotate-90">›</span>
              Settings
            </span>
          </summary>
          <div className="border-t border-zinc-200 space-y-8 px-4 pb-4 pt-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-900" htmlFor="builder-company-name">
                Company Name
              </label>
              <p className="mt-1 text-sm text-zinc-600">
                Shown in the builder header alongside your logo.
              </p>
              <input
                id="builder-company-name"
                type="text"
                placeholder="e.g. Film Construction"
                value={companyName}
                onChange={(e) => {
                  const v = e.target.value
                  setCompanyName(v)
                  localStorage.setItem(COMPANY_NAME_KEY, v)
                }}
                className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-zinc-900">Builder Logo</div>
              <p className="mt-1 text-sm text-zinc-600">
                This logo appears in your builder header. It&apos;s separate from logos on your client reels.
              </p>
              <label className="mt-3 inline-block cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Choose image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleSiteLogoFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
              {siteLogoPreview ? (
                <div key={siteLogoTick} className="mt-3 flex flex-wrap items-center gap-3">
                  <img
                    src={siteLogoPreview}
                    alt=""
                    className="max-h-12 w-auto max-w-[200px] object-contain object-left"
                  />
                  <button
                    type="button"
                    onClick={removeSiteLogo}
                    className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </details>
        <p className="mt-2 mb-6 text-sm text-zinc-500">
          Your builder preferences — logo, company name and password all in one place.
        </p>

        <div className="mt-12 border-t border-zinc-200 pt-8 text-center">
          <button
            type="button"
            onClick={clearAllData}
            className="text-sm text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
          >
            Clear all saved data
          </button>
        </div>
      </div>
    </div>
  )
}
