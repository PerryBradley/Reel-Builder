import type { BrandingBackground, BrandingFont, BrandingPreset, BrandingPresetId } from './brandingTypes'
import { BRANDING_FONT_OPTIONS } from './brandingTypes'
import { supabase } from './supabase'

function isBrandingFont(s: string): s is BrandingFont {
  return (BRANDING_FONT_OPTIONS as readonly string[]).includes(s)
}

function rowToPreset(row: Record<string, unknown>): BrandingPreset | null {
  const id = typeof row.id === 'string' ? row.id : null
  const name = typeof row.name === 'string' ? row.name : null
  const background = row.background === 'white' || row.background === 'black' ? row.background : null
  const logoRaw = row.logo_data_url
  const logoBase64 =
    logoRaw === null || logoRaw === undefined
      ? null
      : typeof logoRaw === 'string' && logoRaw.length > 0
        ? logoRaw
        : null
  const logoLinkUrl = typeof row.logo_link_url === 'string' ? row.logo_link_url : ''
  const fallbackText = typeof row.fallback_text === 'string' ? row.fallback_text : ''
  const fontRaw = typeof row.font === 'string' ? row.font : 'Inter'
  const fontFamily: BrandingFont = isBrandingFont(fontRaw) ? fontRaw : 'Inter'
  const isDefault = row.is_default === true

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

async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not authenticated')
  return data.user
}

export async function listPresets(): Promise<BrandingPreset[]> {
  const user = await requireUser()
  const { data, error } = await supabase
    .from('branding_presets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map((r) => rowToPreset(r as Record<string, unknown>)).filter((p): p is BrandingPreset => p !== null)
}

/** @deprecated Use listPresets — kept for existing imports */
export const listBrandingPresets = listPresets

export async function getBrandingPreset(id: BrandingPresetId): Promise<BrandingPreset | null> {
  const { data, error } = await supabase.from('branding_presets').select('*').eq('id', id).maybeSingle()

  if (error || !data) return null
  return rowToPreset(data as Record<string, unknown>)
}

export async function getDefaultBrandingPresetId(): Promise<BrandingPresetId | undefined> {
  const presets = await listPresets()
  const def = presets.find((p) => p.isDefault)
  return def?.id
}

export async function savePreset(preset: BrandingPreset): Promise<void> {
  await upsertBrandingPreset(preset)
}

export async function upsertBrandingPreset(preset: BrandingPreset): Promise<void> {
  const user = await requireUser()

  if (preset.isDefault) {
    await supabase.from('branding_presets').update({ is_default: false }).eq('user_id', user.id)
  }

  const { error } = await supabase.from('branding_presets').upsert(
    {
      id: preset.id,
      user_id: user.id,
      name: preset.name,
      background: preset.background,
      logo_data_url: preset.logoBase64,
      logo_link_url: preset.logoLinkUrl,
      fallback_text: preset.fallbackText,
      font: preset.fontFamily,
      is_default: preset.isDefault,
    },
    { onConflict: 'id' },
  )

  if (error) throw error

  const all = await listPresets()
  if (all.length > 0 && !all.some((p) => p.isDefault)) {
    await supabase.from('branding_presets').update({ is_default: true }).eq('id', all[0]!.id).eq('user_id', user.id)
  }
}

export async function createBrandingPreset(input: {
  name: string
  background: BrandingBackground
  logoBase64: string | null
  logoLinkUrl: string
  fallbackText: string
  fontFamily: BrandingFont
  isDefault?: boolean
}): Promise<BrandingPreset> {
  const user = await requireUser()
  const all = await listPresets()
  let isDefault = input.isDefault === true
  if (!isDefault && all.length === 0) {
    isDefault = true
  }

  if (isDefault) {
    await supabase.from('branding_presets').update({ is_default: false }).eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('branding_presets')
    .insert({
      user_id: user.id,
      name: input.name,
      background: input.background,
      logo_data_url: input.logoBase64,
      logo_link_url: input.logoLinkUrl,
      fallback_text: input.fallbackText,
      font: input.fontFamily,
      is_default: isDefault,
    })
    .select('*')
    .single()

  if (error || !data) throw error ?? new Error('Failed to create preset')

  const preset = rowToPreset(data as Record<string, unknown>)
  if (!preset) throw new Error('Invalid preset row')

  const nextAll = await listPresets()
  if (nextAll.length > 0 && !nextAll.some((p) => p.isDefault)) {
    await supabase.from('branding_presets').update({ is_default: true }).eq('id', nextAll[0]!.id).eq('user_id', user.id)
    return { ...preset, isDefault: true }
  }

  return preset
}

export async function deletePreset(id: BrandingPresetId): Promise<void> {
  await deleteBrandingPreset(id)
}

export async function deleteBrandingPreset(id: BrandingPresetId): Promise<void> {
  const user = await requireUser()
  await supabase.from('branding_presets').delete().eq('id', id).eq('user_id', user.id)

  const all = await listPresets()
  if (all.length > 0 && !all.some((p) => p.isDefault)) {
    await supabase.from('branding_presets').update({ is_default: true }).eq('id', all[0]!.id).eq('user_id', user.id)
  }
}

export async function setDefaultBrandingPreset(id: BrandingPresetId): Promise<void> {
  const user = await requireUser()
  await supabase.from('branding_presets').update({ is_default: false }).eq('user_id', user.id)
  await supabase.from('branding_presets').update({ is_default: true }).eq('id', id).eq('user_id', user.id)
}
