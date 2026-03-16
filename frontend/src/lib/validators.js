/**
 * validators.js
 * Client-side validation utilities for The Training Hour.
 */

/**
 * Validates a Rappi email address.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRappiEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'El correo es obligatorio.' }
  }

  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'El correo es obligatorio.' }
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'El correo es demasiado largo.' }
  }

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@rappi\.com$/i
  if (!emailRegex.test(trimmed)) {
    if (!trimmed.includes('@')) {
      return { valid: false, error: 'Ingresa un correo válido (ej: nombre@rappi.com).' }
    }
    const [, domain] = trimmed.split('@')
    if (domain && domain !== 'rappi.com') {
      return { valid: false, error: 'Solo se permiten correos @rappi.com.' }
    }
    return { valid: false, error: 'Correo inválido. Usa tu correo corporativo @rappi.com.' }
  }

  return { valid: true }
}

/**
 * Validates a participant's display name.
 * @param {string} name
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'El nombre es obligatorio.' }
  }

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'El nombre es obligatorio.' }
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres.' }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'El nombre no puede superar los 50 caracteres.' }
  }

  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'\-\.]+$/
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'El nombre solo puede contener letras y espacios.' }
  }

  return { valid: true }
}

/**
 * Validates a quiz session object before creation.
 * @param {{ name: string, date?: string, questions?: Array }} session
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSession(session) {
  const errors = []

  if (!session || typeof session !== 'object') {
    return { valid: false, errors: ['Datos de sesión inválidos.'] }
  }

  // Validate name
  if (!session.name || typeof session.name !== 'string' || session.name.trim().length < 3) {
    errors.push('El nombre de la sesión debe tener al menos 3 caracteres.')
  } else if (session.name.trim().length > 100) {
    errors.push('El nombre de la sesión no puede superar los 100 caracteres.')
  }

  // Validate date (if provided)
  if (session.date) {
    const parsed = new Date(session.date)
    if (isNaN(parsed.getTime())) {
      errors.push('La fecha de la sesión es inválida.')
    }
  }

  // Validate questions (if provided)
  if (session.questions !== undefined) {
    if (!Array.isArray(session.questions)) {
      errors.push('Las preguntas deben ser un arreglo.')
    } else {
      session.questions.forEach((q, i) => {
        const qNum = i + 1

        if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
          errors.push(`Pregunta ${qNum}: el enunciado es obligatorio.`)
        }

        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`Pregunta ${qNum}: debe tener al menos 2 opciones.`)
        } else if (q.options.length > 4) {
          errors.push(`Pregunta ${qNum}: máximo 4 opciones permitidas.`)
        } else {
          q.options.forEach((opt, oi) => {
            if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
              errors.push(`Pregunta ${qNum}, opción ${oi + 1}: el texto es obligatorio.`)
            }
          })
        }

        if (
          q.correctIndex === undefined ||
          q.correctIndex === null ||
          typeof q.correctIndex !== 'number' ||
          q.correctIndex < 0 ||
          (q.options && q.correctIndex >= q.options.length)
        ) {
          errors.push(`Pregunta ${qNum}: la respuesta correcta no es válida.`)
        }

        if (q.timeSeconds !== undefined) {
          if (typeof q.timeSeconds !== 'number' || q.timeSeconds < 5 || q.timeSeconds > 120) {
            errors.push(`Pregunta ${qNum}: el tiempo debe estar entre 5 y 120 segundos.`)
          }
        }
      })
    }
  }

  return { valid: errors.length === 0, errors }
}
