import React from 'react'
import { motion } from 'framer-motion'

/**
 * Answer option button for trainer and player views.
 * @param {{
 *   label: 'A'|'B'|'C'|'D',
 *   text: string,
 *   state: 'idle'|'selected'|'correct'|'wrong'|'revealed',
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   color: { bg: string, hover: string, text: string, hex: string }
 * }} props
 */
export default function OptionButton({ label, text, state = 'idle', onClick, disabled = false, color }) {
  const isIdle     = state === 'idle'
  const isSelected = state === 'selected'
  const isCorrect  = state === 'correct'
  const isWrong    = state === 'wrong'
  const isRevealed = state === 'revealed'

  const getContainerClasses = () => {
    const base = 'flex items-center gap-3 w-full px-4 py-4 rounded-xl font-semibold text-left transition-all duration-200 min-h-[64px]'

    if (isCorrect || isRevealed) {
      return `${base} bg-green-500 text-white ring-2 ring-green-300 shadow-lg`
    }
    if (isWrong) {
      return `${base} bg-gray-300 text-gray-500 opacity-70`
    }
    if (isSelected) {
      return `${base} ${color?.bg ?? 'bg-blue-500'} ${color?.text ?? 'text-white'} ring-4 ring-white ring-offset-2 shadow-lg`
    }
    // idle
    return `${base} ${color?.bg ?? 'bg-blue-500'} ${color?.hover ?? 'hover:bg-blue-600'} ${color?.text ?? 'text-white'} shadow-md`
  }

  const getIcon = () => {
    if (isCorrect || isRevealed) return <CheckIcon />
    if (isWrong) return <XIcon />
    if (isSelected) return <PendingIcon />
    return null
  }

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      whileHover={disabled ? {} : { scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${getContainerClasses()} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Label badge */}
      <span
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold"
        style={{ background: 'rgba(0,0,0,0.15)' }}
      >
        {label}
      </span>

      {/* Text */}
      <span className="flex-1 text-sm leading-snug">{text}</span>

      {/* Status icon */}
      {getIcon() && (
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          {getIcon()}
        </span>
      )}
    </motion.button>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
