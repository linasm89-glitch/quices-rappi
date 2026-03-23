import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSocket } from '../contexts/SocketContext.jsx'
import RappiLogo from '../components/ui/RappiLogo.jsx'

// ─── Google Icon ─────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ─── Connection Badge ─────────────────────────────────────────────────────────

function ConnectionBadge({ connected }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        ${connected
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
        }
      `}
    >
      {connected
        ? <><Wifi size={11} /> En línea</>
        : <><WifiOff size={11} /> Conectando…</>
      }
    </motion.div>
  )
}

// ─── LoginPage ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate      = useNavigate()
  const { login }     = useAuth()
  const { connected } = useSocket()

  const [error, setError]         = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError('')

    if (!connected) {
      setError('Sin conexión al servidor. Verifica tu internet e intenta de nuevo.')
      return
    }

    setIsLoading(true)
    try {
      const user = await login()

      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'trainer') {
        navigate('/trainer', { replace: true })
      } else {
        navigate('/play', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Error al ingresar. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5"
          style={{ background: '#FF441F' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-5"
          style={{ background: '#FF441F' }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 px-6 pt-safe-top pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RappiLogo size={32} />
          <span className="font-extrabold text-gray-900 text-base tracking-tight">Rappi</span>
        </div>
        <ConnectionBadge connected={connected} />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8">

        {/* Hero heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <img
              src="/logo%20Rappi.png"
              alt="Rappi"
              className="h-16 w-auto object-contain"
              draggable={false}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            The Training Hour
          </h1>
          <p className="mt-2 text-gray-500 text-sm font-medium">
            Quiz en tiempo real para el equipo
          </p>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-card-lg border border-gray-100 p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Únete a la sesión</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa con tu cuenta corporativa de Google
            </p>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium leading-snug">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In button */}
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || !connected}
              whileHover={!isLoading && connected ? { scale: 1.015 } : {}}
              whileTap={!isLoading && connected ? { scale: 0.975 } : {}}
              className={`
                w-full flex items-center justify-center gap-3
                bg-white border-2 border-gray-200 rounded-xl
                py-3.5 px-6 text-gray-700 font-semibold text-base
                transition-all duration-200
                hover:border-gray-300 hover:shadow-md
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none
              `}
            >
              {isLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
                    className="inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                  <span>Verificando…</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Entrar con Google</span>
                </>
              )}
            </motion.button>

            <p className="mt-4 text-center text-xs text-gray-400">
              Sólo cuentas <span className="font-semibold">@rappi.com</span>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="relative z-10 pb-safe-bottom pb-6 px-6 text-center"
      >
        <p className="text-xs text-gray-400 font-medium">
          Solo para el equipo Rappi · Uso interno
        </p>
      </motion.footer>
    </div>
  )
}
