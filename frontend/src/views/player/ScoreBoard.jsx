import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useGame } from '../../contexts/GameContext.jsx'
import LeaderboardRow from '../../components/ui/LeaderboardRow.jsx'
import RappiLogo from '../../components/ui/RappiLogo.jsx'

const RANK_EMOJIS = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * End-of-session player scoreboard.
 */
export default function ScoreBoard() {
  const { user } = useAuth()
  const { leaderboard } = useGame()

  const myEntry = leaderboard.find((e) => e.userId === user?.userId)
  const myRank  = myEntry?.rank || (leaderboard.findIndex((e) => e.userId === user?.userId) + 1) || null
  const myScore = myEntry?.totalScore || myEntry?.score || 0
  const myCorrect = myEntry?.correctAnswers || 0
  const inTop3  = myRank && myRank <= 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col min-h-screen px-4 py-6 gap-5"
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-1 text-center">
        <RappiLogo size={32} />
        <h1 className="text-2xl font-extrabold text-gray-900 mt-2">¡Sesión terminada!</h1>
        <p className="text-gray-500 text-sm">¡Gracias por participar!</p>
      </div>

      {/* My result card */}
      {myEntry && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 22 }}
          className={`
            rounded-2xl px-5 py-5 text-center border-2
            ${inTop3 ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-200'}
          `}
        >
          <div className="text-3xl mb-1">
            {RANK_EMOJIS[myRank] || `#${myRank}`}
          </div>
          <p className={`text-lg font-extrabold ${inTop3 ? 'text-orange-700' : 'text-gray-900'}`}>
            {user?.name}
          </p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{myScore.toLocaleString()}</p>
          <p className="text-xs text-gray-400 font-medium">puntos totales</p>
          {myCorrect > 0 && (
            <p className="text-sm text-green-600 font-semibold mt-2">
              {myCorrect} respuesta{myCorrect !== 1 ? 's' : ''} correcta{myCorrect !== 1 ? 's' : ''}
            </p>
          )}
        </motion.div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
            Tabla de posiciones
          </p>
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                rank={entry.rank || i + 1}
                name={entry.name}
                email={entry.email}
                score={entry.totalScore || entry.score || 0}
                isCurrentUser={entry.userId === user?.userId}
                highlight={i < 3}
              />
            ))}
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="mt-auto pt-4 text-center">
        <p className="text-xs text-gray-300 font-medium">
          Powered by <span className="font-bold text-orange-400">Rappi</span> Training Hour
        </p>
      </div>
    </motion.div>
  )
}
