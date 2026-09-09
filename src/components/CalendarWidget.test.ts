import { describe, it, expect } from 'vitest'
import { buildCalendarDays, getHolidaysForMonth } from './CalendarWidget'

describe('buildCalendarDays', () => {
  it('戻り値の長さが常に 42', () => {
    expect(buildCalendarDays(2025, 0).length).toBe(42)
    expect(buildCalendarDays(2024, 1).length).toBe(42)
    expect(buildCalendarDays(2025, 5).length).toBe(42)
  })

  it('2025年1月（水曜始まり）: 先頭 null が 3 個、31日分', () => {
    const days = buildCalendarDays(2025, 0)
    expect(days.slice(0, 3)).toEqual([null, null, null])
    expect(days[3]).toBe(1)
    expect(days[33]).toBe(31)
  })

  it('2024年2月（閏年・木曜始まり）: 先頭 null が 4 個、28日分', () => {
    const days = buildCalendarDays(2024, 1)
    expect(days.slice(0, 4)).toEqual([null, null, null, null])
    expect(days[4]).toBe(1)
    expect(days[31]).toBe(28)
  })

  it('2025年6月（日曜始まり）: 先頭 null が 0 個', () => {
    const days = buildCalendarDays(2025, 5)
    expect(days[0]).toBe(1)
  })

  it('末尾は null で埋められる', () => {
    const days = buildCalendarDays(2025, 1) // 2025年2月: 28日・土曜始まり
    const lastDay = days.lastIndexOf(28)
    expect(days.slice(lastDay + 1).every(d => d === null)).toBe(true)
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
