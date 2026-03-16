import React from 'react'
import { motion } from 'framer-motion'

/**
 * QuestionBarChart — pure CSS/Tailwind horizontal bar chart.
 *
 * @param {{ stats: Array<{ label: string, value: number, color: string, isCorrect: boolean }>, title?: string }} props
 */
export default function QuestionBarChart({ stats = [], title }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </p>
      )}
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* Label badge */}
          <span
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              stat.isCorrect
                ? 'bg-[#FF441F] text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {stat.label}
          </span>

          {/* Bar track */}
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, stat.value))}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
              className="h-full rounded-full"
              style={{
                backgroundColor: stat.isCorrect ? '#FF441F' : (stat.color || '#D1D5DB'),
              }}
            />
          </div>

          {/* Percentage */}
          <span
            className={`w-10 text-right text-xs font-semibold flex-shrink-0 ${
              stat.isCorrect ? 'text-[#FF441F]' : 'text-gray-500'
            }`}
          >
            {stat.value}%
          </span>
        </div>
      ))}
    </div>
  )
}
