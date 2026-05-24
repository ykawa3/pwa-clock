import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useSizeScale } from '../context/SizeScaleContext'
import { getHolidaysForMonth } from './CalendarWidget'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function DailyCalendarWidget() {
  const scale = useSizeScale()
  const [today, setToday] = useState(new Date())

  // Reschedule at exact midnight each day
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const scheduleNext = () => {
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(() => {
        setToday(new Date())
        scheduleNext()
      }, nextMidnight.getTime() - now.getTime())
    }
    scheduleNext()
    return () => clearTimeout(timer)
  }, [])

  const month = today.getMonth() + 1
  const day = today.getDate()
  const weekdayIndex = today.getDay()
  const weekday = WEEKDAYS[weekdayIndex]
  const holidayName = getHolidaysForMonth(today.getFullYear(), today.getMonth()).get(day) ?? null

  const isSunday = weekdayIndex === 0
  const isSaturday = weekdayIndex === 6
  const isHoliday = holidayName !== null
  const accent = isSunday || isHoliday ? 'error.main' : isSaturday ? 'info.main' : 'text.primary'

  return (
    <Box sx={{ textAlign: 'center', userSelect: 'none', lineHeight: 1 }}>
      <Typography sx={{
        color: 'text.secondary',
        fontSize: { xs: `${4 * scale}vw`, sm: `${3 * scale}vw`, md: `${2.5 * scale}vw` },
        mb: 0.5,
      }}>
        {today.getFullYear()}年{month}月
      </Typography>
      <Typography sx={{
        fontFamily: '"Roboto Mono", monospace',
        fontWeight: 300,
        fontSize: { xs: `${20 * scale}vw`, sm: `${15 * scale}vw`, md: `${11 * scale}vw` },
        lineHeight: 1,
        color: accent,
        letterSpacing: '-0.02em',
      }}>
        {day}
      </Typography>
      <Typography sx={{
        fontWeight: 500,
        fontSize: { xs: `${8 * scale}vw`, sm: `${6 * scale}vw`, md: `${4 * scale}vw` },
        color: accent,
        mt: 0.5,
      }}>
        {weekday}
      </Typography>
      {holidayName && (
        <Typography sx={{
          color: 'error.main',
          fontSize: { xs: `${3.5 * scale}vw`, sm: `${2.5 * scale}vw`, md: `${2 * scale}vw` },
          mt: 0.5,
        }}>
          {holidayName}
        </Typography>
      )}
    </Box>
  )
}
