import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, ArrowRight, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSocket } from '../contexts/SocketContext.jsx'
import { validateName, validateRappiEmail } from '../lib/validators.js'
import RappiLogo from '../components/ui/RappiLogo.jsx'

// ─── Sub-components ────────────────────────────────────────────────────────

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

function InputField({ id, label, type = 'text', value, onChange, placeholder, error, icon: Icon, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={17} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={type === 'email' ? 'email' : 'name'}
          inputMode={type === 'email' ? 'email' : 'text'}
          className={`
            w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400
            transition-all duration-150 outline-none
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-400 ring-2 ring-red-100 focus:ring-red-200'
              : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          `}
        />
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 text-xs text-red-600 font-medium overflow-hidden"
          >
            <AlertCircle size={12} className="flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── LoginPage ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate    = useNavigate()
  const { login }   = useAuth()
  const { connected } = useSocket()

  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [nameError,  setNameError]  = useState('')
  const [emailError, setEmailError] = useState('')
  const [serverError, setServerError] = useState('')
  const [isLoading,  setIsLoading]  = useState(false)

  const clearErrors = () => {
    setNameError('')
    setEmailError('')
    setServerError('')
  }

  const handleNameChange = (e) => {
    setName(e.target.value)
    if (nameError) setNameError('')
    if (serverError) setServerError('')
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (emailError) setEmailError('')
    if (serverError) setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearErrors()

    // Client-side validation
    const nameValidation  = validateName(name)
    const emailValidation = validateRappiEmail(email)

    let hasError = false
    if (!nameValidation.valid) {
      setNameError(nameValidation.error)
      hasError = true
    }
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error)
      hasError = true
    }
    if (hasError) return

    if (!connected) {
      setServerError('Sin conexión al servidor. Verifica tu internet e intenta de nuevo.')
      return
    }

    setIsLoading(true)

    try {
      const user = await login(name.trim(), email.trim().toLowerCase())

      // Navigate based on role
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'trainer') {
        navigate('/trainer', { replace: true })
      } else {
        navigate('/play', { replace: true })
      }
    } catch (err) {
      setServerError(err.message || 'Error al ingresar. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
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
          <span className="font-extrabold text-gray-900 text-base tracking-tight">
            Rappi
          </span>
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
              Ingresa tus datos para participar
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <InputField
                id="name"
                label="Nombre completo"
                value={name}
                onChange={handleNameChange}
                placeholder="Ej: María García"
                error={nameError}
                icon={User}
                disabled={isLoading}
              />

              <InputField
                id="email"
                label="Correo corporativo"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="nombre@rappi.com"
                error={emailError}
                icon={Mail}
                disabled={isLoading}
              />

              {/* Server error */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium leading-snug">{serverError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading || !connected}
                whileHover={!isLoading ? { scale: 1.015 } : {}}
                whileTap={!isLoading ? { scale: 0.975 } : {}}
                className={`
                  relative w-full flex items-center justify-center gap-2.5
                  py-3.5 px-6 rounded-xl text-white font-bold text-base
                  transition-all duration-200 shadow-orange
                  ${isLoading || !connected
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-lg active:shadow-md'
                  }
                `}
                style={{
                  background: isLoading || !connected
                    ? '#FF441F'
                    : 'linear-gradient(135deg, #FF441F 0%, #FF6E4D 100%)',
                }}
              >
                {isLoading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
                      className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Ingresando…</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </>
                )}
              </motion.button>
            </form>
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
