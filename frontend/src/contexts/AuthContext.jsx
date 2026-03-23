import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase.js'
import { useSocket } from './SocketContext.jsx'
import { SOCKET_EVENTS, STORAGE_KEYS } from '../lib/constants.js'

/**
 * @typedef {{ userId: string, name: string, email: string, role: 'admin'|'trainer'|'player' }} User
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { socket } = useSocket()

  const [user, setUser]                       = useState(null)
  const [isLoading, setIsLoading]             = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ── Restaurar sesión: Firebase mantiene la sesión entre recargas ──────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        try {
          const stored = sessionStorage.getItem(STORAGE_KEYS.USER)
          if (stored) {
            const parsed = JSON.parse(stored)
            // Verificar que el sessionStorage corresponde al usuario Firebase activo
            if (parsed?.userId && parsed?.email === firebaseUser.email && parsed?.role) {
              setUser(parsed)
              setIsAuthenticated(true)
              setIsLoading(false)
              return
            }
          }
        } catch {
          sessionStorage.removeItem(STORAGE_KEYS.USER)
        }
      }
      // Sin sesión válida → mostrar login
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // ── login con Google ──────────────────────────────────────────────────────
  const login = useCallback(() => {
    return new Promise((resolve, reject) => {
      signInWithPopup(auth, googleProvider)
        .then((result) => {
          const firebaseUser = result.user
          const email = firebaseUser.email?.toLowerCase() ?? ''
          const name  = firebaseUser.displayName || email.split('@')[0]

          // Validación extra en cliente: sólo @rappi.com
          if (!email.endsWith('@rappi.com')) {
            signOut(auth)
            reject(new Error('Solo puedes ingresar con un correo @rappi.com'))
            return
          }

          if (!socket) {
            signOut(auth)
            reject(new Error('Sin conexión al servidor.'))
            return
          }

          // Obtener rol del backend via socket (mismo flujo que antes)
          const timeout = setTimeout(() => {
            cleanup()
            signOut(auth)
            reject(new Error('Tiempo de espera agotado. Intenta de nuevo.'))
          }, 10000)

          function onSuccess(userData) {
            clearTimeout(timeout)
            cleanup()
            setUser(userData)
            setIsAuthenticated(true)
            sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
            resolve(userData)
          }

          function onError({ message }) {
            clearTimeout(timeout)
            cleanup()
            signOut(auth)
            reject(new Error(message || 'Error de autenticación.'))
          }

          function cleanup() {
            socket.off(SOCKET_EVENTS.AUTH_SUCCESS, onSuccess)
            socket.off(SOCKET_EVENTS.AUTH_ERROR, onError)
          }

          socket.once(SOCKET_EVENTS.AUTH_SUCCESS, onSuccess)
          socket.once(SOCKET_EVENTS.AUTH_ERROR, onError)
          socket.emit(SOCKET_EVENTS.AUTH_LOGIN, { name, email })
        })
        .catch((err) => {
          if (
            err.code === 'auth/popup-closed-by-user' ||
            err.code === 'auth/cancelled-popup-request'
          ) {
            reject(new Error('Inicio de sesión cancelado.'))
          } else {
            reject(new Error('Error al iniciar sesión con Google. Intenta de nuevo.'))
          }
        })
    })
  }, [socket])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    sessionStorage.removeItem(STORAGE_KEYS.USER)
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID)
    setUser(null)
    setIsAuthenticated(false)
    await signOut(auth)
  }, [])

  // ── updateUser ────────────────────────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para acceder al contexto de autenticación.
 * @returns {{ user: User|null, isLoading: boolean, isAuthenticated: boolean, login: Function, logout: Function, updateUser: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
