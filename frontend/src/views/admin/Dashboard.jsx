import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, AlertTriangle, Loader2 } from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { SOCKET_EVENTS } from '../../lib/constants.js'
import { groupSessionsByDate, formatDate } from '../../lib/formatters.js'
import SessionCard from '../../components/admin/SessionCard.jsx'

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="h-4 bg-gray-200 rounded-lg flex-1 max-w-xs" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <div className="h-6 w-16 bg-gray-100 rounded-lg" />
        <div className="h-6 w-20 bg-gray-100 rounded-lg" />
        <div className="h-6 w-16 bg-gray-100 rounded-lg ml-auto" />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
    >
      <div className="text-6xl select-none">📋</div>
      <div>
        <p className="text-lg font-bold text-gray-800">No tienes sesiones aún</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
          Crea tu primera sesión de quiz y empieza a capacitar a tu equipo.
        </p>
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF441F] text-white text-sm font-bold
          hover:bg-[#CC3518] transition-colors shadow-sm mt-2"
      >
        <Plus size={15} />
        Crea tu primera sesión
      </button>
    </motion.div>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({ session, onConfirm, onCancel, isDeleting }) {
  return (
    <AnimatePresence>
      {session && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Eliminar sesión</p>
                  <p className="text-sm text-gray-500 mt-0.5">Esta acción no se puede deshacer.</p>
                </div>
                <button
                  onClick={onCancel}
                  className="ml-auto p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Session name */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-700">
                  Vas a eliminar la sesión <span className="font-bold">"{session.name}"</span>.
                  Todas las preguntas asociadas también se eliminarán.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold
                    hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Eliminando…
                    </>
                  ) : (
                    'Sí, eliminar'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Collapsible date group ───────────────────────────────────────────────────

function DateGroup({ dateLabel, sessions, onEdit, onDelete, onView }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 hover:text-gray-600 transition-colors"
      >
        <span
          className={`inline-block transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
        >
          ▼
        </span>
        {dateLabel}
        <span className="font-normal normal-case">({sessions.length})</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id || session.sessionId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.22 }}
                >
                  <SessionCard
                    session={session}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { socket } = useSocket()
  const toast = useToast()

  const [sessions, setSessions]             = useState([])
  const [isLoading, setIsLoading]           = useState(true)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [isDeleting, setIsDeleting]         = useState(false)

  // ── Load sessions on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.emit(SOCKET_EVENTS.SESSION_GET_ALL)

    const handleList = ({ sessions: list }) => {
      setSessions(Array.isArray(list) ? list : [])
      setIsLoading(false)
    }

    socket.on(SOCKET_EVENTS.SESSION_LIST, handleList)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_LIST, handleList)
    }
  }, [socket])

  // ── Delete listeners ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleDeleted = ({ sessionId }) => {
      setSessions((prev) => prev.filter((s) => (s.id || s.sessionId) !== sessionId))
      setSessionToDelete(null)
      setIsDeleting(false)
      toast.success('Sesión eliminada correctamente.')
    }

    const handleError = ({ message }) => {
      setIsDeleting(false)
      toast.error(message || 'Error al eliminar la sesión.')
    }

    socket.on(SOCKET_EVENTS.SESSION_DELETED, handleDeleted)
    socket.on(SOCKET_EVENTS.SESSION_ERROR, handleError)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_DELETED, handleDeleted)
      socket.off(SOCKET_EVENTS.SESSION_ERROR, handleError)
    }
  }, [socket, toast])

  // ── Handlers ───────────────────────────────────────────────────────────

  function handleNew() {
    navigate('/admin/sessions/new')
  }

  function handleEdit(session) {
    navigate(`/admin/sessions/${session.id || session.sessionId}`)
  }

  function handleView(session) {
    navigate(`/admin/sessions/${session.id || session.sessionId}/results`)
  }

  function handleDeleteRequest(session) {
    setSessionToDelete(session)
  }

  function handleDeleteConfirm() {
    if (!sessionToDelete || !socket) return

    const sessionId = sessionToDelete.id || sessionToDelete.sessionId
    setIsDeleting(true)

    // Optimistic UI: remove immediately
    setSessions((prev) => prev.filter((s) => (s.id || s.sessionId) !== sessionId))

    socket.emit(SOCKET_EVENTS.ADMIN_DELETE_SESSION, { sessionId })
  }

  function handleDeleteCancel() {
    if (!isDeleting) {
      setSessionToDelete(null)
    }
  }

  // ── Grouped sessions ───────────────────────────────────────────────────
  const grouped = groupSessionsByDate(sessions)
  const dateKeys = Object.keys(grouped)

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">The Training Hour</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tus sesiones de quiz</p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF441F] text-white text-sm font-bold
            hover:bg-[#CC3518] transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={15} />
          Nueva Sesión
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState onNew={handleNew} />
      ) : (
        <div className="flex flex-col gap-8">
          {dateKeys.map((dateLabel) => (
            <DateGroup
              key={dateLabel}
              dateLabel={dateLabel}
              sessions={grouped[dateLabel]}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Delete modal */}
      <DeleteModal
        session={sessionToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </div>
  )
}
