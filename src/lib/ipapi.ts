export type IpLocation = {
  city: string
  country: string
}

export async function fetchIpLocation(): Promise<IpLocation> {
  // Primary: freeipapi.com tends to allow browser CORS from localhost.
  try {
    const res = await fetch('https://freeipapi.com/api/json')
    if (!res.ok) throw new Error(`freeipapi.com failed (${res.status})`)
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object') throw new Error('freeipapi.com returned unexpected data')
    const obj = data as Record<string, unknown>
    const city =
      typeof obj.cityName === 'string'
        ? obj.cityName
        : typeof obj.city === 'string'
          ? obj.city
          : 'Unknown'
    const country =
      typeof obj.countryName === 'string'
        ? obj.countryName
        : typeof obj.country_name === 'string'
          ? obj.country_name
          : typeof obj.country === 'string'
            ? obj.country
            : 'Unknown'
    return { city, country }
  } catch {
    // Fallback: ipapi.co (may fail CORS on some localhost setups).
    const res = await fetch('https://ipapi.co/json/')
    if (!res.ok) {
      throw new Error(`ipapi.co failed (${res.status})`)
    }

    const data: unknown = await res.json()
    if (!data || typeof data !== 'object') {
      throw new Error('ipapi.co returned unexpected data')
    }

    const obj = data as Record<string, unknown>
    const city = typeof obj.city === 'string' ? obj.city : 'Unknown'
    const country = typeof obj.country_name === 'string' ? obj.country_name : 'Unknown'

    return { city, country }
  }
}

