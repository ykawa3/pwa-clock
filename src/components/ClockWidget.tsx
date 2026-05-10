import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useSettings } from '../context/SettingsContext'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function formatTime(date: Date, show24Hour: boolean, showSeconds: boolean): string {
  if (show24Hour) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`
  } else {
    const raw = date.getHours()
    const period = raw < 12 ? 'AM' : 'PM'
    const h = raw % 12 || 12
    const hh = String(h).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return showSeconds ? `${period} ${hh}:${mm}:${ss}` : `${period} ${hh}:${mm}`
  }
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const w = WEEKDAYS[date.getDay()]
  return `${y}年${m}月${d}日（${w}）`
}

export default function ClockWidget() {
  const { settings } = useSettings()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Box sx={{ textAlign: 'center', userSelect: 'none' }}>
      <Typography
        variant="h1"
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontWeight: 300,
          fontSize: { xs: '15vw', sm: '12vw', md: '9vw' },
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'primary.light',
        }}
      >
        {formatTime(now, settings.show24Hour, settings.showSeconds)}
      </Typography>

      <Typography variant="h5" sx={{ mt: 1, color: 'text.secondary', fontWeight: 300 }}>
        {formatDate(now)}
      </Typography>
    </Box>
  )
}
