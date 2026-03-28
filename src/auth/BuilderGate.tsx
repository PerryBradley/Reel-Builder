import { useEffect, useState } from 'react'

const PASSWORD_KEY = 'filmConstructionBuilderPassword'
const AUTH_KEY = 'filmConstructionBuilderAuthed'

type BuilderGateProps = {
  children: React.ReactNode
}

declare global {
  interface Window {
    resetPassword?: () => void
  }
}

export default function BuilderGate({ children }: BuilderGateProps) {
  const [storedPassword, setStoredPassword] = useState<string | null>(() => {
    if (typeof localStorage === 'undefined') return null
    const value = localStorage.getItem(PASSWORD_KEY)
    return value && value.length > 0 ? value : null
  })
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showForgotHelp, setShowForgotHelp] = useState(false)
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof sessionStorage === 'undefined') return false
    return sessionStorage.getItem(AUTH_KEY) === '1'
  })

  useEffect(() => {
    window.resetPassword = () => {
      localStorage.removeItem(PASSWORD_KEY)
      sessionStorage.removeItem(AUTH_KEY)
      window.location.reload()
    }
    return () => {
      delete window.resetPassword
    }
  }, [])

  function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!storedPassword || password !== storedPassword) {
      setError('Incorrect password.')
      return
    }

    sessionStorage.setItem(AUTH_KEY, '1')
    setAuthed(true)
  }

  function onSetupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const next = newPassword.trim()
    if (!next) {
      setError('Password is required.')
      return
    }
    if (next.length < 4) {
      setError('Use at least 4 characters.')
      return
    }
    if (next !== confirmPassword.trim()) {
      setError('Passwords do not match.')
      return
    }

    localStorage.setItem(PASSWORD_KEY, next)
    sessionStorage.setItem(AUTH_KEY, '1')
    setStoredPassword(next)
    setAuthed(true)
  }

  if (authed) return <>{children}</>

  const siteLogo =
    typeof localStorage !== 'undefined' ? localStorage.getItem('filmConstruction:siteLogo') : null

  const isFirstRun = !storedPassword

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white p-4">
      <form
        onSubmit={isFirstRun ? onSetupSubmit : onLoginSubmit}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="text-left">
          {siteLogo ? (
            <img src={siteLogo} alt="" className="mx-auto mb-4 block max-h-12 object-contain" />
          ) : null}
          <h1
            className="!text-zinc-900 text-2xl font-black"
            style={{ fontFamily: "'Montserrat', sans-serif", color: '#000000' }}
          >
            Reel Builder
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {isFirstRun ? "Let's set a password to protect your builder." : 'Welcome back. Enter your password to continue.'}
          </p>
        </div>

        {isFirstRun ? (
          <>
            <label className="mt-6 block text-left text-sm font-medium text-zinc-700" htmlFor="builder-new-password">
              Choose a password
            </label>
            <input
              id="builder-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />

            <label className="mt-4 block text-left text-sm font-medium text-zinc-700" htmlFor="builder-confirm-password">
              Confirm your password
            </label>
            <input
              id="builder-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </>
        ) : (
          <>
            <label className="mt-6 block text-left text-sm font-medium text-zinc-700" htmlFor="builder-password">
              Your password
            </label>
            <input
              id="builder-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setShowForgotHelp((v) => !v)}
              className="mt-2 text-left text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Forgot your password?
            </button>
            {showForgotHelp ? (
              <p className="mt-2 text-sm text-zinc-600">
                No worries — open the browser console and type{' '}
                <code className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-zinc-800">resetPassword()</code> to start fresh.
              </p>
            ) : null}
          </>
        )}

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
        >
          {isFirstRun ? 'Get started →' : 'Enter the builder →'}
        </button>
      </form>
    </div>
  )
}
