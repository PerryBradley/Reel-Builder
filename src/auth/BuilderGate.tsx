import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const SITE_LOGO_URL =
  "https://qbvrlqwzjrzlybusswhu.supabase.co/storage/v1/object/public/public-assets/FC%20PIXEL%20LOGO%20GREEN.png"

type BuilderGateProps = {
  children: React.ReactNode
}

export default function BuilderGate({ children }: BuilderGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showLogoFallback, setShowLogoFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session ?? null)
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signError) {
      setError(signError.message)
      return
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white p-4">
        <p className="text-sm text-zinc-600">Loading…</p>
      </div>
    )
  }

  if (session) return <>{children}</>

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white p-4">
      <form className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={onSignIn}>
        <div className="text-left">
          <img
            src={SITE_LOGO_URL}
            alt="Film Construction"
            className="mb-4 block max-h-12 object-contain"
            crossOrigin="anonymous"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
              setShowLogoFallback(true)
            }}
          />
          {showLogoFallback ? (
            <div className="mb-4 text-sm font-semibold text-zinc-900">Film Construction</div>
          ) : null}
          <h1
            className="!text-zinc-900 text-2xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: '#000000' }}
          >
            Reel Builder
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Sign in with your email and password to open the builder.</p>
        </div>

        <label className="mt-6 block text-left text-sm font-medium text-zinc-700" htmlFor="builder-email">
          Email
        </label>
        <input
          id="builder-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />

        <label className="mt-4 block text-left text-sm font-medium text-zinc-700" htmlFor="builder-password">
          Password
        </label>
        <input
          id="builder-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}
