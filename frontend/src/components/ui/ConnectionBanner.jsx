import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff, Loader2 } from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext.jsx'

/**
 * Fixed banner at the top of the screen that appears when the socket
 * disconnects and disappears (after a brief "reconnected" flash) on reconnect.
 */
export default function ConnectionBanner() {
  const { connected, reconnecting, connectionError } = useSocket()

  // Track whether we just came back online to show the green flash
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasDisconnected, setWasDisconnected] = useState(false)

  useEffect(() => {
    if (!connected) {
      setWasDisconnected(true)
      setShowReconnected(false)
    } else if (connected && wasDisconnected) {
      // Brief "reconnected" green flash
      setShowReconnected(true)
      setWasDisconnected(false)
      const timer = setTimeout(() => setShowReconnected(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [connected, wasDisconnected])

  const showBanner = !connected || showReconnected

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="connection-banner"
          initial={{ y: 56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 56, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          {showReconnected ? (
            /* ── Green "reconnected" flash ─────────────────────────────── */
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-white" />
              ¡Reconectado!
            </div>
          ) : reconnecting ? (
            /* ── Amber "reconnecting" state ────────────────────────────── */
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold">
              <Loader2 size={14} className="animate-spin" />
              Reconectando…
            </div>
          ) : (
            /* ── Red disconnected state ───────────────────────────────── */
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold">
              {/* Pulsing dot */}
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-white flex-shrink-0"
              />
              <WifiOff size={14} className="flex-shrink-0" />
              <span>
                {connectionError
                  ? connectionError
                  : 'Reconectando… No cierres la app'}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
