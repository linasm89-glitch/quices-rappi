import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SocketProvider } from './contexts/SocketContext.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { GameProvider } from './contexts/GameContext.jsx'
import LoginPage from './routes/LoginPage.jsx'
import AdminShell from './routes/AdminShell.jsx'
import TrainerShell from './routes/TrainerShell.jsx'
import PlayerShell from './routes/PlayerShell.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'
import PageTransition from './components/ui/PageTransition.jsx'
import Dashboard from './views/admin/Dashboard.jsx'
import SessionEditor from './views/admin/SessionEditor.jsx'
import SessionResults from './views/admin/SessionResults.jsx'

// ─── Protected Route Guards ────────────────────────────────────────────────

function RequireAuth({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate shell based on actual role
    if (user?.role === 'admin') return <Navigate to="/admin" replace />
    if (user?.role === 'trainer') return <Navigate to="/trainer" replace />
    return <Navigate to="/play" replace />
  }

  return children
}

// ─── App Routes ────────────────────────────────────────────────────────────

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route
          path="/"
          element={
            <PageTransition>
              {isAuthenticated ? (
                user?.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : user?.role === 'trainer' ? (
                  <Navigate to="/trainer" replace />
                ) : (
                  <Navigate to="/play" replace />
                )
              ) : (
                <LoginPage />
              )}
            </PageTransition>
          }
        />

        {/* Admin — role: admin only */}
        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <PageTransition>
                <AdminShell />
              </PageTransition>
            </RequireAuth>
          }
        >
          {/* /admin → Dashboard */}
          <Route index element={<Dashboard />} />
          {/* /admin/sessions/new → SessionEditor (create mode) */}
          <Route path="sessions/new" element={<SessionEditor />} />
          {/* /admin/sessions/:id/results → SessionResults */}
          <Route path="sessions/:id/results" element={<SessionResults />} />
          {/* /admin/sessions/:id → SessionEditor (edit mode) */}
          <Route path="sessions/:id" element={<SessionEditor />} />
        </Route>

        {/* Trainer — role: admin or trainer */}
        <Route
          path="/trainer/*"
          element={
            <RequireAuth allowedRoles={['admin', 'trainer']}>
              <PageTransition>
                <TrainerShell />
              </PageTransition>
            </RequireAuth>
          }
        />

        {/* Player — any authenticated user */}
        <Route
          path="/play/*"
          element={
            <RequireAuth>
              <PageTransition>
                <PlayerShell />
              </PageTransition>
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

// ─── Root App ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <GameProvider>
            <AppRoutes />
          </GameProvider>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  )
}
