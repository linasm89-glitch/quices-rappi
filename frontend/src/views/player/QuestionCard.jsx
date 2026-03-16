import React from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../../contexts/GameContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { OPTION_COLORS } from '../../lib/constants.js'
import { useCountdown } from '../../hooks/useCountdown.js'
import CountdownRing from '../../components/ui/CountdownRing.jsx'
import OptionButton from '../../components/ui/OptionButton.jsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * Player view — mobile-first full-screen question card.
 */
export default function QuestionCard() {
  const {
    currentSession,
    currentQuestion,
    questionIndex,
    totalQuestions,
    timerStartedAt,
    selectedOptionId,
    hasAnswered,
    submitAnswer,
  } = useGame()

  const { secondsLeft } = useCountdown(timerStartedAt)

  const sessionId = currentSession?.id || currentSession?.sessionId

  const handleSelect = (optionId) => {
    if (hasAnswered) return
    submitAnswer(sessionId, optionId)
  }

  const getOptionState = (opt) => {
    if (!hasAnswered) return 'idle'
    if (opt.id === selectedOptionId) return 'selected'
    return 'idle'
  }

  if (!currentQuestion) return null

  return (
    <motion.div
      key={currentQuestion.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col min-h-screen"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Top progress bar */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Pregunta {questionIndex + 1} / {totalQuestions}
          </p>
          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        <CountdownRing secondsLeft={secondsLeft} totalSeconds={20} size={48} strokeWidth={5} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col gap-4 px-4 py-5" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-900 font-bold leading-snug" style={{ fontSize: '1.15rem' }}>
            {currentQuestion.title}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((opt, i) => (
            <OptionButton
              key={opt.id}
              label={OPTION_LABELS[i]}
              text={opt.text}
              state={getOptionState(opt)}
              onClick={() => handleSelect(opt.id)}
              disabled={hasAnswered || secondsLeft === 0}
              color={OPTION_COLORS[i]}
            />
          ))}
        </div>

        {/* Waiting message after answering */}
        {hasAnswered && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-gray-400 font-medium mt-2"
          >
            Esperando al resto de participantes…
          </motion.p>
        )}

        {secondsLeft === 0 && !hasAnswered && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-red-500 font-semibold mt-2"
          >
            ¡Tiempo agotado!
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
