import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useGame } from '../../contexts/GameContext.jsx'

const TIPS = [
  'Responde rápido — ¡la velocidad suma puntos!',
  'Mantén la app abierta durante todo el quiz',
  'El ganador obtiene... ¡gloria eterna! 🏆',
]

/**
 * Mobile waiting screen while trainer hasn't started.
 */
export default function WaitingRoom() {
  const { user } = useAuth()
  const { currentSession, participants } = useGame()

  const playerCount = participants.filter((p) => p.role === 'player').length

  const [tipIndex, setTipIndex] = useState(0)

  // Auto-rotate tips every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 py-8 px-4 min-h-screen"
    >
      {/* Hero logo */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-4"
      >
        <img src="/logo%20Rappi.png" alt="Rappi" style={{ height: '60px', width: 'auto' }} draggable={false} />
      </motion.div>

      {/* Heading */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">
          ¡Todo listo, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Sesión activa</p>
      </div>

      {/* Session info */}
      {currentSession && (
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sesión</p>
          <p className="font-extrabold text-gray-900 text-base">{currentSession.name}</p>
          <p className="text-sm text-orange-500 font-semibold mt-1">
            {playerCount} participante{playerCount !== 1 ? 's' : ''} conectado{playerCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Waiting indicator */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
          Esperando al trainer…
        </p>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1.2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-3 h-3 rounded-full"
              style={{ background: '#FF441F' }}
            />
          ))}
        </div>
      </div>

      {/* Tips carousel */}
      <div className="w-full max-w-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
          Consejo
        </p>
        <div className="relative h-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center"
            >
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 w-full">
                <p className="text-sm text-gray-700 font-medium text-center leading-snug">
                  {TIPS[tipIndex]}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {TIPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === tipIndex ? 'bg-orange-400 w-4' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
