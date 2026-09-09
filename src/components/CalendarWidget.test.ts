import { describe, it, expect } from 'vitest'
import { buildCalendarDays, getHolidaysForMonth } from './CalendarWidget'

describe('buildCalendarDays', () => {
  it('戻り値の長さが常に 42', () => {
    expect(buildCalendarDays(2025, 0).length).toBe(42)
    expect(buildCalendarDays(2024, 1).length).toBe(42)
    expect(buildCalendarDays(2025, 5).length).toBe(42)
  })

  it('2025年1月（水曜始まり）: 先頭 3 日分が前月(2024年12月)の日付で、31日分が当月', () => {
    const days = buildCalendarDays(2025, 0)
    expect(days[0].isCurrentMonth).toBe(false)
    expect(days[0].date).toBe(29) // 2024年12月は31日までなので、水曜始まりなら29, 30, 31が前月
    expect(days[1].date).toBe(30)
    expect(days[2].date).toBe(31)
    expect(days[3].date).toBe(1)
    expect(days[3].isCurrentMonth).toBe(true)
    expect(days[33].date).toBe(31)
  })

  it('2024年2月（閏年・木曜始まり）: 先頭 4 日分が前月、28日分が当月', () => {
    const days = buildCalendarDays(2024, 1)
    expect(days[0].isCurrentMonth).toBe(false)
    expect(days[0].date).toBe(28) // 1月は31日までなので 28, 29, 30, 31
    expect(days[3].date).toBe(31)
    expect(days[4].date).toBe(1)
    expect(days[4].isCurrentMonth).toBe(true)
    expect(days[31].date).toBe(28)
  })

  it('2025年6月（日曜始まり）: 先頭から当月の1日', () => {
    const days = buildCalendarDays(2025, 5)
    expect(days[0].date).toBe(1)
    expect(days[0].isCurrentMonth).toBe(true)
  })

  it('末尾は次月の日付で埋められる', () => {
    const days = buildCalendarDays(2025, 1) // 2025年2月: 28日・土曜始まり
    const lastCurrentDayIndex = days.findIndex(d => d.isCurrentMonth && d.date === 28)
    const nextDays = days.slice(lastCurrentDayIndex + 1)
    expect(nextDays.length).toBeGreaterThan(0)
    expect(nextDays.every(d => !d.isCurrentMonth)).toBe(true)
    expect(nextDays[0].date).toBe(1)
    expect(nextDays[1].date).toBe(2)
  })
})

describe('getHolidaysForMonth', () => {
  it('2025年1月1日が「元日」', () => {
    const holidays = getHolidaysForMonth(2025, 0)
    expect(holidays.get(1)).toBe('元日')
  })

  it('2025年1月13日が「成人の日」', () => {
    const holidays = getHolidaysForMonth(2025, 0)
    expect(holidays.get(13)).toBe('成人の日')
  })

  it('2025年8月11日が「山の日」', () => {
    const holidays = getHolidaysForMonth(2025, 7)
    expect(holidays.get(11)).toBe('山の日')
  })

  it('祝日のない日はキーが存在しない', () => {
    const holidays = getHolidaysForMonth(2025, 0)
    expect(holidays.has(2)).toBe(false)
  })

  it('戻り値は Map 型', () => {
    expect(getHolidaysForMonth(2025, 0)).toBeInstanceOf(Map)
  })
})
