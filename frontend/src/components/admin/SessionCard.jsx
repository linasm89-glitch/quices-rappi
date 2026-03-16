import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, HelpCircle, Edit2, Trash2, BarChart2 } from 'lucide-react'
import { formatDate } from '../../lib/formatters.js'

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        En vivo
      </span>
    )
  }

  if (status === 'ended') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
        Finalizada
      </span>
    )
  }

  // draft (default)
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      Borrador
    </span>
  )
}

// ─── SessionCard ──────────────────────────────────────────────────────────────

/**
 * @param {{ session: object, onEdit: function, onDelete: function, onView: function }} props
 */
export default function SessionCard({ session, onEdit, onDelete, onView }) {
  const questionCount = Array.isArray(session.questions) ? session.questions.length : 0
  const dateLabel = formatDate(session.date || session.createdAt)

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
    >
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-gray-900 leading-snug flex-1 min-w-0 truncate">
          {session.name}
        </h3>
        <StatusBadge status={session.status} />
      </div>

      {/* Meta row: date + question count */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-gray-400" />
          {dateLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-gray-400" />
          {questionCount} {questionCount === 1 ? 'pregunta' : 'preguntas'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <button
          onClick={() => onEdit(session)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Edit2 size={13} />
          Editar
        </button>

        <button
          onClick={() => onView(session)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <BarChart2 size={13} />
          Resultados
        </button>

        <button
          onClick={() => onDelete(session)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <Trash2 size={13} />
          Eliminar
        </button>
      </div>
    </motion.div>
  )
}
