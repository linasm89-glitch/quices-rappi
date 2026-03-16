import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useSocket } from './SocketContext.jsx'
import { SOCKET_EVENTS, STORAGE_KEYS } from '../lib/constants.js'

/**
 * @typedef {{ userId: string, name: string, email: string, role: 'admin'|'trainer'|'player' }} User
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { socket } = useSocket()

  const [user, setUser]              = useState(null)
  const [isLoading, setIsLoading]    = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ── Restore from sessionStorage on mount ─────────────────────────────
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.USER)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.userId && parsed?.email && parsed?.role) {
          setUser(parsed)
          setIsAuthenticated(true)
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.USER)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── login ─────────────────────────────────────────────────────────────
  const login = useCallback(
    (name, email) => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Sin conexión al servidor.'))
          return
        }

        const timeout = setTimeout(() => {
          cleanup()
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
          reject(new Error(message || 'Error de autenticación.'))
        }

        function cleanup() {
          socket.off(SOCKET_EVENTS.AUTH_SUCCESS, onSuccess)
          socket.off(SOCKET_EVENTS.AUTH_ERROR, onError)
        }

        socket.once(SOCKET_EVENTS.AUTH_SUCCESS, onSuccess)
        socket.once(SOCKET_EVENTS.AUTH_ERROR, onError)

        socket.emit(SOCKET_EVENTS.AUTH_LOGIN, { name: name.trim(), email: email.trim().toLowerCase() })
      })
    },
    [socket]
  )

  // ── logout ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.USER)
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID)
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  // ── Update user in storage if changed ────────────────────────────────
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
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context.
 * @returns {{ user: User|null, isLoading: boolean, isAuthenticated: boolean, login: Function, logout: Function, updateUser: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
