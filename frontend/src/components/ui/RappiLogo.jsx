import React from 'react'

export default function RappiLogo({ size = 40, className = '' }) {
  return (
    <img
      src="/logo%20Rappi.png"
      alt="Rappi"
      style={{ height: '60px', width: 'auto' }}
      className={className}
      draggable={false}
    />
  )
}
