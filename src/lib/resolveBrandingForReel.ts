import type { BrandingBackground, BrandingFont } from './brandingTypes'
import { BRANDING_FONT_STACKS } from './brandingTypes'
import { getBrandingPreset, getDefaultBrandingPresetId } from './brandingPresetsStore'
import type { Reel } from './reelTypes'

export type ResolvedViewerBranding = {
  background: BrandingBackground
  logoDataUrl: string | null
  logoLinkUrl: string
  fallbackText: string
  fontFamily: BrandingFont
  fontStack: string
}

export const FALLBACK_VIEWER_BRANDING: ResolvedViewerBranding = {
  background: 'black',
  logoDataUrl: null,
  logoLinkUrl: 'https://filmconstruction.com',
  fallbackText: 'Film Construction',
  fontFamily: 'Inter',
  fontStack: BRANDING_FONT_STACKS.Inter,
}

export function resolveBrandingForReel(reel: Reel): ResolvedViewerBranding {
  const idFromReel =
    typeof reel.brandingPresetId === 'string' && reel.brandingPresetId.length > 0 ? reel.brandingPresetId : undefined
  const presetId = idFromReel ?? getDefaultBrandingPresetId()
  if (!presetId) {
    return FALLBACK_VIEWER_BRANDING
  }
  const preset = getBrandingPreset(presetId)
  if (!preset) {
    return FALLBACK_VIEWER_BRANDING
  }
  return {
    background: preset.background,
    logoDataUrl: preset.logoBase64,
    logoLinkUrl: preset.logoLinkUrl || FALLBACK_VIEWER_BRANDING.logoLinkUrl,
    fallbackText: preset.fallbackText || FALLBACK_VIEWER_BRANDING.fallbackText,
    fontFamily: preset.fontFamily,
    fontStack: BRANDING_FONT_STACKS[preset.fontFamily],
  }
}

export function getFallbackViewerBranding(): ResolvedViewerBranding {
  return FALLBACK_VIEWER_BRANDING
}
