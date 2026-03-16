import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSocket } from '../contexts/SocketContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import { GAME_PHASES } from '../lib/constants.js'
import RappiLogo from '../components/ui/RappiLogo.jsx'
import ConnectionBanner from '../components/ui/ConnectionBanner.jsx'

import Lobby from '../views/trainer/Lobby.jsx'
import QuestionBroadcast from '../views/trainer/QuestionBroadcast.jsx'
import Podium from '../views/trainer/Podium.jsx'

// ─── TrainerShell ────────────────────────────────────────────────────────────
export default function TrainerShell() {
  const { user, logout }       = useAuth()
  const { connected }          = useSocket()
  const { phase, currentSession } = useGame()
  const navigate               = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  // Decide which view to render
  const renderContent = () => {
    // No session started yet → show lobby
    if (!currentSession) {
      return <Lobby />
    }

    switch (phase) {
      case GAME_PHASES.LOBBY:
        return <QuestionBroadcast />
      case GAME_PHASES.QUESTION:
        return <QuestionBroadcast />
      case GAME_PHASES.REVEAL:
        return <QuestionBroadcast />
      case GAME_PHASES.ENDED:
        return <Podium />
      default:
        return <Lobby />
    }
  }

  // Podium gets its own full-screen dark bg
  if (phase === GAME_PHASES.ENDED && currentSession) {
    return <Podium />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <ConnectionBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          <div className="flex items-center gap-2.5">
            <RappiLogo size={28} />
            <div>
              <p className="text-sm font-extrabold text-gray-900 leading-none">The Training Hour</p>
              <p className="text-xs font-medium leading-none mt-0.5" style={{ color: '#FF441F' }}>
                Trainer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
                ${connected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
                }
              `}
            >
              <Radio size={11} className={connected ? 'animate-pulse' : ''} />
              {connected ? 'En vivo' : 'Desconectado'}
            </div>
            <div className="text-right leading-none hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
