import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  Users,
  Target,
  TrendingDown,
  Flame,
  Star,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  BarChart2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { SOCKET_EVENTS } from '../../lib/constants.js'
import { formatDate, formatTime, formatScore, formatPercent } from '../../lib/formatters.js'
import ExportButton from '../../components/admin/ExportButton.jsx'
import QuestionBarChart from '../../components/charts/QuestionBarChart.jsx'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-gray-100 rounded-lg animate-pulse ${className}`}
    />
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconColor, value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Question Row (expandable) ────────────────────────────────────────────────

function QuestionRow({ q, index, isHardest, isEasiest }) {
  const [open, setOpen] = useState(false)

  const difficultyLabel =
    q.correctPct <= 33
      ? { text: 'Difícil', cls: 'bg-red-100 text-red-700' }
      : q.correctPct <= 66
      ? { text: 'Media', cls: 'bg-yellow-100 text-yellow-700' }
      : { text: 'Fácil', cls: 'bg-green-100 text-green-700' }

  const optionStats = ['a', 'b', 'c', 'd'].map((key) => ({
    label: key.toUpperCase(),
    value: q.optionCounts?.[key] ?? 0,
    isCorrect: key === (q.correctOptionId || '').toLowerCase(),
    color: '#D1D5DB',
  }))

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isHardest
          ? 'border-red-200 bg-red-50'
          : isEasiest
          ? 'border-green-200 bg-green-50'
          : 'border-gray-100 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        {/* Index */}
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
          {index + 1}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
          {q.title}
        </span>

        {/* % bar mini */}
        <div className="hidden sm:flex items-center gap-2 w-28 flex-shrink-0">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF441F]"
              style={{ width: `${q.correctPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 w-9 text-right">
            {q.correctPct}%
          </span>
        </div>

        {/* Difficulty badge */}
        <span
          className={`hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyLabel.cls}`}
        >
          {difficultyLabel.text}
        </span>

        {open ? (
          <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span>
                  Respuestas: <strong className="text-gray-700">{q.totalAnswers}</strong>
                </span>
                <span>
                  Correctas: <strong className="text-gray-700">{q.correctCount}</strong>
                </span>
                <span>
                  Tiempo prom:{' '}
                  <strong className="text-gray-700">{formatTime(q.avgTimeMs)}</strong>
                </span>
              </div>
              <QuestionBarChart stats={optionStats} title="Distribución de respuestas" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Leaderboard Table ────────────────────────────────────────────────────────

const MEDALS = ['🥇', '🥈', '🥉']
const PAGE_SIZE = 20

function LeaderboardTable({ leaderboard }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('totalScore')
  const [sortDir, setSortDir] = useState('desc')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return leaderboard.filter(
      (p) =>
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
    )
  }, [leaderboard, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'string') {
        return sortDir === 'asc'
          ? va.localeCompare(vb)
          : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [filtered, sortKey, sortDir])

  const visible = showAll ? sorted : sorted.slice(0, PAGE_SIZE)

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <ChevronUp size={13} className="inline ml-0.5" />
      ) : (
        <ChevronDown size={13} className="inline ml-0.5" />
      )
    ) : null

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF441F]/30 focus:border-[#FF441F] transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FF441F] text-white">
              <th className="py-3 px-4 text-left font-semibold w-10">#</th>
              <th
                className="py-3 px-4 text-left font-semibold cursor-pointer select-none whitespace-nowrap"
                onClick={() => toggleSort('name')}
              >
                Nombre <SortIcon col="name" />
              </th>
              <th className="py-3 px-4 text-left font-semibold hidden md:table-cell">
                Correo
              </th>
              <th
                className="py-3 px-4 text-right font-semibold cursor-pointer select-none whitespace-nowrap"
                onClick={() => toggleSort('totalScore')}
              >
                Puntaje <SortIcon col="totalScore" />
              </th>
              <th className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                Correctas
              </th>
              <th className="py-3 px-4 text-right font-semibold hidden lg:table-cell whitespace-nowrap">
                Tiempo Prom.
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400 text-sm">
                  No se encontraron participantes.
                </td>
              </tr>
            ) : (
              visible.map((p, idx) => (
                <tr
                  key={p.userId || idx}
                  className={`border-t border-gray-50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-orange-50/40`}
                >
                  <td className="py-2.5 px-4 font-bold text-gray-500 text-sm">
                    {MEDALS[p.rank - 1] || p.rank}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-gray-800 max-w-[160px] truncate">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 hidden md:table-cell max-w-[200px] truncate">
                    {p.email}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#FF441F]">
                    {p.totalScore.toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-600">
                    {p.correctAnswers}/{p.totalQuestions}
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-500 hidden lg:table-cell">
                    {formatTime(p.avgResponseTimeMs)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {sorted.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="text-sm text-[#FF441F] font-semibold hover:underline self-center"
        >
          {showAll
            ? 'Ver menos'
            : `Ver todos (${sorted.length - PAGE_SIZE} más)`}
        </button>
      )}
    </div>
  )
}

// ─── SessionResults ───────────────────────────────────────────────────────────

export default function SessionResults() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [session, setSession] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!socket || !id) return

    // Request session metadata
    socket.emit(SOCKET_EVENTS.ADMIN_GET_SESSION, { sessionId: id })
    // Request analytics
    socket.emit(SOCKET_EVENTS.ADMIN_GET_RESULTS, { sessionId: id })

    const handleDetail = ({ session: s }) => {
      setSession(s)
    }

    const handleResults = ({ analyticsData }) => {
      setAnalytics(analyticsData)
      setIsLoading(false)
    }

    const handleError = ({ message } = {}) => {
      setError(message || 'Error al cargar los resultados.')
      setIsLoading(false)
    }

    socket.on(SOCKET_EVENTS.SESSION_DETAIL, handleDetail)
    socket.on(SOCKET_EVENTS.SESSION_RESULTS, handleResults)
    socket.on(SOCKET_EVENTS.SESSION_ERROR, handleError)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_DETAIL, handleDetail)
      socket.off(SOCKET_EVENTS.SESSION_RESULTS, handleResults)
      socket.off(SOCKET_EVENTS.SESSION_ERROR, handleError)
    }
  }, [socket, id])

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="w-56 h-6" />
            <Skeleton className="w-36 h-4" />
          </div>
        </div>
        {/* KPI skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        {/* Hard/Easy skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        {/* Questions skeleton */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
        <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin text-[#FF441F]" />
          Cargando resultados…
        </div>
      </div>
    )
  }

  // ── Session not ended ────────────────────────────────────────────────────
  if (!analytics && session && (session.status === 'live' || session.status === 'draft')) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Resultados
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4 text-center">
          <BarChart2 size={40} className="text-gray-200" />
          <p className="text-base font-bold text-gray-700">
            La sesión aún no ha finalizado
          </p>
          <p className="text-sm text-gray-400 max-w-sm">
            Los resultados estarán disponibles una vez que el entrenador finalice la sesión.
          </p>
        </div>
      </div>
    )
  }

  // ── Error or no analytics ─────────────────────────────────────────────────
  if (!analytics) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Resultados
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-4 text-center">
          <BarChart2 size={40} className="text-gray-200" />
          <p className="text-base font-bold text-gray-700">
            {error || 'No se encontraron resultados para esta sesión.'}
          </p>
        </div>
      </div>
    )
  }

  const { summary, questionStats = [], leaderboard = [] } = analytics

  // Sort questions hardest → easiest
  const sortedQuestions = [...questionStats].sort(
    (a, b) => a.correctPct - b.correctPct
  )

  const hardestIdx = summary.hardestQuestion?.questionIndex ?? -1
  const easiestIdx = summary.easiestQuestion?.questionIndex ?? -1

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-8 pb-12"
    >
      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors flex-shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">
            Resultados de la sesión
          </h1>
          {session && (
            <p className="text-sm text-gray-500 mt-0.5">
              {session.name} — {formatDate(session.date)}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <ExportButton sessionId={id} />
        </div>
      </div>

      {/* ── 2. KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Trophy}
          iconColor="bg-[#FF441F]"
          value={formatScore(summary.teamAvgScore)}
          label="Puntaje Promedio"
          delay={0}
        />
        <KpiCard
          icon={Users}
          iconColor="bg-blue-500"
          value={summary.totalParticipants}
          label="Participantes"
          delay={0.05}
        />
        <KpiCard
          icon={Target}
          iconColor="bg-green-500"
          value={formatPercent(summary.teamAvgCorrectPct)}
          label="Tasa de Acierto"
          delay={0.1}
        />
        <KpiCard
          icon={TrendingDown}
          iconColor="bg-red-400"
          value={
            summary.hardestQuestion
              ? `${summary.hardestQuestion.correctPct}% acierto`
              : '—'
          }
          label="Pregunta más difícil"
          delay={0.15}
        />
      </div>

      {/* ── 3. Hard / Easy highlight cards ───────────────────────────────── */}
      {(summary.hardestQuestion || summary.easiestQuestion) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.hardestQuestion && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3"
            >
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame size={18} className="text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">
                  Pregunta más difícil
                </p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                  {summary.hardestQuestion.title}
                </p>
                <p className="text-xs text-red-500 font-medium mt-1">
                  Solo el {summary.hardestQuestion.correctPct}% acertó
                </p>
              </div>
            </motion.div>
          )}

          {summary.easiestQuestion && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3"
            >
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star size={18} className="text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">
                  Pregunta más fácil
                </p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                  {summary.easiestQuestion.title}
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">
                  El {summary.easiestQuestion.correctPct}% acertó
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── 4. Per-question breakdown ─────────────────────────────────────── */}
      {sortedQuestions.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900">
              Preguntas
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              más difícil → más fácil
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {sortedQuestions.map((q, idx) => (
              <QuestionRow
                key={q.questionId || idx}
                q={q}
                index={q.questionIndex}
                isHardest={q.questionIndex === hardestIdx && hardestIdx !== easiestIdx}
                isEasiest={q.questionIndex === easiestIdx}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Leaderboard ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-extrabold text-gray-900">
          Clasificación — {leaderboard.length} participantes
        </h2>
        <LeaderboardTable leaderboard={leaderboard} />
      </section>
    </motion.div>
  )
}
