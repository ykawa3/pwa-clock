import { useState, useMemo } from 'react'
import { Box, Typography, Grid, Paper, IconButton } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import holidaysData from '@holiday-jp/holiday_jp'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const TOTAL_CELLS = 42 // 6行 × 7列で固定

export function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < TOTAL_CELLS) cells.push(null)
  return cells
}

export function getHolidaysForMonth(year: number, month: number): Map<number, string> {
  const holidays = new Map<number, string>()
  const allHolidays = holidaysData.between(
    new Date(year, month, 1),
    new Date(year, month + 1, 0)
  )
  for (const h of allHolidays) {
    const date = new Date(h.date)
    holidays.set(date.getDate(), h.name)
  }
  return holidays
}

export default function CalendarWidget() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const todayDate = today.getDate()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()

  const isCurrentMonth = year === todayYear && month === todayMonth

  const days = useMemo(() => buildCalendarDays(year, month), [year, month])
  const holidays = useMemo(() => getHolidaysForMonth(year, month), [year, month])

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
  }

  const goToToday = () => {
    setYear(todayYear)
    setMonth(todayMonth)
  }

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton size="small" onClick={goToPrevMonth} aria-label="前月">
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 500 }}>
            {year}年{month + 1}月
          </Typography>
          {!isCurrentMonth && (
            <IconButton size="small" onClick={goToToday} aria-label="今日">
              <TodayIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <IconButton size="small" onClick={goToNextMonth} aria-label="翌月">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Grid container columns={7} sx={{ mb: 0.5 }}>
        {WEEKDAYS.map((w, i) => (
          <Grid key={w} size={1}>
            <Typography
              align="center"
              variant="caption"
              sx={{
                color: i === 0 ? 'error.main' : i === 6 ? 'info.main' : 'text.secondary',
                fontWeight: 600,
                display: 'block',
              }}
            >
              {w}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Grid container columns={7}>
        {days.map((d, i) => {
          const isToday = isCurrentMonth && d === todayDate
          const col = i % 7
          const isHoliday = d !== null && holidays.has(d)
          const holidayName = d !== null ? holidays.get(d) : undefined
          const isSunday = col === 0
          const isSaturday = col === 6

          let color: string
          if (isSunday || isHoliday) {
            color = 'error.main'
          } else if (isSaturday) {
            color = 'info.main'
          } else {
            color = 'text.primary'
          }

          return (
            <Grid key={i} size={1}>
              <Box
                sx={{
                  textAlign: 'center',
                  mx: 'auto',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                  border: isHoliday && !isToday ? '2px solid' : 'none',
                  borderColor: isHoliday && !isToday ? 'error.main' : 'transparent',
                  cursor: holidayName ? 'help' : 'default',
                }}
                title={holidayName || undefined}
              >
                {d && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: isToday ? '#fff' : color,
                      fontWeight: isToday || isHoliday ? 700 : 400,
                      lineHeight: 1,
                      fontSize: '0.8rem',
                    }}
                  >
                    {d}
                  </Typography>
                )}
              </Box>
            </Grid>
          )
        })}
      </Grid>
    </Paper>
  )
}
