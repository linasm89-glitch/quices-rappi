import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Wifi, WifiOff, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSocket } from '../contexts/SocketContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import { GAME_PHASES, STORAGE_KEYS } from '../lib/constants.js'
import { formatScore } from '../lib/formatters.js'
import RappiLogo from '../components/ui/RappiLogo.jsx'
import ConnectionBanner from '../components/ui/ConnectionBanner.jsx'

import WaitingRoom from '../views/player/WaitingRoom.jsx'
import QuestionCard from '../views/player/QuestionCard.jsx'
import FeedbackCard from '../views/player/FeedbackCard.jsx'
import ScoreBoard from '../views/player/ScoreBoard.jsx'

// ─── PlayerShell ─────────────────────────────────────────────────────────────
export default function PlayerShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }
  const { connected } = useSocket()
  const {
    phase,
    currentSession,
    leaderboard,
    hasAnswered,
    totalScore,
    joinSession,
  } = useGame()

  // Auto-rejoin if session ID in storage
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID)
    if (storedSessionId && !currentSession) {
      joinSession(storedSessionId)
    }
  }, [])

  // Find current player's score from leaderboard
  const myEntry = leaderboard.find((e) => e.userId === user?.userId)
  const myScore = totalScore || myEntry?.score || 0
  const myRank  = myEntry?.rank ?? null

  // Decide which view to render
  const renderContent = () => {
    switch (phase) {
      case GAME_PHASES.LOBBY:
        return <WaitingRoom />

      case GAME_PHASES.QUESTION:
        // If player has already answered, show feedback
        return hasAnswered ? <FeedbackCard /> : <QuestionCard />

      case GAME_PHASES.REVEAL:
        return <FeedbackCard />

      case GAME_PHASES.ENDED:
        return <ScoreBoard />

      default:
        return <WaitingRoom />
    }
  }

  // ScoreBoard gets its own layout
  if (phase === GAME_PHASES.ENDED) {
    return (
      <div
        className="min-h-screen bg-gray-50 overflow-y-auto"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <ConnectionBanner />
        <ScoreBoard />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      <ConnectionBanner />

      {/* Top bar — minimal for mobile */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div
          className="px-4 h-14 flex items-center justify-between gap-4"
          style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
        >
          {/* Logo + connection */}
          <div className="flex items-center gap-2">
            <RappiLogo size={28} />
            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                connected ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'
              }`}
            >
              {connected
                ? <><Wifi size={10} className="animate-pulse" /> En vivo</>
                : <><WifiOff size={10} /> Desconectado</>
              }
            </span>
          </div>

          {/* Player info + score */}
          <div className="flex items-center gap-3">
            {myScore > 0 && (
              <div className="flex items-center gap-1.5 bg-primary-50 rounded-xl px-3 py-1.5">
                <Star size={13} className="text-primary-500" fill="currentColor" />
                <span className="text-sm font-extrabold text-primary-600">
                  {formatScore(myScore)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                style={{ background: '#FF441F' }}
              >
                {user?.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate hidden sm:block">
                {user?.name}
              </span>
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
      <main className="flex-1 overflow-y-auto">
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
