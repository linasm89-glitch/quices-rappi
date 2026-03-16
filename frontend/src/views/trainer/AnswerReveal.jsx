import React from 'react'
import { motion } from 'framer-motion'
import { OPTION_COLORS } from '../../lib/constants.js'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * Rendered inside QuestionBroadcast when phase === 'reveal'.
 * Shows which answer was correct, feedback text, and distribution bar chart.
 */
export default function AnswerReveal({
  correctOptionId,
  feedback,
  answerStats,
  question,
  onNext,
  onEnd,
  isLastQuestion,
}) {
  if (!question) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Options with correct/wrong highlight */}
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((opt, i) => {
          const isCorrect = opt.id === correctOptionId
          const label = OPTION_LABELS[i]
          const color = OPTION_COLORS[i]
          const pct = answerStats?.[opt.id?.toLowerCase()] ?? 0

          return (
            <motion.div
              key={opt.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`
                rounded-2xl p-4 border-2 transition-all
                ${isCorrect
                  ? 'bg-green-50 border-green-400 shadow-lg'
                  : 'bg-gray-50 border-gray-200 opacity-60'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-white`}
                  style={{ background: isCorrect ? '#22C55E' : color.hex }}
                >
                  {label}
                </span>
                <span className={`text-sm font-semibold flex-1 ${isCorrect ? 'text-green-800' : 'text-gray-600'}`}>
                  {opt.text}
                </span>
                {isCorrect && <span className="text-green-600 text-lg">✓</span>}
              </div>

              {/* Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className={isCorrect ? 'text-green-700' : 'text-gray-500'}>{pct}%</span>
                  {answerStats && (
                    <span className="text-gray-400">
                      {Math.round((pct / 100) * (answerStats.total || 0))} resp.
                    </span>
                  )}
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.08 }}
                    className={`h-full rounded-full ${isCorrect ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Feedback box */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-l-4 border-orange-400 bg-orange-50 rounded-r-xl px-5 py-4"
        >
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">Explicación</p>
          <p className="text-base text-gray-800 leading-relaxed font-medium">{feedback}</p>
        </motion.div>
      )}

      {/* Total responses */}
      {answerStats && (
        <p className="text-center text-sm text-gray-400 font-medium">
          {answerStats.total} respuesta{answerStats.total !== 1 ? 's' : ''} registrada{answerStats.total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isLastQuestion ? (
          <button
            onClick={onEnd}
            className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-lg transition-all"
          >
            Ver Resultados Finales
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-1 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-lg transition-all"
          >
            Siguiente Pregunta →
          </button>
        )}
      </div>
    </motion.div>
  )
}
