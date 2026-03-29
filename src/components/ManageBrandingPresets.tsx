import { useCallback, useEffect, useState } from 'react'
import type { BrandingBackground, BrandingFont, BrandingPreset } from '../lib/brandingTypes'
import { BRANDING_FONT_OPTIONS, BRANDING_FONT_STACKS } from '../lib/brandingTypes'
import {
  createBrandingPreset,
  deleteBrandingPreset,
  listBrandingPresets,
  setDefaultBrandingPreset,
  upsertBrandingPreset,
} from '../lib/brandingPresetsStore'

const emptyForm = {
  name: '',
  background: 'black' as BrandingBackground,
  logoLinkUrl: 'https://',
  fallbackText: '',
  fontFamily: 'Inter' as BrandingFont,
  isDefault: false,
}

const inputClass =
  'mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400'

const btnPrimary = 'rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95'
const btnSecondary =
  'rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50'
const btnDangerSm =
  'rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50'
const btnSecondarySm =
  'rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50'

const sectionCard = 'mb-6 rounded-xl border border-zinc-200 bg-white p-4'
const sectionHeading = 'text-base font-semibold text-zinc-900 mb-3'

export default function ManageBrandingPresets() {
  const [presets, setPresets] = useState<BrandingPreset[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const list = await listBrandingPresets()
    setPresets(list)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setLogoBase64(null)
    setFormError(null)
  }

  function startEdit(p: BrandingPreset) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      background: p.background,
      logoLinkUrl: p.logoLinkUrl,
      fallbackText: p.fallbackText,
      fontFamily: p.fontFamily,
      isDefault: p.isDefault,
    })
    setLogoBase64(p.logoBase64)
    setFormError(null)
  }

  async function handleLogoFile(file: File) {
    setFormError(null)
    if (!file.type.startsWith('image/')) {
      setFormError('Logo must be an image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Logo max size is 2MB.')
      return
    }
    const reader = new FileReader()
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onerror = () => reject(new Error('read failed'))
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })
    setLogoBase64(dataUrl)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const name = form.name.trim()
    if (!name) {
      setFormError('Preset name is required.')
      return
    }

    try {
      if (editingId) {
        const existing = presets.find((p) => p.id === editingId)
        if (!existing) return
        await upsertBrandingPreset({
          ...existing,
          name,
          background: form.background,
          logoBase64,
          logoLinkUrl: form.logoLinkUrl.trim(),
          fallbackText: form.fallbackText.trim(),
          fontFamily: form.fontFamily,
          isDefault: form.isDefault,
        })
      } else {
        await createBrandingPreset({
          name,
          background: form.background,
          logoBase64,
          logoLinkUrl: form.logoLinkUrl.trim(),
          fallbackText: form.fallbackText.trim(),
          fontFamily: form.fontFamily,
          isDefault: form.isDefault,
        })
      }
      await refresh()
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save preset.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this branding preset?')) return
    try {
      await deleteBrandingPreset(id)
      await refresh()
      if (editingId === id) resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete preset.')
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultBrandingPreset(id)
      await refresh()
      if (editingId === id) {
        setForm((f) => ({ ...f, isDefault: true }))
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update default.')
    }
  }

  return (
    <div>
      <div className={sectionCard}>
        <div className={sectionHeading}>Saved presets</div>

        {presets.length > 0 ? (
          <ul className="space-y-2">
            {presets.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900">
                    {p.name}
                    {p.isDefault ? (
                      <span className="ml-2 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-zinc-600">
                    {p.background} · {p.fontFamily}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!p.isDefault ? (
                    <button type="button" onClick={() => handleSetDefault(p.id)} className={btnSecondarySm}>
                      Set default
                    </button>
                  ) : null}
                  <button type="button" onClick={() => startEdit(p)} className={btnSecondarySm}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(p.id)} className={btnDangerSm}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">No presets yet. Create one below.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={`${sectionCard} space-y-4`}>
        <div className={sectionHeading}>{editingId ? 'Edit preset' : 'New preset'}</div>

        <div>
          <label className="block text-sm font-medium text-zinc-700" htmlFor="bp-name">
            Preset name
          </label>
          <input
            id="bp-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="e.g. Film Construction"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700">Background</span>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="radio"
                name="bp-bg"
                checked={form.background === 'black'}
                onChange={() => setForm((f) => ({ ...f, background: 'black' }))}
              />
              Black
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="radio"
                name="bp-bg"
                checked={form.background === 'white'}
                onChange={() => setForm((f) => ({ ...f, background: 'white' }))}
              />
              White
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Logo (optional)</label>
            <label className="mt-1 inline-block cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Upload image
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleLogoFile(file)
                  e.target.value = ''
                }}
              />
            </label>
            <p className="mt-1.5 text-xs leading-snug text-zinc-600">
              Accepted formats: PNG, JPG, SVG, WebP. Max size 2MB.
            </p>
            {logoBase64 ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <img
                  src={logoBase64}
                  alt="Logo preview"
                  className="max-h-[80px] w-auto max-w-[240px] object-contain object-left"
                />
                <button
                  type="button"
                  onClick={() => setLogoBase64(null)}
                  className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
                >
                  Remove logo
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="bp-fallback">
              Fallback text (no logo)
            </label>
            <input
              id="bp-fallback"
              value={form.fallbackText}
              onChange={(e) => setForm((f) => ({ ...f, fallbackText: e.target.value }))}
              className={inputClass}
              placeholder="Company name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700" htmlFor="bp-link">
            Logo link URL
          </label>
          <input
            id="bp-link"
            value={form.logoLinkUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoLinkUrl: e.target.value }))}
            className={inputClass}
            placeholder="https://example.com"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700">Font</span>
          <div
            className="mt-1 max-h-[220px] space-y-0.5 overflow-y-auto rounded-lg border border-zinc-300 bg-white p-1"
            role="listbox"
            aria-label="Font family"
          >
            {BRANDING_FONT_OPTIONS.map((font) => (
              <button
                key={font}
                type="button"
                role="option"
                aria-selected={form.fontFamily === font}
                onClick={() => setForm((f) => ({ ...f, fontFamily: font }))}
                className={[
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  form.fontFamily === font
                    ? 'bg-zinc-100 font-medium text-zinc-900 ring-2 ring-zinc-400'
                    : 'text-zinc-700 hover:bg-zinc-50',
                ].join(' ')}
                style={{ fontFamily: BRANDING_FONT_STACKS[font] }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          />
          Default preset (auto-applied to new reels)
        </label>

        {formError ? <div className="text-sm text-red-500">{formError}</div> : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className={btnPrimary}>
            {editingId ? 'Save changes' : 'Create preset'}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className={btnSecondary}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
