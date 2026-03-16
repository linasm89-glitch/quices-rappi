import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSocket } from './SocketContext.jsx'
import { GAME_PHASES, SOCKET_EVENTS, STORAGE_KEYS } from '../lib/constants.js'

/**
 * @typedef {object} GameState
 * @property {object|null}  currentSession
 * @property {string}       phase
 * @property {Array}        participants
 * @property {object|null}  currentQuestion
 * @property {Array}        leaderboard
 * @property {boolean}      hasAnswered
 * @property {number|null}  lastScore
 * @property {number|null}  timerStartedAt
 * @property {number}       questionIndex
 * @property {number}       totalQuestions
 * @property {string|null}  correctOptionId
 * @property {object|null}  answerStats
 * @property {string|null}  selectedOptionId
 * @property {object}       liveStats
 * @property {string|null}  feedback
 * @property {number}       totalScore
 */

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const { socket } = useSocket()

  const [currentSession,   setCurrentSession]   = useState(null)
  const [phase,            setPhase]            = useState(GAME_PHASES.LOBBY)
  const [participants,     setParticipants]      = useState([])
  const [currentQuestion,  setCurrentQuestion]  = useState(null)
  const [leaderboard,      setLeaderboard]      = useState([])
  const [hasAnswered,      setHasAnswered]      = useState(false)
  const [lastScore,        setLastScore]        = useState(null)
  const [totalScore,       setTotalScore]       = useState(0)

  // Phase 3 new state
  const [timerStartedAt,   setTimerStartedAt]   = useState(null)
  const [questionIndex,    setQuestionIndex]    = useState(0)
  const [totalQuestions,   setTotalQuestions]   = useState(0)
  const [correctOptionId,  setCorrectOptionId]  = useState(null)
  const [answerStats,      setAnswerStats]      = useState(null)
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [liveStats,        setLiveStats]        = useState({ answeredCount: 0, totalPlayers: 0 })
  const [feedback,         setFeedback]         = useState(null)

  // ── Socket event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    // Player joined session
    const onJoined = ({ session, participantCount }) => {
      setCurrentSession(session)
      setPhase(session.phase || GAME_PHASES.LOBBY)
      setParticipants(session.participants || [])
      const sid = session.id || session.sessionId
      if (sid) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sid)
      }
    }

    // New participant joined
    const onParticipantJoined = ({ userId, name, role, participantCount }) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.userId === userId)
        if (exists) return prev
        return [...prev, { userId, name, role }]
      })
    }

    // Participant left
    const onParticipantLeft = ({ userId }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== userId))
    }

    // Game started
    const onGameStart = ({ session }) => {
      setCurrentSession(session)
      setPhase(GAME_PHASES.LOBBY)
      setLeaderboard([])
      setTotalScore(0)
    }

    // New question received
    const onQuestion = ({ question, questionIndex: qi, totalQuestions: tq, timerStartedAt: tsa }) => {
      setCurrentQuestion(question)
      setPhase(GAME_PHASES.QUESTION)
      setHasAnswered(false)
      setLastScore(null)
      setTimerStartedAt(tsa || null)
      setQuestionIndex(typeof qi === 'number' ? qi : 0)
      setTotalQuestions(typeof tq === 'number' ? tq : 0)
      // Reset reveal state
      setCorrectOptionId(null)
      setAnswerStats(null)
      setSelectedOptionId(null)
      setFeedback(null)
      setLiveStats({ answeredCount: 0, totalPlayers: 0 })
    }

    // Answer acknowledged
    const onAnswerAck = ({ correct, pointsEarned, totalScore: ts }) => {
      setHasAnswered(true)
      setLastScore(pointsEarned)
      if (typeof ts === 'number') setTotalScore(ts)
    }

    // Question reveal
    const onReveal = ({ correctOptionId: coid, feedback: fb, answerStats: as, leaderboard: lb }) => {
      setPhase(GAME_PHASES.REVEAL)
      setCorrectOptionId(coid || null)
      setFeedback(fb || null)
      setAnswerStats(as || null)
      if (lb) setLeaderboard(lb)
    }

    // Leaderboard update
    const onLeaderboard = ({ leaderboard: lb }) => {
      if (lb) setLeaderboard(lb)
    }

    // Live stats update
    const onLiveStats = ({ answeredCount, totalPlayers }) => {
      setLiveStats({ answeredCount: answeredCount || 0, totalPlayers: totalPlayers || 0 })
    }

    // Game ended
    const onGameEnd = ({ leaderboard: lb }) => {
      setPhase(GAME_PHASES.ENDED)
      setCurrentQuestion(null)
      setTimerStartedAt(null)
      if (lb) setLeaderboard(lb)
    }

    socket.on(SOCKET_EVENTS.SESSION_JOINED,             onJoined)
    socket.on(SOCKET_EVENTS.SESSION_REJOINED,           onJoined)
    socket.on(SOCKET_EVENTS.SESSION_PARTICIPANT_JOINED, onParticipantJoined)
    socket.on(SOCKET_EVENTS.SESSION_PARTICIPANT_LEFT,   onParticipantLeft)
    socket.on(SOCKET_EVENTS.GAME_START,                 onGameStart)
    socket.on(SOCKET_EVENTS.GAME_QUESTION,              onQuestion)
    socket.on(SOCKET_EVENTS.GAME_ANSWER_ACK,            onAnswerAck)
    socket.on(SOCKET_EVENTS.GAME_REVEAL,                onReveal)
    socket.on(SOCKET_EVENTS.GAME_LEADERBOARD,           onLeaderboard)
    socket.on(SOCKET_EVENTS.GAME_END,                   onGameEnd)
    socket.on('game:live_stats',                        onLiveStats)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_JOINED,             onJoined)
      socket.off(SOCKET_EVENTS.SESSION_REJOINED,           onJoined)
      socket.off(SOCKET_EVENTS.SESSION_PARTICIPANT_JOINED, onParticipantJoined)
      socket.off(SOCKET_EVENTS.SESSION_PARTICIPANT_LEFT,   onParticipantLeft)
      socket.off(SOCKET_EVENTS.GAME_START,                 onGameStart)
      socket.off(SOCKET_EVENTS.GAME_QUESTION,              onQuestion)
      socket.off(SOCKET_EVENTS.GAME_ANSWER_ACK,            onAnswerAck)
      socket.off(SOCKET_EVENTS.GAME_REVEAL,                onReveal)
      socket.off(SOCKET_EVENTS.GAME_LEADERBOARD,           onLeaderboard)
      socket.off(SOCKET_EVENTS.GAME_END,                   onGameEnd)
      socket.off('game:live_stats',                        onLiveStats)
    }
  }, [socket])

  // ── Actions ────────────────────────────────────────────────────────────
  const joinSession = useCallback(
    (sessionId) => {
      if (socket) {
        socket.emit(SOCKET_EVENTS.SESSION_JOIN, { sessionId })
      }
    },
    [socket]
  )

  const submitAnswer = useCallback(
    (sessionId, optionId) => {
      if (socket && !hasAnswered) {
        setSelectedOptionId(optionId)
        socket.emit(SOCKET_EVENTS.GAME_ANSWER, { sessionId, selectedOptionId: optionId })
        setHasAnswered(true)
      }
    },
    [socket, hasAnswered]
  )

  const startSession = useCallback(
    (sessionId) => {
      if (socket) {
        socket.emit('trainer:start_session', { sessionId })
      }
    },
    [socket]
  )

  const nextQuestion = useCallback(
    (sessionId) => {
      if (socket) {
        socket.emit('trainer:next_question', { sessionId })
      }
    },
    [socket]
  )

  const revealAnswer = useCallback(
    (sessionId) => {
      if (socket) {
        socket.emit('trainer:reveal', { sessionId })
      }
    },
    [socket]
  )

  const endSession = useCallback(
    (sessionId) => {
      if (socket) {
        socket.emit('trainer:end_session', { sessionId })
      }
    },
    [socket]
  )

  const resetGame = useCallback(() => {
    setCurrentSession(null)
    setPhase(GAME_PHASES.LOBBY)
    setParticipants([])
    setCurrentQuestion(null)
    setLeaderboard([])
    setHasAnswered(false)
    setLastScore(null)
    setTotalScore(0)
    setTimerStartedAt(null)
    setQuestionIndex(0)
    setTotalQuestions(0)
    setCorrectOptionId(null)
    setAnswerStats(null)
    setSelectedOptionId(null)
    setFeedback(null)
    setLiveStats({ answeredCount: 0, totalPlayers: 0 })
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID)
  }, [])

  return (
    <GameContext.Provider
      value={{
        // Existing state
        currentSession,
        phase,
        participants,
        currentQuestion,
        leaderboard,
        hasAnswered,
        lastScore,
        // New state
        totalScore,
        timerStartedAt,
        questionIndex,
        totalQuestions,
        correctOptionId,
        answerStats,
        selectedOptionId,
        liveStats,
        feedback,
        // Actions
        joinSession,
        submitAnswer,
        resetGame,
        startSession,
        nextQuestion,
        revealAnswer,
        endSession,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

/**
 * Hook to access game context.
 */
export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used inside <GameProvider>')
  }
  return ctx
}
