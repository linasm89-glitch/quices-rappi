import React from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../../contexts/GameContext.jsx'
import { OPTION_COLORS } from '../../lib/constants.js'
import OptionButton from '../../components/ui/OptionButton.jsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * Shown after player answers or after reveal.
 * Displays result, points, and explanation.
 */
export default function FeedbackCard() {
  const {
    currentQuestion,
    selectedOptionId,
    correctOptionId,
    lastScore,
    totalScore,
    feedback,
    phase,
  } = useGame()

  const isReveal = phase === 'reveal'
  const answered = selectedOptionId !== null

  // Determine if the player's answer was correct
  const isCorrect = answered && correctOptionId !== null && selectedOptionId === correctOptionId

  const getOptionState = (opt) => {
    if (!correctOptionId) {
      // Pre-reveal: show selected
      return opt.id === selectedOptionId ? 'selected' : 'idle'
    }
    if (opt.id === correctOptionId) return 'correct'
    if (opt.id === selectedOptionId) return 'wrong'
    return 'idle'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col min-h-screen"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="flex-1 flex flex-col gap-4 px-4 py-6"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        {/* Result banner */}
        {answered && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`
              rounded-2xl px-6 py-5 text-center
              ${correctOptionId === null
                ? 'bg-orange-50 border border-orange-200'
                : isCorrect
                ? 'bg-green-50 border border-green-300'
                : 'bg-red-50 border border-red-300'
              }
            `}
          >
            <span className="text-4xl">
              {correctOptionId === null ? '⏳' : isCorrect ? '✅' : '❌'}
            </span>
            <p className={`text-xl font-extrabold mt-2 ${
              correctOptionId === null ? 'text-orange-700' :
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {correctOptionId === null
                ? 'Respuesta enviada'
                : isCorrect
                ? '¡Correcto!'
                : 'Incorrecto'
              }
            </p>

            {/* Points */}
            {lastScore !== null && lastScore !== undefined && (
              <div className="mt-3">
                <motion.p
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                  className={`text-3xl font-extrabold ${isCorrect ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {lastScore > 0 ? `+${lastScore.toLocaleString()}` : '0'}
                </motion.p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">puntos ganados</p>
              </div>
            )}

            {/* Total score */}
            {totalScore > 0 && (
              <p className="text-sm font-semibold text-gray-500 mt-2">
                Total: <span className="text-gray-800 font-extrabold">{totalScore.toLocaleString()}</span> pts
              </p>
            )}
          </motion.div>
        )}

        {/* Options */}
        {currentQuestion && (
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                label={OPTION_LABELS[i]}
                text={opt.text}
                state={getOptionState(opt)}
                disabled
                color={OPTION_COLORS[i]}
              />
            ))}
          </div>
        )}

        {/* Feedback / explanation */}
        {isReveal && feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-4"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Explicación</p>
            <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
          </motion.div>
        )}

        {/* Waiting indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-400 font-medium"
        >
          {isReveal ? 'Espera la siguiente pregunta…' : 'Esperando resultados…'}
        </motion.p>
      </div>
    </motion.div>
  )
}
