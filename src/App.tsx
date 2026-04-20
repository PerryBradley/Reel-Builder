import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BuilderGate from './auth/BuilderGate'
import { warmPageBackgroundStyle } from './lib/warmPageBackground'
import BuilderDashboard from './pages/BuilderDashboard'
import BuilderEditReel from './pages/BuilderEditReel'
import BuilderNewReel from './pages/BuilderNewReel'
import PublicReelViewer from './pages/PublicReelViewer'

function NotFound() {
  return (
    <div className="min-h-dvh text-zinc-900" style={warmPageBackgroundStyle}>
      <div className="mx-auto w-full max-w-5xl p-4">
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Page not found</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Check the URL and try again.</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/builder" replace />} />

        <Route
          path="/builder"
          element={
            <BuilderGate>
              <BuilderDashboard />
            </BuilderGate>
          }
        />
        <Route
          path="/builder/new"
          element={
            <BuilderGate>
              <BuilderNewReel />
            </BuilderGate>
          }
        />
        <Route
          path="/builder/:id"
          element={
            <BuilderGate>
              <BuilderEditReel />
            </BuilderGate>
          }
        />

        <Route path="/reel/:id" element={<PublicReelViewer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
