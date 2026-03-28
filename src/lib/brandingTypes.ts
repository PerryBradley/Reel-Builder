export type BrandingBackground = 'black' | 'white'

export const BRANDING_FONT_OPTIONS = [
  'Inter',
  'Helvetica Neue',
  'Georgia',
  'Playfair Display',
  'Montserrat',
  'Raleway',
] as const

export type BrandingFont = (typeof BRANDING_FONT_OPTIONS)[number]

export type BrandingPresetId = string

export interface BrandingPreset {
  id: BrandingPresetId
  name: string
  background: BrandingBackground
  /** data URL or null if none */
  logoBase64: string | null
  logoLinkUrl: string
  fallbackText: string
  fontFamily: BrandingFont
  isDefault: boolean
}

/** CSS font-family stacks for viewer + builder preview of font choice */
export const BRANDING_FONT_STACKS: Record<BrandingFont, string> = {
  Inter: '"Inter", system-ui, -apple-system, sans-serif',
  'Helvetica Neue': '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  'Playfair Display': '"Playfair Display", Georgia, serif',
  Montserrat: '"Montserrat", system-ui, sans-serif',
  Raleway: '"Raleway", system-ui, sans-serif',
}
