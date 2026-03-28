import type { BrandingBackground, BrandingFont, BrandingPreset, BrandingPresetId } from './brandingTypes'
import { BRANDING_FONT_OPTIONS } from './brandingTypes'

const STORAGE_KEY = 'filmConstructionBrandingPresets:v1'

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function isBrandingFont(s: string): s is BrandingFont {
  return (BRANDING_FONT_OPTIONS as readonly string[]).includes(s)
}

function normalizePreset(raw: unknown): BrandingPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : null
  const name = typeof o.name === 'string' ? o.name : null
  const background = o.background === 'white' || o.background === 'black' ? o.background : null
  const logoRaw = o.logoBase64
  const logoBase64 =
    logoRaw === null || logoRaw === undefined
      ? null
      : typeof logoRaw === 'string' && logoRaw.length > 0
        ? logoRaw
        : null
  const logoLinkUrl = typeof o.logoLinkUrl === 'string' ? o.logoLinkUrl : ''
  const fallbackText = typeof o.fallbackText === 'string' ? o.fallbackText : ''
  const fontFamily = typeof o.fontFamily === 'string' && isBrandingFont(o.fontFamily) ? o.fontFamily : 'Inter'
  const isDefault = o.isDefault === true

  if (!id || !name || !background) return null

  return {
    id,
    name,
    background,
    logoBase64,
    logoLinkUrl,
    fallbackText,
    fontFamily,
    isDefault,
  }
}

function readAll(): BrandingPreset[] {
  if (typeof localStorage === 'undefined') return []
  const parsed = safeParseJson<unknown>(localStorage.getItem(STORAGE_KEY))
  if (!parsed || !Array.isArray(parsed)) return []
  return parsed.map((p) => normalizePreset(p)).filter((p): p is BrandingPreset => p !== null)
}

function writeAll(presets: BrandingPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch (e) {
    console.error('[brandingPresets] Failed to save presets (quota or private mode?)', e)
    throw e
  }
}

export function listBrandingPresets(): BrandingPreset[] {
  return readAll()
}

export function getBrandingPreset(id: BrandingPresetId): BrandingPreset | null {
  return readAll().find((p) => p.id === id) ?? null
}

export function getDefaultBrandingPresetId(): BrandingPresetId | undefined {
  const def = readAll().find((p) => p.isDefault)
  return def?.id
}

function createPresetId(): BrandingPresetId {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `preset_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function upsertBrandingPreset(preset: BrandingPreset) {
  const all = readAll()
  const idx = all.findIndex((p) => p.id === preset.id)
  let next = [...all]
  if (preset.isDefault) {
    next = next.map((p) => ({ ...p, isDefault: false }))
  }
  if (idx === -1) {
    next.push(preset)
  } else {
    next[idx] = preset
  }
  if (next.length > 0 && !next.some((p) => p.isDefault)) {
    next = next.map((p, i) => ({ ...p, isDefault: i === 0 }))
  }
  writeAll(next)
}

export function createBrandingPreset(input: {
  name: string
  background: BrandingBackground
  logoBase64: string | null
  logoLinkUrl: string
  fallbackText: string
  fontFamily: BrandingFont
  isDefault?: boolean
}): BrandingPreset {
  const all = readAll()
  let isDefault = input.isDefault === true
  if (!isDefault && all.length === 0) {
    isDefault = true
  }
  const preset: BrandingPreset = {
    id: createPresetId(),
    name: input.name,
    background: input.background,
    logoBase64: input.logoBase64,
    logoLinkUrl: input.logoLinkUrl,
    fallbackText: input.fallbackText,
    fontFamily: input.fontFamily,
    isDefault,
  }
  upsertBrandingPreset(preset)
  return preset
}

export function deleteBrandingPreset(id: BrandingPresetId) {
  const all = readAll().filter((p) => p.id !== id)
  if (all.length > 0 && !all.some((p) => p.isDefault)) {
    all[0] = { ...all[0]!, isDefault: true }
  }
  writeAll(all)
}

export function setDefaultBrandingPreset(id: BrandingPresetId) {
  const all = readAll().map((p) => ({ ...p, isDefault: p.id === id }))
  writeAll(all)
}
