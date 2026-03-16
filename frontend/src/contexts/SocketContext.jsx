import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { STORAGE_KEYS } from '../lib/constants.js'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [reconnecting, setReconnecting] = useState(false)

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id)
      setConnected(true)
      setConnectionError(null)
      setReconnecting(false)

      // Re-join active session on reconnect
      const storedUser      = sessionStorage.getItem(STORAGE_KEYS.USER)
      const storedSessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID)

      if (storedUser && storedSessionId) {
        try {
          const user = JSON.parse(storedUser)
          socket.emit('player:rejoin', {
            userId:    user.userId,
            sessionId: storedSessionId,
          })
        } catch {
          // Ignore stale storage
        }
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason)
      setConnected(false)
      setReconnecting(false)
    })

    socket.on('reconnect_attempt', () => {
      setReconnecting(true)
    })

    socket.on('connect_error', (err) => {
      console.error('[socket] connection error:', err.message)
      setConnectionError(err.message)
      setConnected(false)
    })

    socket.on('reconnect', (attempt) => {
      console.log(`[socket] reconnected after ${attempt} attempt(s)`)
      setConnectionError(null)
    })

    socket.on('reconnect_failed', () => {
      console.error('[socket] reconnection failed after max attempts')
      setConnectionError('No se pudo reconectar. Recarga la página.')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, connectionError, reconnecting }}>
      {children}
    </SocketContext.Provider>
  )
}

/**
 * Hook to access the socket context.
 * @returns {{ socket: import('socket.io-client').Socket, connected: boolean, connectionError: string|null, reconnecting: boolean }}
 */
export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) {
    throw new Error('useSocket must be used inside <SocketProvider>')
  }
  return ctx
}
