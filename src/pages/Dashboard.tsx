import { useState, useEffect } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import ClockWidget from '../components/ClockWidget'
import CalendarWidget from '../components/CalendarWidget'
import WeatherWidget from '../components/WeatherWidget'

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    window.matchMedia('(orientation: landscape)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent) => setLandscape(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return landscape
}

function useIsOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const isLandscape = useIsLandscape()
  const isOnline = useIsOnline()

  const showCalendar = settings.showCalendar && isOnline
  const showWeather = settings.showWeather && isOnline

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* 設定ボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <Tooltip title="設定">
          <IconButton onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* メインコンテンツ */}
      {isLandscape ? (
        // 横向き: 左に時計、右にカレンダー＆天気
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: showCalendar || showWeather ? '1fr 1fr' : '1fr',
            gap: 2,
            px: 2,
            pb: 2,
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClockWidget />
          </Box>
          {(showCalendar || showWeather) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {showCalendar && <CalendarWidget />}
              {showWeather && <WeatherWidget />}
            </Box>
          )}
        </Box>
      ) : (
        // 縦向き: 垂直スタック
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            px: 2,
            pb: 2,
            justifyContent: 'center',
          }}
        >
          <ClockWidget />
          {showCalendar && <CalendarWidget />}
          {showWeather && <WeatherWidget />}
        </Box>
      )}
    </Box>
  )
}
