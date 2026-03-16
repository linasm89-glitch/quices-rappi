import React from 'react'

/**
 * SVG circular countdown ring.
 * @param {{ secondsLeft: number, totalSeconds?: number, size?: number, strokeWidth?: number }} props
 */
export default function CountdownRing({ secondsLeft, totalSeconds = 20, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // progress goes from 0 (full ring) to 1 (empty ring)
  const progress = 1 - Math.max(0, Math.min(1, secondsLeft / totalSeconds))
  const dashOffset = circumference * progress

  let ringColor = '#22C55E' // green
  if (secondsLeft <= 5) {
    ringColor = '#EF4444' // red
  } else if (secondsLeft <= 10) {
    ringColor = '#FBBF24' // yellow
  }

  const textColor = secondsLeft === 0 ? '#EF4444' : ringColor
  const fontSize = size * 0.28

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${secondsLeft} segundos restantes`}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      {/* Countdown arc — starts at top (rotated -90deg) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
      />
      {/* Center number */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="800"
        fill={textColor}
        fontFamily="system-ui, sans-serif"
        style={{ transition: 'fill 0.3s ease' }}
      >
        {secondsLeft}
      </text>
    </svg>
  )
}
