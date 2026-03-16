import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ChevronDown, Rocket } from 'lucide-react'
import { useGame } from '../../contexts/GameContext.jsx'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { SOCKET_EVENTS } from '../../lib/constants.js'

/**
 * Trainer lobby — select a draft session and wait for players to join.
 */
export default function Lobby() {
  const { socket } = useSocket()
  const { participants, joinSession, startSession, currentSession } = useGame()

  const [sessions, setSessions]       = useState([])
  const [selectedId, setSelectedId]   = useState('')
  const [loading, setLoading]         = useState(true)
  const [joining, setJoining]         = useState(false)
  const [starting, setStarting]       = useState(false)

  const playerCount = participants.filter((p) => p.role === 'player').length

  // Load sessions on mount
  useEffect(() => {
    if (!socket) return

    const onList = ({ sessions: list }) => {
      const drafts = list.filter((s) => s.status === 'draft' || s.status === 'live')
      setSessions(drafts)
      setLoading(false)
    }

    socket.on(SOCKET_EVENTS.SESSION_LIST, onList)
    socket.emit(SOCKET_EVENTS.SESSION_GET_ALL)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_LIST, onList)
    }
  }, [socket])

  const handleSelectSession = (id) => {
    setSelectedId(id)
    if (id) {
      setJoining(true)
      joinSession(id)
      setTimeout(() => setJoining(false), 1000)
    }
  }

  const handleStart = () => {
    if (!selectedId) return
    setStarting(true)
    startSession(selectedId)
  }

  const selectedSession = sessions.find((s) => s.id === selectedId) || currentSession

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-8 max-w-2xl mx-auto py-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Selecciona una sesión
        </h1>
        <p className="text-gray-500 mt-2 text-base">
          Elige el quiz que vas a presentar hoy y espera a que se unan los participantes.
        </p>
      </div>

      {/* Session selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Quiz disponible
        </label>

        {loading ? (
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="font-medium">No hay sesiones en borrador.</p>
            <p className="text-sm mt-1">Crea una sesión desde el panel de administración.</p>
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            >
              <option value="">— Elige un quiz —</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.questions?.length || 0} preguntas · {s.date})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
        )}
      </div>

      {/* Session details */}
      {selectedSession && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">{selectedSession.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{selectedSession.date} · {selectedSession.questions?.length || 0} preguntas</p>
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
            <Users size={20} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-orange-700 text-lg">{playerCount}</p>
              <p className="text-xs text-orange-600 font-medium">
                jugador{playerCount !== 1 ? 'es' : ''} conectado{playerCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {playerCount === 0 && (
            <p className="text-sm text-gray-400 text-center">
              Comparte tu pantalla y pide a los participantes que entren en <strong>rappi-quiz.app/play</strong>
            </p>
          )}
        </motion.div>
      )}

      {/* Start button */}
      <motion.button
        onClick={handleStart}
        disabled={!selectedId || starting}
        whileTap={selectedId && !starting ? { scale: 0.97 } : {}}
        className={`
          w-full flex items-center justify-center gap-3 py-5 rounded-2xl
          text-white font-extrabold text-xl shadow-lg transition-all duration-200
          ${selectedId && !starting
            ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
            : 'bg-gray-300 cursor-not-allowed text-gray-400'
          }
        `}
      >
        <Rocket size={24} />
        {starting ? 'Iniciando...' : 'Iniciar Quiz'}
      </motion.button>
    </motion.div>
  )
}
