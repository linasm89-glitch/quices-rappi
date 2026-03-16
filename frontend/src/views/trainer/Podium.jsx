import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGame } from '../../contexts/GameContext.jsx'
import LeaderboardRow from '../../components/ui/LeaderboardRow.jsx'

const PODIUM_ORDER = [1, 0, 2] // center=1st, left=2nd, right=3rd — render 3rd first, then 2nd, then 1st
const PODIUM_HEIGHTS = { 0: 160, 1: 120, 2: 96 } // 1st=tall, 2nd=medium, 3rd=short
const PODIUM_DELAY   = { 0: 0.6, 1: 0.3, 2: 0 }  // stagger: 3rd first, 2nd, 1st

/**
 * Animated end-of-session podium for the trainer screen.
 */
export default function Podium() {
  const { leaderboard, resetGame } = useGame()

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  // Confetti when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FF441F', '#FBBF24', '#22C55E', '#3B82F6', '#8B5CF6'],
      })
    }, 800) // after 1st place block animates in

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4" style={{ background: '#1a1a1a' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-2">Resultados Finales</p>
        <h1 className="text-5xl font-extrabold text-white">Podio</h1>
        <p className="text-gray-400 mt-2 text-base">¡Felicitaciones a los ganadores!</p>
      </motion.div>

      {/* Podium blocks */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-12 w-full max-w-lg">
          {/* Render in order: 3rd (index 2), 2nd (index 1), 1st (index 0) */}
          {[2, 1, 0].map((idx) => {
            const entry = top3[idx]
            if (!entry) return <div key={idx} className="w-28" />
            const rank = idx + 1
            const height = PODIUM_HEIGHTS[idx]
            const delay  = PODIUM_DELAY[idx]

            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                {/* Player info above block */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: delay + 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-extrabold mx-auto mb-1 border-4"
                    style={{
                      background: rank === 1 ? '#FBBF24' : rank === 2 ? '#94A3B8' : '#CD7C0A',
                      borderColor: rank === 1 ? '#F59E0B' : rank === 2 ? '#64748B' : '#92400E',
                    }}
                  >
                    {(entry.name?.[0] || '?').toUpperCase()}
                  </div>
                  <p className="text-white font-bold text-sm max-w-[96px] truncate">{entry.name}</p>
                  <p className="text-orange-400 font-extrabold text-base">{(entry.totalScore || entry.score || 0).toLocaleString()}</p>
                </motion.div>

                {/* Podium block — animates UP */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height, opacity: 1 }}
                  transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="w-28 rounded-t-xl flex flex-col items-center justify-end pb-3 overflow-hidden"
                  style={{
                    background: rank === 1
                      ? 'linear-gradient(180deg,#FBBF24,#F59E0B)'
                      : rank === 2
                      ? 'linear-gradient(180deg,#94A3B8,#64748B)'
                      : 'linear-gradient(180deg,#CD7C0A,#92400E)',
                  }}
                >
                  <span className="text-2xl">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </span>
                </motion.div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full leaderboard */}
      {leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 text-center">
            Tabla de posiciones completa
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {leaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                rank={entry.rank || i + 1}
                name={entry.name}
                email={entry.email}
                score={entry.totalScore || entry.score || 0}
                isCurrentUser={false}
                highlight={i < 3}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Nueva sesión */}
      <motion.button
        onClick={resetGame}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-10 px-10 py-4 rounded-2xl border-2 border-orange-500 text-orange-400 font-extrabold text-lg hover:bg-orange-500 hover:text-white transition-all"
      >
        Nueva Sesión
      </motion.button>
    </div>
  )
}
