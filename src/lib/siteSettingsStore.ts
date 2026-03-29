import { supabase } from './supabase'

export type SiteSettings = {
  companyName: string
  siteLogoDataUrl: string | null
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) {
    return { companyName: '', siteLogoDataUrl: null }
  }

  const { data, error } = await supabase.from('site_settings').select('*').eq('user_id', user.id).maybeSingle()

  if (error || !data) {
    return { companyName: '', siteLogoDataUrl: null }
  }

  return {
    companyName: typeof data.company_name === 'string' ? data.company_name : '',
    siteLogoDataUrl: typeof data.site_logo_data_url === 'string' && data.site_logo_data_url.length > 0 ? data.site_logo_data_url : null,
  }
}

export async function upsertSiteSettings(partial: { companyName?: string; siteLogoDataUrl?: string | null }): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return

  const { data: row } = await supabase.from('site_settings').select('*').eq('user_id', user.id).maybeSingle()

  const company_name = partial.companyName !== undefined ? partial.companyName : (row?.company_name as string) ?? ''
  const site_logo_data_url =
    partial.siteLogoDataUrl !== undefined ? partial.siteLogoDataUrl : (row?.site_logo_data_url as string | null) ?? null

  await supabase.from('site_settings').upsert(
    {
      user_id: user.id,
      company_name,
      site_logo_data_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
}

export async function clearSiteSettings(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return
  await supabase.from('site_settings').delete().eq('user_id', user.id)
}
