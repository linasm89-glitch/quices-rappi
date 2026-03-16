import { useState, useEffect, useRef } from 'react'
import { QUESTION_TIME_SECONDS } from '../lib/constants.js'

/**
 * Derives remaining seconds from timerStartedAt (Unix ms).
 * Uses requestAnimationFrame for smooth updates.
 * @param {number|null} timerStartedAt - Unix timestamp in ms when timer started
 * @returns {{ secondsLeft: number, progress: number, isExpired: boolean }}
 */
export function useCountdown(timerStartedAt) {
  const totalMs = QUESTION_TIME_SECONDS * 1000

  const compute = () => {
    if (!timerStartedAt) {
      return { secondsLeft: QUESTION_TIME_SECONDS, progress: 0, isExpired: false }
    }
    const elapsed = Date.now() - timerStartedAt
    const remaining = Math.max(0, totalMs - elapsed)
    const secondsLeft = Math.ceil(remaining / 1000)
    const progress = 1 - remaining / totalMs
    return {
      secondsLeft: Math.min(secondsLeft, QUESTION_TIME_SECONDS),
      progress: Math.min(1, Math.max(0, progress)),
      isExpired: remaining <= 0,
    }
  }

  const [state, setState] = useState(compute)
  const rafRef = useRef(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    if (!timerStartedAt) {
      setState({ secondsLeft: QUESTION_TIME_SECONDS, progress: 0, isExpired: false })
      return
    }

    const tick = (timestamp) => {
      // Update at minimum every 100ms
      if (timestamp - lastUpdateRef.current >= 100) {
        lastUpdateRef.current = timestamp
        const next = compute()
        setState(next)
        if (next.isExpired) return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [timerStartedAt])

  return state
}
