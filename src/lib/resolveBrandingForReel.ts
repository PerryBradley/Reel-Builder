import type { BrandingBackground, BrandingFont, BrandingPreset } from './brandingTypes'
import { BRANDING_FONT_STACKS } from './brandingTypes'
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

/**
 * @param brandingPreset — preset loaded for this reel (e.g. public fetch by reel.brandingPresetId), or null if none / not found.
 */
export function resolveBrandingForReel(reel: Reel, brandingPreset: BrandingPreset | null): ResolvedViewerBranding {
  const idFromReel =
    typeof reel.brandingPresetId === 'string' && reel.brandingPresetId.length > 0 ? reel.brandingPresetId : undefined
  if (!idFromReel) {
    return FALLBACK_VIEWER_BRANDING
  }
  if (!brandingPreset) {
    return FALLBACK_VIEWER_BRANDING
  }
  return {
    background: brandingPreset.background,
    logoDataUrl: brandingPreset.logoBase64,
    logoLinkUrl: brandingPreset.logoLinkUrl || FALLBACK_VIEWER_BRANDING.logoLinkUrl,
    fallbackText: brandingPreset.fallbackText || FALLBACK_VIEWER_BRANDING.fallbackText,
    fontFamily: brandingPreset.fontFamily,
    fontStack: BRANDING_FONT_STACKS[brandingPreset.fontFamily],
  }
}

export function getFallbackViewerBranding(): ResolvedViewerBranding {
  return FALLBACK_VIEWER_BRANDING
}
