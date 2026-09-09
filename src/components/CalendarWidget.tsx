import { useState, useMemo } from 'react'
import { Box, Typography, Grid, Paper, IconButton } from '@mui/material'
import { useSizeScale } from '../context/SizeScaleContext'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TodayIcon from '@mui/icons-material/Today'
import holidaysData from '@holiday-jp/holiday_jp'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const TOTAL_CELLS = 42 // 6行 × 7列で固定

export interface CalendarDay {
  year: number
  month: number
  date: number
  isCurrentMonth: boolean
  isHidden?: boolean
}

export function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells: CalendarDay[] = []

  // 前月
  const prevYear = month === 0 ? year - 1 : year
  const prevMonth = month === 0 ? 11 : month - 1
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      year: prevYear,
      month: prevMonth,
      date: prevMonthDays - i,
      isCurrentMonth: false,
    })
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      year,
      month,
      date: d,
      isCurrentMonth: true,
    })
  }

  // 次月
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  let nextDate = 1
  while (cells.length < TOTAL_CELLS) {
    cells.push({
      year: nextYear,
      month: nextMonth,
      date: nextDate++,
      isCurrentMonth: false,
    })
  }

  // 最終週（第6週: インデックス35〜41）がすべて次月になる場合は isHidden = true とする
  if (cells[35] && !cells[35].isCurrentMonth) {
    for (let i = 35; i < 42; i++) {
      cells[i].isHidden = true
    }
  }

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
  const scale = useSizeScale()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const todayDate = today.getDate()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()

  const isCurrentMonth = year === todayYear && month === todayMonth

  const days = useMemo(() => buildCalendarDays(year, month), [year, month])
  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>()
    if (days.length === 0) return map
    const start = new Date(days[0].year, days[0].month, days[0].date)
    const end = new Date(days[days.length - 1].year, days[days.length - 1].month, days[days.length - 1].date)
    const allHolidays = holidaysData.between(start, end)
    for (const h of allHolidays) {
      const d = new Date(h.date)
      map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, h.name)
    }
    return map
  }, [days])

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
        {days.map((dayData, i) => {
          const { year: dy, month: dm, date: d, isCurrentMonth: isCurrent, isHidden } = dayData
          const col = i % 7

          if (isHidden) {
            return (
              <Grid key={i} size={1}>
                <Box sx={{ minHeight: Math.round(42 * scale), py: 0.25 }} />
              </Grid>
            )
          }

          const isToday = dy === todayYear && dm === todayMonth && d === todayDate
          const holidayKey = `${dy}-${dm}-${d}`
          const isHoliday = holidaysMap.has(holidayKey)
          const holidayName = holidaysMap.get(holidayKey)
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

          // 月が違う場合は全体的に色を薄くする
          const opacity = isCurrent ? 1 : 0.4

          return (
            <Grid key={i} size={1}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minHeight: Math.round(42 * scale),
                  py: 0.25,
                  opacity,
                }}
              >
                {/* 日付サークル */}
                <Box
                  sx={{
                    width: Math.round(28 * scale),
                    height: Math.round(28 * scale),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isToday ? '#fff' : color,
                      fontWeight: isToday || isHoliday ? 700 : 400,
                      lineHeight: 1,
                      fontSize: `${0.8 * scale}rem`,
                      letterSpacing: isCurrent ? 'normal' : '-0.05em', // m/dは幅を取るため少し詰める
                    }}
                  >
                    {isCurrent ? d : `${dm + 1}/${d}`}
                  </Typography>
                </Box>
                {/* 祝日名 */}
                {holidayName && (
                  <Typography
                    sx={{
                      fontSize: `${0.55 * scale}rem`,
                      color: 'error.main',
                      lineHeight: 1.1,
                      textAlign: 'center',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-all',
                      px: 0.25,
                    }}
                  >
                    {holidayName}
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
