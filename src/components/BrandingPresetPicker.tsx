import { useEffect, useState } from 'react'
import { listBrandingPresets } from '../lib/brandingPresetsStore'
import type { BrandingPreset } from '../lib/brandingTypes'

type BrandingPresetPickerProps = {
  value: string | undefined
  onChange: (presetId: string | undefined) => void
  id?: string
}

export default function BrandingPresetPicker({ value, onChange, id }: BrandingPresetPickerProps) {
  const [presets, setPresets] = useState<BrandingPreset[]>([])

  useEffect(() => {
    let cancelled = false
    void listBrandingPresets().then((list) => {
      if (!cancelled) setPresets(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700" htmlFor={id ?? 'branding-preset'}>
        Branding
      </label>
      <p className="mt-0.5 text-xs text-zinc-600">Preset applied on the public viewer (manage presets on the dashboard).</p>
      <select
        id={id ?? 'branding-preset'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {presets.length === 0 ? (
          <option value="">No presets — viewer uses built-in fallback</option>
        ) : (
          <>
            <option value="">Use default preset{!presets.some((p) => p.isDefault) ? ' (none set)' : ''}</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )
}
