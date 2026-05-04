import { useMemo } from 'react'
import { Box, Typography, Grid, Paper } from '@mui/material'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarWidget() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayDate = today.getDate()

  const days = useMemo(() => buildCalendarDays(year, month), [year, month])

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" align="center" sx={{ mb: 1, fontWeight: 500 }}>
        {year}年{month + 1}月
      </Typography>

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
          const isToday = d === todayDate
          const col = i % 7
          const color = col === 0 ? 'error.main' : col === 6 ? 'info.main' : 'text.primary'
          return (
            <Grid key={i} size={1}>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 0.3,
                  borderRadius: '50%',
                  mx: 'auto',
                  width: 28,
                  bgcolor: isToday ? 'primary.main' : 'transparent',
                }}
              >
                {d && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: isToday ? '#fff' : color,
                      fontWeight: isToday ? 700 : 400,
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
