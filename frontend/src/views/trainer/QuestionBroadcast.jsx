import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../../contexts/GameContext.jsx'
import { GAME_PHASES, OPTION_COLORS } from '../../lib/constants.js'
import { useCountdown } from '../../hooks/useCountdown.js'
import CountdownRing from '../../components/ui/CountdownRing.jsx'
import OptionButton from '../../components/ui/OptionButton.jsx'
import AnswerReveal from './AnswerReveal.jsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * Trainer broadcast view — optimized for screen-sharing on Google Meet.
 * Large fonts, readable at distance.
 */
export default function QuestionBroadcast() {
  const {
    currentSession,
    currentQuestion,
    phase,
    questionIndex,
    totalQuestions,
    timerStartedAt,
    correctOptionId,
    answerStats,
    liveStats,
    feedback,
    nextQuestion,
    revealAnswer,
    endSession,
  } = useGame()

  const { secondsLeft } = useCountdown(phase === GAME_PHASES.QUESTION ? timerStartedAt : null)

  const sessionId = currentSession?.id || currentSession?.sessionId

  const isReveal   = phase === GAME_PHASES.REVEAL
  const isQuestion = phase === GAME_PHASES.QUESTION
  const isLobby    = phase === GAME_PHASES.LOBBY

  const isLastQuestion = questionIndex === totalQuestions - 1

  const getOptionState = (opt) => {
    if (!isReveal) return 'idle'
    return opt.id === correctOptionId ? 'correct' : 'wrong'
  }

  // Lobby waiting screen (before first question)
  if (isLobby) {
    const playerCount = liveStats.totalPlayers || 0
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FF441F, #FF6E4D)' }}
        >
          <span className="text-4xl">🎯</span>
        </motion.div>
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">{currentSession?.name}</h2>
          <p className="text-xl text-gray-500 mt-3">
            {playerCount} jugador{playerCount !== 1 ? 'es' : ''} conectado{playerCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => nextQuestion(sessionId)}
          className="px-12 py-5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-2xl rounded-2xl shadow-lg transition-all"
        >
          Comenzar — Primera Pregunta →
        </button>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Progress + timer row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Pregunta {questionIndex + 1} de {totalQuestions}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < questionIndex ? 'bg-orange-400' :
                    i === questionIndex ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                  style={{ maxWidth: 40 }}
                />
              ))}
            </div>
          </div>

          {isQuestion && (
            <CountdownRing secondsLeft={secondsLeft} totalSeconds={20} size={100} strokeWidth={8} />
          )}
          {isReveal && (
            <div className="px-4 py-2 bg-gray-100 rounded-xl text-gray-500 font-bold text-sm">
              Tiempo agotado
            </div>
          )}
        </div>

        {/* Question title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-3xl font-extrabold text-gray-900 leading-tight" style={{ minHeight: '3rem' }}>
            {currentQuestion.title}
          </p>
        </div>

        {/* Live stats */}
        {isQuestion && (
          <div className="flex items-center gap-2 text-base font-semibold text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {liveStats.answeredCount} de {liveStats.totalPlayers} respondieron
          </div>
        )}

        {/* Options or Reveal */}
        {isReveal ? (
          <AnswerReveal
            correctOptionId={correctOptionId}
            feedback={feedback}
            answerStats={answerStats}
            question={currentQuestion}
            onNext={() => nextQuestion(sessionId)}
            onEnd={() => endSession(sessionId)}
            isLastQuestion={isLastQuestion}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
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

            {/* Control buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => revealAnswer(sessionId)}
                className="flex-1 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-lg shadow-md transition-all"
              >
                Revelar Respuesta
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
