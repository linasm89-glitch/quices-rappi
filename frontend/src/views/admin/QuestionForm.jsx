import React, { useRef, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, AlertCircle, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const OPTION_IDS    = ['a', 'b', 'c', 'd']
const MIN_OPTIONS   = 2
const MAX_OPTIONS   = 4

// ─── Auto-resize textarea ────────────────────────────────────────────────────

function AutoTextarea({ value, onChange, placeholder, className, required, minRows = 2 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={minRows}
      className={`resize-none overflow-hidden ${className}`}
    />
  )
}

// ─── QuestionForm ─────────────────────────────────────────────────────────────

/**
 * @param {{
 *   question: object,
 *   index: number,
 *   onChange: (updated: object) => void,
 *   onDelete: () => void,
 *   isExpanded: boolean,
 *   onToggle: () => void,
 * }} props
 */
export default function QuestionForm({
  question,
  index,
  onChange,
  onDelete,
  isExpanded,
  onToggle,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const titlePreview = question.title?.trim()
    ? question.title.trim().slice(0, 80) + (question.title.trim().length > 80 ? '…' : '')
    : `Pregunta ${index + 1} (sin título)`

  // Validation: check for missing fields (used for visual cues only)
  const hasErrors = !question.title?.trim()
    || question.options.some((o) => !o.text?.trim())
    || !question.correctOptionId

  function updateTitle(e) {
    onChange({ ...question, title: e.target.value })
  }

  function updateOptionText(optId, text) {
    const newOptions = question.options.map((o) =>
      o.id === optId ? { ...o, text } : o
    )
    onChange({ ...question, options: newOptions })
  }

  function addOption() {
    const nextId = OPTION_IDS[question.options.length]
    onChange({ ...question, options: [...question.options, { id: nextId, text: '' }] })
  }

  function removeOption(optId) {
    const newOptions = question.options.filter((o) => o.id !== optId)
    const newCorrectId = question.correctOptionId === optId ? '' : question.correctOptionId
    onChange({ ...question, options: newOptions, correctOptionId: newCorrectId })
  }

  function setCorrect(optId) {
    onChange({ ...question, correctOptionId: optId })
  }

  function updateFeedback(e) {
    onChange({ ...question, feedback: e.target.value })
  }

  function handleDeleteConfirm() {
    if (confirmDelete) {
      onDelete()
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div
      className={`rounded-xl border transition-colors duration-150 ${
        isExpanded ? 'border-[#FF441F]/30 bg-white shadow-sm' : 'border-gray-100 bg-white'
      }`}
    >
      {/* ── Collapsed header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Question number */}
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>

        {/* Title preview (clickable to toggle) */}
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left text-sm font-medium text-gray-800 truncate hover:text-gray-900 transition-colors"
        >
          {titlePreview}
        </button>

        {/* Error indicator */}
        {hasErrors && !isExpanded && (
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0" title="Hay campos incompletos" />
        )}

        {/* Expand/collapse */}
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label={isExpanded ? 'Contraer pregunta' : 'Expandir pregunta'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDeleteConfirm}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            confirmDelete
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
          aria-label={confirmDelete ? 'Confirmar eliminación' : 'Eliminar pregunta'}
          title={confirmDelete ? 'Haz clic de nuevo para confirmar' : 'Eliminar pregunta'}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* ── Expanded form ────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 flex flex-col gap-5 border-t border-gray-100 pt-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Enunciado de la pregunta <span className="text-red-500">*</span>
                </label>
                <AutoTextarea
                  value={question.title}
                  onChange={updateTitle}
                  placeholder="Escribe aquí la pregunta…"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                    focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40 focus:border-[#FF441F]
                    placeholder-gray-400 transition-colors"
                />
                {!question.title?.trim() && (
                  <p className="text-xs text-red-500 mt-1">El enunciado es obligatorio.</p>
                )}
              </div>

              {/* Options */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Opciones de respuesta <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {question.options.map((option, i) => {
                    const isCorrect = question.correctOptionId === option.id
                    const canRemove = question.options.length > MIN_OPTIONS

                    return (
                      <div key={option.id} className="flex items-center gap-2">
                        {/* Correct answer radio button */}
                        <button
                          type="button"
                          onClick={() => setCorrect(option.id)}
                          title={`Marcar ${OPTION_LABELS[i]} como correcta`}
                          className={`flex-shrink-0 w-7 h-7 rounded-lg text-xs font-bold transition-all duration-150 border-2
                            ${isCorrect
                              ? 'bg-[#FF441F] border-[#FF441F] text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-[#FF441F]/50 hover:text-[#FF441F]'
                            }`}
                        >
                          {OPTION_LABELS[i]}
                        </button>

                        {/* Option text input */}
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOptionText(option.id, e.target.value)}
                          placeholder={`Opción ${OPTION_LABELS[i]}`}
                          className={`flex-1 rounded-xl border px-3 py-2 text-sm text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40 focus:border-[#FF441F]
                            placeholder-gray-400 transition-colors
                            ${isCorrect
                              ? 'border-[#FF441F]/40 bg-orange-50/50'
                              : 'border-gray-200 bg-white'
                            }`}
                        />

                        {/* Remove option button */}
                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => removeOption(option.id)}
                            title={`Eliminar opción ${OPTION_LABELS[i]}`}
                            className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50
                              transition-colors flex items-center justify-center border border-transparent hover:border-red-200"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Add option button */}
                  {question.options.length < MAX_OPTIONS && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-1 self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        text-gray-500 border border-dashed border-gray-300 hover:border-[#FF441F]/50 hover:text-[#FF441F]
                        transition-colors"
                    >
                      <Plus size={13} />
                      Agregar opción
                    </button>
                  )}
                </div>

                {/* Validation hints */}
                {question.options.some((o) => !o.text?.trim()) && (
                  <p className="text-xs text-red-500 mt-1.5">Todas las opciones son obligatorias.</p>
                )}
                {!question.correctOptionId && (
                  <p className="text-xs text-amber-600 mt-1">
                    Selecciona la respuesta correcta haciendo clic en {OPTION_LABELS.slice(0, question.options.length).join(', ')}.
                  </p>
                )}
              </div>

              {/* Feedback / explanation */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Retroalimentación <span className="text-gray-400 font-normal normal-case">(opcional, pero recomendada)</span>
                </label>
                <AutoTextarea
                  value={question.feedback}
                  onChange={updateFeedback}
                  placeholder="Explica por qué la respuesta es correcta…"
                  minRows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900
                    focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40 focus:border-[#FF441F]
                    placeholder-gray-400 transition-colors"
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
