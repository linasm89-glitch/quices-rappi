import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Save, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { SOCKET_EVENTS } from '../../lib/constants.js'
import QuestionList from './QuestionList.jsx'

// ─── Blank question factory ───────────────────────────────────────────────────

function createBlankQuestion(order = 0) {
  return {
    id: uuidv4(),
    order,
    title: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
    ],
    correctOptionId: '',
    feedback: '',
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateSession(name, date, questions) {
  const errors = []

  if (!name || name.trim().length < 3) {
    errors.push('El nombre de la sesión debe tener al menos 3 caracteres.')
  }

  if (!date) {
    errors.push('La fecha es obligatoria.')
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const num = i + 1

    if (!q.title?.trim()) {
      errors.push(`Pregunta ${num}: el enunciado es obligatorio.`)
    }
    if (q.options.length < 2) {
      errors.push(`Pregunta ${num}: debe tener al menos 2 opciones.`)
    } else if (q.options.some((o) => !o.text?.trim())) {
      errors.push(`Pregunta ${num}: todas las opciones deben tener texto.`)
    }
    if (!q.correctOptionId) {
      errors.push(`Pregunta ${num}: debes seleccionar la respuesta correcta.`)
    }
  }

  return errors
}

// ─── SessionEditor ────────────────────────────────────────────────────────────

export default function SessionEditor() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const { socket } = useSocket()
  const toast = useToast()

  // Form state
  const [name, setName]           = useState('')
  const [date, setDate]           = useState('')
  const [questions, setQuestions] = useState([])

  // UI state
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving]   = useState(false)
  const [isDirty, setIsDirty]     = useState(false)
  const [validationErrors, setValidationErrors] = useState([])

  // ── Load existing session ──────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !socket) return

    socket.emit(SOCKET_EVENTS.ADMIN_GET_SESSION, { sessionId: id })

    const handleDetail = ({ session }) => {
      setName(session.name || '')
      setDate(session.date ? session.date.slice(0, 10) : '')
      setQuestions(
        Array.isArray(session.questions)
          ? session.questions.map((q) => ({
              id: q.id || uuidv4(),
              order: q.order ?? 0,
              title: q.title || '',
              options: Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4
                ? q.options
                : [
                    { id: 'a', text: '' },
                    { id: 'b', text: '' },
                  ],
              correctOptionId: q.correctOptionId || '',
              feedback: q.feedback || '',
            }))
          : []
      )
      setIsLoading(false)
      setIsDirty(false)
    }

    const handleError = ({ message }) => {
      toast.error(message || 'No se pudo cargar la sesión.')
      setIsLoading(false)
      navigate('/admin')
    }

    socket.on(SOCKET_EVENTS.SESSION_DETAIL, handleDetail)
    socket.on(SOCKET_EVENTS.SESSION_ERROR, handleError)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_DETAIL, handleDetail)
      socket.off(SOCKET_EVENTS.SESSION_ERROR, handleError)
    }
  }, [isEditMode, id, socket]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleSaved = ({ session }) => {
      setIsSaving(false)
      setIsDirty(false)
      toast.success(isEditMode ? 'Sesión actualizada correctamente.' : 'Sesión creada correctamente.')
      navigate('/admin')
    }

    const handleError = ({ message }) => {
      setIsSaving(false)
      toast.error(message || 'Error al guardar la sesión.')
    }

    socket.on(SOCKET_EVENTS.SESSION_SAVED, handleSaved)
    socket.on(SOCKET_EVENTS.SESSION_ERROR, handleError)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_SAVED, handleSaved)
      socket.off(SOCKET_EVENTS.SESSION_ERROR, handleError)
    }
  }, [socket, isEditMode, navigate, toast])

  // ── Track dirty state ──────────────────────────────────────────────────
  function markDirty() {
    if (!isDirty) setIsDirty(true)
  }

  function handleNameChange(e) {
    setName(e.target.value)
    markDirty()
  }

  function handleDateChange(e) {
    setDate(e.target.value)
    markDirty()
  }

  function handleQuestionsChange(updated) {
    setQuestions(updated)
    markDirty()
  }

  function handleAddQuestion() {
    const newQ = createBlankQuestion(questions.length)
    setQuestions((prev) => [...prev, newQ])
    markDirty()
  }

  // ── Cancel with unsaved warning ────────────────────────────────────────
  function handleCancel() {
    if (isDirty) {
      const confirmed = window.confirm(
        '¿Salir sin guardar? Los cambios no guardados se perderán.'
      )
      if (!confirmed) return
    }
    navigate('/admin')
  }

  // ── Save ───────────────────────────────────────────────────────────────
  function handleSave() {
    const errors = validateSession(name, date, questions)
    setValidationErrors(errors)

    if (errors.length > 0) {
      toast.error('Por favor, corrige los errores antes de guardar.')
      return
    }

    if (!socket) {
      toast.error('Sin conexión al servidor.')
      return
    }

    setIsSaving(true)

    const sessionPayload = {
      name: name.trim(),
      date,
      questions,
      ...(isEditMode ? { id } : {}),
    }

    socket.emit(SOCKET_EVENTS.ADMIN_SAVE_SESSION, { session: sessionPayload })
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="animate-spin text-[#FF441F]" />
        <p className="text-sm text-gray-500 font-medium">Cargando sesión…</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 pb-12"
    >
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {isEditMode ? 'Editar sesión' : 'Nueva sesión'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode ? 'Modifica los datos y preguntas de la sesión.' : 'Crea una sesión de quiz para tu equipo.'}
          </p>
        </div>
      </div>

      {/* ── Form card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">

        {/* Session name */}
        <div>
          <label htmlFor="session-name" className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Nombre de la sesión <span className="text-red-500">*</span>
          </label>
          <input
            id="session-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Ej. Capacitación Q2 — Producto"
            maxLength={120}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40 focus:border-[#FF441F]
              placeholder-gray-400 transition-colors"
          />
          {name.trim().length > 0 && name.trim().length < 3 && (
            <p className="text-xs text-red-500 mt-1">Mínimo 3 caracteres.</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="session-date" className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
            Fecha de la sesión <span className="text-red-500">*</span>
          </label>
          <input
            id="session-date"
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-full sm:w-56 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-[#FF441F]/40 focus:border-[#FF441F]
              transition-colors"
          />
        </div>
      </div>

      {/* ── Questions section ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Preguntas
            <span className="ml-2 text-sm font-normal text-gray-400">({questions.length})</span>
          </h2>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF441F] text-white text-sm font-semibold
              hover:bg-[#CC3518] active:bg-[#CC3518] transition-colors shadow-sm"
          >
            <Plus size={15} />
            Agregar Pregunta
          </button>
        </div>

        <QuestionList
          questions={questions}
          onChange={handleQuestionsChange}
        />
      </div>

      {/* ── Validation errors ──────────────────────────────────────────── */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
            Corrige los siguientes errores:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-1">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-600">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF441F] text-white text-sm font-bold
            hover:bg-[#CC3518] active:bg-[#CC3518] disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save size={15} />
              Guardar Sesión
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          Cancelar
        </button>

        {isDirty && (
          <span className="text-xs text-amber-600 font-medium ml-2">
            Cambios sin guardar
          </span>
        )}
      </div>
    </motion.div>
  )
}
