import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import CloudIcon from '@mui/icons-material/Cloud'
import ThunderstormIcon from '@mui/icons-material/Thunderstorm'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import GrainIcon from '@mui/icons-material/Grain'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import EditLocationIcon from '@mui/icons-material/EditLocation'
import { useSettings } from '../context/SettingsContext'
import { useNavigate } from 'react-router-dom'

interface WeatherData {
  temp: number
  description: string
  icon: string
  city: string
  humidity: number
  feelsLike: number
  todayTempMax: number
  todayTempMin: number
}

interface DailyForecast {
  date: string
  tempMin: number
  tempMax: number
  icon: string
  description: string
}

interface LocationData {
  lat: number
  lon: number
  name: string
}

// よく使われる日本の都市
const PRESET_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: '東京', lat: 35.6762, lon: 139.6503 },
  { name: '大阪', lat: 34.6937, lon: 135.5023 },
  { name: '名古屋', lat: 35.1815, lon: 136.9066 },
  { name: '札幌', lat: 43.0618, lon: 141.3545 },
  { name: '福岡', lat: 33.5904, lon: 130.4017 },
  { name: '仙台', lat: 38.2682, lon: 140.8694 },
  { name: '広島', lat: 34.3853, lon: 132.4553 },
  { name: '京都', lat: 35.0116, lon: 135.7681 },
  { name: '横浜', lat: 35.4437, lon: 139.638 },
  { name: '神戸', lat: 34.6901, lon: 135.1956 },
  { name: '那覇', lat: 26.2124, lon: 127.6809 },
  { name: 'さいたま', lat: 35.8617, lon: 139.6455 },
]

function WeatherIcon({ icon, size = 48 }: { icon: string; size?: number }) {
  if (icon.startsWith('01')) return <WbSunnyIcon sx={{ fontSize: size, color: 'warning.main' }} />
  if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04'))
    return <CloudIcon sx={{ fontSize: size, color: 'text.secondary' }} />
  if (icon.startsWith('09') || icon.startsWith('10'))
    return <GrainIcon sx={{ fontSize: size, color: 'info.main' }} />
  if (icon.startsWith('11'))
    return <ThunderstormIcon sx={{ fontSize: size, color: 'warning.dark' }} />
  if (icon.startsWith('13'))
    return <AcUnitIcon sx={{ fontSize: size, color: 'info.light' }} />
  return <CloudIcon sx={{ fontSize: size, color: 'text.secondary' }} />
}

const UPDATE_INTERVAL = 30 * 60 * 1000
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const LOCATION_STORAGE_KEY = 'weather_location'

function groupForecastByDay(list: any[]): DailyForecast[] {
  const dayMap: Record<string, { temps: number[]; icons: string[]; descriptions: string[] }> = {}

  for (const item of list) {
    const dt = new Date(item.dt * 1000)
    const dateKey = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`

    if (!dayMap[dateKey]) {
      dayMap[dateKey] = { temps: [], icons: [], descriptions: [] }
    }
    dayMap[dateKey].temps.push(item.main.temp)
    dayMap[dateKey].icons.push(item.weather[0].icon)
    dayMap[dateKey].descriptions.push(item.weather[0].description)
  }

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const result: DailyForecast[] = []
  for (const [key, value] of Object.entries(dayMap)) {
    if (key === todayKey) continue

    const parts = key.split('-').map(Number)
    const dt = new Date(parts[0], parts[1], parts[2])
    const weekday = WEEKDAYS[dt.getDay()]
    const dateLabel = `${dt.getMonth() + 1}/${dt.getDate()} (${weekday})`

    const iconCounts: Record<string, number> = {}
    for (const ic of value.icons) {
      const base = ic.replace(/[dn]$/, '')
      iconCounts[base] = (iconCounts[base] || 0) + 1
    }
    const mostFrequentIcon = Object.entries(iconCounts).sort((a, b) => b[1] - a[1])[0][0] + 'd'

    const descCounts: Record<string, number> = {}
    for (const d of value.descriptions) {
      descCounts[d] = (descCounts[d] || 0) + 1
    }
    const mostFrequentDesc = Object.entries(descCounts).sort((a, b) => b[1] - a[1])[0][0]

    result.push({
      date: dateLabel,
      tempMin: Math.round(Math.min(...value.temps)),
      tempMax: Math.round(Math.max(...value.temps)),
      icon: mostFrequentIcon,
      description: mostFrequentDesc,
    })
  }

  return result.slice(0, 5)
}

function getTodayMinMax(list: any[]): { tempMax: number; tempMin: number } | null {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const temps = list
    .filter(item => {
      const dt = new Date(item.dt * 1000)
      return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}` === todayKey
    })
    .map(item => item.main.temp)
  if (temps.length === 0) return null
  return {
    tempMax: Math.round(Math.max(...temps)),
    tempMin: Math.round(Math.min(...temps)),
  }
}

function loadSavedLocation(): LocationData | null {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return null
}

function saveLocation(location: LocationData) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
}

export default function WeatherWidget() {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<DailyForecast[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationData | null>(loadSavedLocation)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationData[]>([])
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState(false)

  const fetchWeatherByCoords = useCallback(
    async (lat: number, lon: number) => {
      if (!settings.weatherApiKey) return

      setLoading(true)
      setError(null)
      try {
        // 現在天気を取得
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${settings.weatherApiKey}&units=metric&lang=ja`
        const weatherRes = await fetch(weatherUrl)
        if (!weatherRes.ok) {
          if (weatherRes.status === 401)
            throw new Error('APIキーが無効です。発行直後は有効化まで最大2時間かかります')
          throw new Error(`天気の取得に失敗しました (${weatherRes.status})`)
        }
        const weatherData = await weatherRes.json()
        const currentTemp = Math.round(weatherData.main.temp)
        setWeather({
          temp: currentTemp,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          city: weatherData.name,
          humidity: weatherData.main.humidity,
          feelsLike: Math.round(weatherData.main.feels_like),
          todayTempMax: currentTemp,
          todayTempMin: currentTemp,
        })

        // 予報を取得
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${settings.weatherApiKey}&units=metric&lang=ja`
        const forecastRes = await fetch(forecastUrl)
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json()
          const daily = groupForecastByDay(forecastData.list)
          setForecast(daily)
          const todayMM = getTodayMinMax(forecastData.list)
          if (todayMM) {
            setWeather(prev => prev ? { ...prev, ...todayMM } : prev)
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '天気の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    },
    [settings.weatherApiKey]
  )

  const fetchWeather = useCallback(async () => {
    if (!settings.weatherApiKey || !navigator.onLine) return

    // 保存済みの位置がある場合はそれを使う
    if (location) {
      await fetchWeatherByCoords(location.lat, location.lon)
      return
    }

    // 位置情報を取得
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude: lat, longitude: lon } = pos.coords
      setGeoError(false)
      await fetchWeatherByCoords(lat, lon)
    } catch (e) {
      setGeoError(true)
      if (e && typeof e === 'object' && 'code' in e) {
        const code = (e as GeolocationPositionError).code
        if (code === 1)
          setError('位置情報へのアクセスが拒否されました。下のボタンから地域を選択してください')
        else if (code === 3) setError('位置情報の取得がタイムアウトしました。下のボタンから地域を選択してください')
        else setError('位置情報を取得できませんでした。下のボタンから地域を選択してください')
      } else {
        setError('位置情報を取得できませんでした。下のボタンから地域を選択してください')
      }
    }
  }, [settings.weatherApiKey, location, fetchWeatherByCoords])

  useEffect(() => {
    fetchWeather()
    const id = setInterval(fetchWeather, UPDATE_INTERVAL)
    return () => clearInterval(id)
  }, [fetchWeather])

  const handleSelectCity = (city: LocationData) => {
    setLocation(city)
    saveLocation(city)
    setLocationDialogOpen(false)
    setGeoError(false)
    setError(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSearchCity = async () => {
    if (!searchQuery.trim() || !settings.weatherApiKey) return

    setSearching(true)
    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${settings.weatherApiKey}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const results: LocationData[] = data.map((item: any) => ({
          lat: item.lat,
          lon: item.lon,
          name: item.local_names?.ja || item.name + (item.state ? `, ${item.state}` : '') + `, ${item.country}`,
        }))
        setSearchResults(results)
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  const handleUseGPS = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude: lat, longitude: lon } = pos.coords
      // GPS位置を使う場合は保存位置をクリア
      setLocation(null)
      localStorage.removeItem(LOCATION_STORAGE_KEY)
      setGeoError(false)
      setError(null)
      setLocationDialogOpen(false)
      await fetchWeatherByCoords(lat, lon)
    } catch {
      setError('位置情報を取得できませんでした')
    }
  }

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
    <>
      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        {loading && !weather && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && !weather && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
            {geoError && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<LocationOnIcon />}
                onClick={() => setLocationDialogOpen(true)}
              >
                地域を選択
              </Button>
            )}
          </Box>
        )}

        {weather && (
          <>
            {/* 現在の天気 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WeatherIcon icon={weather.icon} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 300, lineHeight: 1 }}>
                  {weather.temp}°C
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {weather.city} · {weather.description}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  体感 {weather.feelsLike}°C · 湿度 {weather.humidity}%
                </Typography>
                <Typography variant="caption">
                  <Box component="span" sx={{ color: 'error.main' }}>↑{weather.todayTempMax}°</Box>
                  {' '}
                  <Box component="span" sx={{ color: 'info.main' }}>↓{weather.todayTempMin}°</Box>
                </Typography>
              </Box>
              <Button
                size="small"
                sx={{ minWidth: 'auto', p: 0.5 }}
                onClick={() => setLocationDialogOpen(true)}
                title="地域を変更"
              >
                <EditLocationIcon fontSize="small" />
              </Button>
            </Box>

            {/* 数日間の予報 */}
            {forecast.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  今後の天気予報
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    pb: 0.5,
                  }}
                >
                  {forecast.map((day) => (
                    <Box
                      key={day.date}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 72,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {day.date}
                      </Typography>
                      <WeatherIcon icon={day.icon} size={28} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.65rem' }}
                      >
                        {day.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                          {day.tempMax}°
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'info.main' }}>
                          {day.tempMin}°
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* 地域選択ダイアログ */}
      <Dialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>地域を選択</DialogTitle>
        <DialogContent>
          {/* GPS ボタン */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LocationOnIcon />}
            onClick={handleUseGPS}
            sx={{ mb: 2 }}
          >
            現在地を使用 (GPS)
          </Button>

          {/* 検索 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="都市名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchCity()
              }}
            />
            <Button variant="contained" size="small" onClick={handleSearchCity} disabled={searching}>
              {searching ? <CircularProgress size={20} /> : '検索'}
            </Button>
          </Box>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                検索結果
              </Typography>
              <List dense>
                {searchResults.map((result, idx) => (
                  <ListItemButton key={idx} onClick={() => handleSelectCity(result)}>
                    <ListItemText primary={result.name} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}

          {/* プリセット都市 */}
          <Typography variant="caption" color="text.secondary">
            主要都市
          </Typography>
          <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
            {PRESET_CITIES.map((city) => (
              <ListItemButton
                key={city.name}
                onClick={() => handleSelectCity({ lat: city.lat, lon: city.lon, name: city.name })}
                selected={location?.name === city.name}
              >
                <ListItemText primary={city.name} />
              </ListItemButton>
            ))}
          </List>

          {location && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              現在の設定: {location.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}