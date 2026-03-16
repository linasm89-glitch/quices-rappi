import React, { useState } from 'react'
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * ExportButton — triggers Excel export download for a session.
 *
 * @param {{ sessionId: string, disabled?: boolean }} props
 */
export default function ExportButton({ sessionId, disabled = false }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const handleClick = async () => {
    if (status === 'loading' || disabled) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      const url = `${backendUrl}/api/sessions/${sessionId}/export`

      const response = await fetch(url)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Error ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      // Trigger browser download
      const anchor = document.createElement('a')
      anchor.href = objectUrl

      // Try to get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/)
      anchor.download = match ? match[1] : `training-hour-${sessionId}.xlsx`

      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(objectUrl)

      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      console.error('[ExportButton] export error:', err)
      setErrorMsg(err.message || 'Error al exportar')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  // ── Button content by status ────────────────────────────────────────────
  const isDisabled = disabled || status === 'loading'

  let icon
  let label
  let colorClass

  if (status === 'loading') {
    icon = <Loader2 size={15} className="animate-spin" />
    label = 'Exportando…'
    colorClass =
      'bg-[#FF441F] text-white opacity-75 cursor-not-allowed'
  } else if (status === 'success') {
    icon = <CheckCircle2 size={15} />
    label = '¡Descargado!'
    colorClass = 'bg-green-500 text-white'
  } else if (status === 'error') {
    icon = <AlertCircle size={15} />
    label = errorMsg || 'Error'
    colorClass = 'bg-red-500 text-white'
  } else {
    icon = <Download size={15} />
    label = 'Exportar Excel'
    colorClass = disabled
      ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-60'
      : 'bg-[#FF441F] text-white hover:bg-[#CC3518] active:scale-95'
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={disabled ? 'La sesión aún no ha finalizado' : 'Descargar resultados en Excel'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        transition-all duration-150 select-none shadow-sm ${colorClass}`}
    >
      {icon}
      {label}
      {status === 'idle' && !disabled && (
        <span className="text-xs font-normal opacity-80 ml-0.5">.xlsx</span>
      )}
    </button>
  )
}
