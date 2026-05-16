import { useState, useEffect, useCallback } from 'react'
import { Box, IconButton, Tooltip, Paper, Typography } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import EditIcon from '@mui/icons-material/Edit'
import DoneIcon from '@mui/icons-material/Done'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import BedtimeOffIcon from '@mui/icons-material/BedtimeOff'
import BedtimeIcon from '@mui/icons-material/Bedtime'
import Battery0BarIcon from '@mui/icons-material/Battery0Bar'
import Battery1BarIcon from '@mui/icons-material/Battery1Bar'
import Battery2BarIcon from '@mui/icons-material/Battery2Bar'
import Battery3BarIcon from '@mui/icons-material/Battery3Bar'
import Battery4BarIcon from '@mui/icons-material/Battery4Bar'
import Battery5BarIcon from '@mui/icons-material/Battery5Bar'
import Battery6BarIcon from '@mui/icons-material/Battery6Bar'
import BatteryFullIcon from '@mui/icons-material/BatteryFull'
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20'
import BatteryCharging30Icon from '@mui/icons-material/BatteryCharging30'
import BatteryCharging50Icon from '@mui/icons-material/BatteryCharging50'
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60'
import BatteryCharging80Icon from '@mui/icons-material/BatteryCharging80'
import BatteryCharging90Icon from '@mui/icons-material/BatteryCharging90'
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useWakeLock } from '../hooks/useWakeLock'
import { useBatteryStatus } from '../hooks/useBatteryStatus'
import ClockWidget from '../components/ClockWidget'
import CalendarWidget from '../components/CalendarWidget'
import WeatherWidget from '../components/WeatherWidget'

const LAYOUT_STORAGE_KEY = 'dashboard_widget_layout_v2'

type SlotPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface WidgetConfig {
  id: string
  label: string
  slot: SlotPosition
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'clock', label: '時計', slot: 'top-center' },
  { id: 'calendar', label: 'カレンダー', slot: 'bottom-left' },
  { id: 'weather', label: '天気', slot: 'bottom-right' },
]

const ALL_SLOTS: SlotPosition[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

const SLOT_LABELS: Record<SlotPosition, string> = {
  'top-left': '左上',
  'top-center': '中央上',
  'top-right': '右上',
  'middle-left': '左中',
  'middle-center': '中央',
  'middle-right': '右中',
  'bottom-left': '左下',
  'bottom-center': '中央下',
  'bottom-right': '右下',
}

function loadLayout(): WidgetConfig[] {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const ids = parsed.map((w: WidgetConfig) => w.id)
      if (DEFAULT_LAYOUT.every((d) => ids.includes(d.id))) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_LAYOUT
}

function saveLayout(layout: WidgetConfig[]) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
}

function useIsLandscape() {
  const [landscape, setLandscape] = useState(window.matchMedia('(orientation: landscape)').matches)
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

function WidgetRenderer({ id }: { id: string }) {
  switch (id) {
    case 'clock':
      return <ClockWidget />
    case 'calendar':
      return <CalendarWidget />
    case 'weather':
      return <WeatherWidget />
    default:
      return null
  }
}

type Row = 'top' | 'middle' | 'bottom'
type Col = 'left' | 'center' | 'right'

function BatteryStatusIcon({ level, charging }: { level: number; charging: boolean }) {
  const pct = Math.round(level * 100)
  const color = level <= 0.1 ? 'error' : level <= 0.2 ? 'warning' : 'inherit'
  const props = { color, fontSize: 'small' } as const
  if (charging) {
    if (pct <= 20) return <BatteryCharging20Icon {...props} />
    if (pct <= 30) return <BatteryCharging30Icon {...props} />
    if (pct <= 50) return <BatteryCharging50Icon {...props} />
    if (pct <= 60) return <BatteryCharging60Icon {...props} />
    if (pct <= 80) return <BatteryCharging80Icon {...props} />
    if (pct <= 90) return <BatteryCharging90Icon {...props} />
    return <BatteryChargingFullIcon {...props} />
  }
  if (pct <= 12) return <Battery0BarIcon {...props} />
  if (pct <= 25) return <Battery1BarIcon {...props} />
  if (pct <= 37) return <Battery2BarIcon {...props} />
  if (pct <= 50) return <Battery3BarIcon {...props} />
  if (pct <= 62) return <Battery4BarIcon {...props} />
  if (pct <= 75) return <Battery5BarIcon {...props} />
  if (pct <= 87) return <Battery6BarIcon {...props} />
  return <BatteryFullIcon {...props} />
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings, updateSetting } = useSettings()
  const isLandscape = useIsLandscape()
  useWakeLock(settings.keepAwake)
  const battery = useBatteryStatus()
  const isOnline = useIsOnline()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<WidgetConfig[]>(loadLayout)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
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

  const isWidgetVisible = (id: string) => {
    if (id === 'calendar') return settings.showCalendar && isOnline
    if (id === 'weather') return settings.showWeather && isOnline
    return true
  }

  const visibleWidgets = layout.filter((w) => isWidgetVisible(w.id))

  const getWidgetInSlot = (slot: SlotPosition) => {
    return visibleWidgets.find((w) => w.slot === slot)
  }

  const moveWidgetToSlot = useCallback((sourceId: string, targetSlot: SlotPosition) => {
    setLayout((prev) => {
      const existingInTarget = prev.find((w) => w.slot === targetSlot)
      const source = prev.find((w) => w.id === sourceId)
      if (!source || source.slot === targetSlot) return prev

      const sourceSlot = source.slot
      const newLayout = prev.map((w) => {
        if (w.id === sourceId) return { ...w, slot: targetSlot }
        if (existingInTarget && w.id === existingInTarget.id) return { ...w, slot: sourceSlot }
        return w
      })
      saveLayout(newLayout)
      return newLayout
    })
  }, [])

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId)
    setSelectedWidget(null)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', widgetId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnSlot = (e: React.DragEvent, targetSlot: SlotPosition) => {
    e.preventDefault()
    if (draggedWidget) moveWidgetToSlot(draggedWidget, targetSlot)
    setDraggedWidget(null)
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  const handleSlotTap = (slot: SlotPosition) => {
    const widget = getWidgetInSlot(slot)
    if (selectedWidget) {
      if (widget?.id === selectedWidget) {
        // 同じウィジェットを再タップ → 選択解除
        setSelectedWidget(null)
      } else {
        // 別スロットをタップ → 移動
        moveWidgetToSlot(selectedWidget, slot)
        setSelectedWidget(null)
      }
    } else if (widget) {
      // ウィジェットをタップ → 選択
      setSelectedWidget(widget.id)
    }
  }

  // 通常表示（横向き）: 行ごとに表示し、各行内では左右に詰める
  const renderCompactLandscape = () => {
    const rowOrder: Row[] = ['top', 'middle', 'bottom']
    const colOrder: Col[] = ['left', 'center', 'right']

    // 各行に属するウィジェットを列順で収集
    const rowWidgets: Record<Row, WidgetConfig[]> = {
      top: [],
      middle: [],
      bottom: [],
    }
    for (const row of rowOrder) {
      for (const col of colOrder) {
        const slot = `${row}-${col}` as SlotPosition
        const widget = getWidgetInSlot(slot)
        if (widget) {
          rowWidgets[row].push(widget)
        }
      }
    }

    // 使用中の行だけ表示
    const activeRows = rowOrder.filter((row) => rowWidgets[row].length > 0)

    if (activeRows.length === 0) return null

    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 2,
          px: 2,
          pb: 2,
        }}
      >
        {activeRows.map((row) => {
          const widgets = rowWidgets[row]
          return (
            <Box
              key={row}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {widgets.map((widget) => (
                <Box key={widget.id}>
                  <WidgetRenderer id={widget.id} />
                </Box>
              ))}
            </Box>
          )
        })}
      </Box>
    )
  }

  // 編集モード: 3x3グリッド全スロット表示
  const renderEditGrid = () => {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          gap: 1.5,
          px: 2,
          pb: 2,
        }}
      >
        {ALL_SLOTS.map((slot) => {
          const widget = getWidgetInSlot(slot)
          const isSelected = widget?.id === selectedWidget
          const isDragging = draggedWidget === widget?.id
          const isDropTarget = (draggedWidget || selectedWidget) && (!widget || (!isDragging && !isSelected))
          const isMoveTarget = selectedWidget && widget?.id !== selectedWidget

          return (
            <Box
              key={slot}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 80,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: isSelected
                  ? 'warning.main'
                  : isDropTarget
                    ? 'primary.main'
                    : 'divider',
                bgcolor: isSelected
                  ? 'rgba(255,193,7,0.08)'
                  : isMoveTarget
                    ? 'rgba(144,202,249,0.08)'
                    : widget
                      ? 'transparent'
                      : 'action.hover',
                p: 1,
                transition: 'all 0.2s',
                cursor: editMode ? 'pointer' : 'default',
              }}
              onClick={() => handleSlotTap(slot)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnSlot(e, slot)}
            >
              {widget ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    opacity: isDragging ? 0.4 : 1,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, widget.id)}
                  onDragEnd={handleDragEnd}
                >
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isSelected ? 'rgba(255,193,7,0.75)' : 'rgba(0,0,0,0.55)',
                      borderRadius: 2,
                      gap: 1,
                    }}
                  >
                    <DragIndicatorIcon sx={{ color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      {widget.label}
                    </Typography>
                  </Paper>
                  <Box sx={{ pointerEvents: 'none' }}>
                    <WidgetRenderer id={widget.id} />
                  </Box>
                </Box>
              ) : (
                <Typography variant="caption" color={isMoveTarget ? 'primary.light' : 'text.disabled'}>
                  {isMoveTarget ? 'ここに移動' : SLOT_LABELS[slot]}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
    )
  }

  // 縦向き通常表示: 行順で詰めて表示
  const renderCompactPortrait = () => {
    const rowOrder: SlotPosition[] = [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right',
    ]

    const orderedWidgets = rowOrder
      .map((slot) => getWidgetInSlot(slot))
      .filter(Boolean) as WidgetConfig[]

    return (
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
        {orderedWidgets.map((w) => (
          <Box key={w.id}>
            <WidgetRenderer id={w.id} />
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダーバー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        {/* バッテリー残量 */}
        {battery.level !== null ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.5 }}>
            <BatteryStatusIcon level={battery.level} charging={battery.charging} />
            <Typography
              variant="caption"
              sx={{
                color: battery.level <= 0.1 ? 'error.main' : battery.level <= 0.2 ? 'warning.main' : 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(battery.level * 100)}%
            </Typography>
          </Box>
        ) : (
          <Box />
        )}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={editMode ? 'レイアウト編集を終了' : 'レイアウトを編集'}>
            <IconButton onClick={() => { setEditMode(!editMode); setSelectedWidget(null) }} color={editMode ? 'primary' : 'default'}>
              {editMode ? <DoneIcon /> : <EditIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={settings.keepAwake ? 'スリープ無効（タップで有効に）' : 'スリープ有効（タップで無効に）'}>
            <IconButton
              onClick={() => updateSetting('keepAwake', !settings.keepAwake)}
              color={settings.keepAwake ? 'primary' : 'default'}
            >
              {settings.keepAwake ? <BedtimeOffIcon /> : <BedtimeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'フルスクリーン終了' : 'フルスクリーン'}>
            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="設定">
            <IconButton onClick={() => navigate('/settings')}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 編集モードの説明 */}
      {editMode && (
        <Box sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {selectedWidget
              ? '移動先のスロットをタップ（同じウィジェットをタップで解除）'
              : 'タップで選択 → 移動先をタップ　またはドラッグ＆ドロップ'}
          </Typography>
        </Box>
      )}

      {/* メインコンテンツ */}
      {editMode
        ? renderEditGrid()
        : isLandscape
          ? renderCompactLandscape()
          : renderCompactPortrait()
      }
    </Box>
  )
}