import { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import CloudIcon from '@mui/icons-material/Cloud'
import ThunderstormIcon from '@mui/icons-material/Thunderstorm'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import GrainIcon from '@mui/icons-material/Grain'
import { useSettings } from '../context/SettingsContext'
import { useNavigate } from 'react-router-dom'

interface WeatherData {
  temp: number
  description: string
  icon: string
  city: string
  humidity: number
  feelsLike: number
}

function WeatherIcon({ icon }: { icon: string }) {
  if (icon.startsWith('01')) return <WbSunnyIcon sx={{ fontSize: 48, color: 'warning.main' }} />
  if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04'))
    return <CloudIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
  if (icon.startsWith('09') || icon.startsWith('10'))
    return <GrainIcon sx={{ fontSize: 48, color: 'info.main' }} />
  if (icon.startsWith('11'))
    return <ThunderstormIcon sx={{ fontSize: 48, color: 'warning.dark' }} />
  if (icon.startsWith('13'))
    return <AcUnitIcon sx={{ fontSize: 48, color: 'info.light' }} />
  return <CloudIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
}

const UPDATE_INTERVAL = 30 * 60 * 1000

export default function WeatherWidget() {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    if (!settings.weatherApiKey || !navigator.onLine) return

    setLoading(true)
    setError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude: lat, longitude: lon } = pos.coords
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${settings.weatherApiKey}&units=metric&lang=ja`
      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 401) throw new Error('APIキーが無効です。発行直後は有効化まで最大2時間かかります')
        throw new Error(`天気の取得に失敗しました (${res.status})`)
      }
      const data = await res.json()
      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        city: data.name,
        humidity: data.main.humidity,
        feelsLike: Math.round(data.main.feels_like),
      })
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e) {
        const code = (e as GeolocationPositionError).code
        if (code === 1) setError('位置情報へのアクセスが拒否されました。ブラウザの設定を確認してください')
        else if (code === 3) setError('位置情報の取得がタイムアウトしました')
        else setError('位置情報を取得できませんでした')
      } else {
        setError(e instanceof Error ? e.message : '天気の取得に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }, [settings.weatherApiKey])

  useEffect(() => {
    fetchWeather()
    const id = setInterval(fetchWeather, UPDATE_INTERVAL)
    return () => clearInterval(id)
  }, [fetchWeather])

  if (!settings.weatherApiKey) {
    return (
      <Paper elevation={2} sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          天気を表示するには API キーを設定してください
        </Typography>
        <Button size="small" variant="outlined" onClick={() => navigate('/settings')}>
          設定を開く
        </Button>
      </Paper>
    )
  }

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      {loading && !weather && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error" align="center">
          {error}
        </Typography>
      )}

      {weather && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WeatherIcon icon={weather.icon} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 300, lineHeight: 1 }}>
              {weather.temp}°C
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weather.city} · {weather.description}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              体感 {weather.feelsLike}°C · 湿度 {weather.humidity}%
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  )
}
