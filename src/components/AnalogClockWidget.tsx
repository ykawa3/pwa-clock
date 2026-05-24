import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { useSettings } from '../context/SettingsContext'
import { useSizeScale } from '../context/SizeScaleContext'

const CX = 100
const CY = 100
const FACE_R = 88
const TEXT_R = 72

export default function AnalogClockWidget() {
  const { settings } = useSettings()
  const scale = useSizeScale()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const is24 = settings.show24Hour

  const secAngle  = s * 6
  const minAngle  = m * 6 + s * 0.1
  const hourAngle = is24
    ? h * 15 + m * 0.25
    : (h % 12) * 30 + m * 0.5

  const tickCount = is24 ? 24 : 12

  // Cardinal labels: top, right, bottom, left
  const cardinalLabels = is24
    ? ['0', '6', '12', '18']
    : ['12', '3', '6', '9']

  const hand = (angle: number, length: number, tailLen: number, color: string, width: number) => {
    const rad = (angle - 90) * (Math.PI / 180)
    const x2 = CX + Math.cos(rad) * length
    const y2 = CY + Math.sin(rad) * length
    const xTail = CX - Math.cos(rad) * tailLen
    const yTail = CY - Math.sin(rad) * tailLen
    return (
      <line
        x1={xTail} y1={yTail} x2={x2} y2={y2}
        stroke={color} strokeWidth={width} strokeLinecap="round"
      />
    )
  }

  return (
    <Box
      sx={{
        width: { xs: `${60 * scale}vw`, sm: `${40 * scale}vw`, md: `${28 * scale}vw` },
        mx: 'auto',
        userSelect: 'none',
      }}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        {/* Clock face */}
        <circle cx={CX} cy={CY} r={FACE_R} fill="none" stroke="#444" strokeWidth="2" />

        {/* Tick marks */}
        {Array.from({ length: tickCount }, (_, i) => {
          const angle = (i * 360 / tickCount - 90) * (Math.PI / 180)
          const isMajor = tickCount === 12 || i % 2 === 0
          const innerR = isMajor ? FACE_R - 10 : FACE_R - 5
          return (
            <line
              key={i}
              x1={CX + Math.cos(angle) * FACE_R}
              y1={CY + Math.sin(angle) * FACE_R}
              x2={CX + Math.cos(angle) * innerR}
              y2={CY + Math.sin(angle) * innerR}
              stroke={isMajor ? '#888' : '#555'}
              strokeWidth={isMajor ? 2 : 1}
            />
          )
        })}

        {/* Cardinal numbers */}
        {cardinalLabels.map((label, i) => {
          const angle = (i * 90 - 90) * (Math.PI / 180)
          return (
            <text
              key={label}
              x={CX + Math.cos(angle) * TEXT_R}
              y={CY + Math.sin(angle) * TEXT_R + 5}
              textAnchor="middle"
              fill="#aaa"
              fontSize="13"
              fontFamily="Roboto Mono, monospace"
            >
              {label}
            </text>
          )
        })}

        {/* Hands */}
        {hand(hourAngle, 52, 15, '#e0e0e0', 5)}
        {hand(minAngle,  68, 18, '#90caf9', 3)}
        {hand(secAngle,  74, 20, '#f44336', 1.5)}

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={5} fill="#90caf9" />
        <circle cx={CX} cy={CY} r={2} fill="#f44336" />
      </svg>
    </Box>
  )
}
