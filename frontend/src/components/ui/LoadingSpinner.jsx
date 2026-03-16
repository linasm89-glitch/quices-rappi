import React from 'react'
import { motion } from 'framer-motion'
import { RAPPI_ORANGE } from '../../lib/constants.js'

const SIZES = {
  sm: { outer: 24, stroke: 3 },
  md: { outer: 40, stroke: 4 },
  lg: { outer: 64, stroke: 5 },
}

/**
 * LoadingSpinner — Animated arc spinner in Rappi orange.
 * @param {{ size?: 'sm'|'md'|'lg', fullScreen?: boolean, label?: string }} props
 */
export default function LoadingSpinner({ size = 'md', fullScreen = false, label }) {
  const { outer, stroke } = SIZES[size] || SIZES.md
  const radius = (outer - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        fill="none"
        aria-label={label || 'Cargando...'}
        role="status"
      >
        {/* Track */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={stroke}
        />
        {/* Arc */}
        <motion.circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          stroke={RAPPI_ORANGE}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.1,
            ease: 'linear',
            repeat: Infinity,
          }}
          style={{ originX: '50%', originY: '50%' }}
        />
      </svg>

      {label && (
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
