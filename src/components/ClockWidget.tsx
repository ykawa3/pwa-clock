import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import { useSettings } from '../context/SettingsContext'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatTime(date: Date, show24Hour: boolean, showSeconds: boolean): string {
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

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const w = WEEKDAYS[date.getDay()]
  return `${y}年${m}月${d}日（${w}）`
}

export default function ClockWidget() {
  const { settings } = useSettings()
  const [now, setNow] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  return (
    <Box sx={{ textAlign: 'center', userSelect: 'none', position: 'relative' }}>
      <Tooltip title={isFullscreen ? 'フルスクリーン終了' : 'フルスクリーン'}>
        <IconButton
          onClick={toggleFullscreen}
          size="small"
          sx={{ position: 'absolute', top: 0, right: 0, opacity: 0.5 }}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Tooltip>

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
