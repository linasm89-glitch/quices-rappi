/**
 * formatters.js
 * Display formatting utilities for The Training Hour.
 */

/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param {number} ms - milliseconds
 * @returns {string} e.g. "1.5s", "0.8s", "12.0s"
 */
export function formatTime(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return '0.0s'
  const seconds = ms / 1000
  return `${seconds.toFixed(1)}s`
}

/**
 * Formats a score number with thousands separator and "pts" suffix.
 * @param {number} points
 * @returns {string} e.g. "1,250 pts", "850 pts"
 */
export function formatScore(points) {
  if (typeof points !== 'number' || isNaN(points)) return '0 pts'
  return `${points.toLocaleString('es-CO')} pts`
}

/**
 * Formats a rank number with ordinal indicator.
 * @param {number} n - rank (1-based)
 * @returns {string} e.g. "1°", "2°", "10°"
 */
export function formatRank(n) {
  if (typeof n !== 'number' || isNaN(n) || n < 1) return '—'
  return `${n}°`
}

/**
 * Formats an ISO date string to a readable localized date.
 * @param {string} isoString
 * @returns {string} e.g. "14 Mar 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '—'

  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('es-CO', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

/**
 * Formats an ISO date string to a readable time.
 * @param {string} isoString
 * @returns {string} e.g. "3:45 PM"
 */
export function formatTime12h(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'

  return date.toLocaleTimeString('es-CO', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Groups an array of sessions by their formatted date.
 * @param {Array<{ date: string }>} sessions
 * @returns {Record<string, Array>} keys are formatted dates, values are session arrays
 */
export function groupSessionsByDate(sessions) {
  if (!Array.isArray(sessions)) return {}

  return sessions.reduce((acc, session) => {
    const dateKey = formatDate(session.date || session.createdAt)
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(session)
    return acc
  }, {})
}

/**
 * Returns a short relative time label.
 * @param {string} isoString
 * @returns {string} e.g. "Hace 2 min", "Hace 1 hora", "Ayer"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr  = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60)  return 'Ahora mismo'
  if (diffMin < 60)  return `Hace ${diffMin} min`
  if (diffHr < 24)   return `Hace ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`
  if (diffDay === 1) return 'Ayer'
  if (diffDay < 7)   return `Hace ${diffDay} días`
  return formatDate(isoString)
}

/**
 * Formats a percentage (0–100) with one decimal place.
 * @param {number} value
 * @returns {string} e.g. "87.5%"
 */
export function formatPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0%'
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`
}
