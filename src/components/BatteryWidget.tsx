import { Box, Typography } from '@mui/material'
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
import { useBatteryStatus } from '../hooks/useBatteryStatus'
import { useSizeScale } from '../context/SizeScaleContext'

type IconColor = 'error' | 'warning' | 'primary'

function LargeBatteryIcon({
  level,
  charging,
  color,
  fontSize,
}: {
  level: number
  charging: boolean
  color: IconColor
  fontSize: object
}) {
  const props = { color, sx: { fontSize } } as const
  const pct = Math.round(level * 100)
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

export default function BatteryWidget() {
  const battery = useBatteryStatus()
  const scale = useSizeScale()

  if (battery.level === null) {
    return (
      <Box sx={{ textAlign: 'center', userSelect: 'none' }}>
        <Typography color="text.secondary">バッテリー非対応</Typography>
      </Box>
    )
  }

  const pct = Math.round(battery.level * 100)
  const color: IconColor = battery.level <= 0.1 ? 'error' : battery.level <= 0.2 ? 'warning' : 'primary'
  const textColor = battery.level <= 0.1 ? 'error.main' : battery.level <= 0.2 ? 'warning.main' : 'primary.light'

  return (
    <Box sx={{ textAlign: 'center', userSelect: 'none' }}>
      <LargeBatteryIcon
        level={battery.level}
        charging={battery.charging}
        color={color}
        fontSize={{ xs: `${20 * scale}vw`, sm: `${14 * scale}vw`, md: `${10 * scale}vw` }}
      />
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontWeight: 300,
          fontSize: { xs: `${14 * scale}vw`, sm: `${10 * scale}vw`, md: `${7 * scale}vw` },
          color: textColor,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {pct}%
      </Typography>
      {battery.charging && (
        <Typography variant="h6" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 300 }}>
          充電中
        </Typography>
      )}
    </Box>
  )
}
