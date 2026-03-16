import React from 'react'
import { motion } from 'framer-motion'

const RANK_EMOJIS = { 1: '🥇', 2: '🥈', 3: '🥉' }

const AVATAR_COLORS = [
  '#FF441F', '#3B82F6', '#22C55E', '#FBBF24',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

function getAvatarColor(name = '') {
  const code = name.charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

/**
 * Single leaderboard entry row.
 * @param {{
 *   rank: number,
 *   name: string,
 *   email?: string,
 *   score: number,
 *   isCurrentUser?: boolean,
 *   highlight?: boolean
 * }} props
 */
export default function LeaderboardRow({ rank, name, email, score, isCurrentUser = false, highlight = false }) {
  const rankDisplay = RANK_EMOJIS[rank]
    ? <span className="text-xl">{RANK_EMOJIS[rank]}</span>
    : <span className="text-sm font-extrabold text-gray-500 w-7 text-center">{rank}</span>

  return (
    <motion.div
      initial={highlight ? { opacity: 0, x: -16 } : false}
      animate={highlight ? { opacity: 1, x: 0 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${isCurrentUser
          ? 'bg-orange-50 border-2 border-orange-400'
          : 'bg-white border border-gray-100'
        }
      `}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {rankDisplay}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0"
        style={{ background: getAvatarColor(name) }}
      >
        {(name?.[0] || '?').toUpperCase()}
      </div>

      {/* Name & email */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-orange-700' : 'text-gray-900'}`}>
          {name}
          {isCurrentUser && <span className="ml-1.5 text-xs font-semibold text-orange-500">(tú)</span>}
        </p>
        {email && (
          <p className="text-xs text-gray-400 truncate">{email}</p>
        )}
      </div>

      {/* Score */}
      <div className={`text-base font-extrabold flex-shrink-0 ${isCurrentUser ? 'text-orange-600' : 'text-gray-800'}`}>
        {score.toLocaleString()}
      </div>
    </motion.div>
  )
}
