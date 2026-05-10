import { describe, it, expect } from 'vitest'
import { formatTime, formatDate } from './ClockWidget'

describe('formatTime', () => {
  const d = (h: number, m: number, s: number) => {
    const date = new Date(2025, 0, 1)
    date.setHours(h, m, s)
    return date
  }

  describe('24時間表記', () => {
    it('秒あり', () => {
      expect(formatTime(d(9, 5, 3), true, true)).toBe('09:05:03')
    })
    it('秒なし', () => {
      expect(formatTime(d(9, 5, 3), true, false)).toBe('09:05')
    })
    it('真夜中 00:00:00', () => {
      expect(formatTime(d(0, 0, 0), true, true)).toBe('00:00:00')
    })
    it('午後 13:00', () => {
      expect(formatTime(d(13, 0, 0), true, true)).toBe('13:00:00')
    })
  })

  describe('12時間表記', () => {
    it('午前 09:05:03', () => {
      expect(formatTime(d(9, 5, 3), false, true)).toBe('AM 09:05:03')
    })
    it('午後 14:30:15', () => {
      expect(formatTime(d(14, 30, 15), false, true)).toBe('PM 02:30:15')
    })
    it('正午 12:30（秒なし）', () => {
      expect(formatTime(d(12, 30, 0), false, false)).toBe('PM 12:30')
    })
    it('深夜 0時 → AM 12:00', () => {
      expect(formatTime(d(0, 0, 0), false, false)).toBe('AM 12:00')
    })
  })
})

describe('formatDate', () => {
  it('年月日と曜日を日本語フォーマットで返す', () => {
    // 2025-01-01 は水曜日
    expect(formatDate(new Date(2025, 0, 1))).toBe('2025年1月1日（水）')
  })

  it('全曜日のマッピングが正しい', () => {
    const expected = ['日', '月', '火', '水', '木', '金', '土']
    // 2025-01-05（日）〜 2025-01-11（土）
    for (let i = 0; i < 7; i++) {
      const date = new Date(2025, 0, 5 + i)
      const result = formatDate(date)
      expect(result).toContain(`（${expected[i]}）`)
    }
  })

  it('月と日がゼロパディングされない', () => {
    expect(formatDate(new Date(2025, 2, 5))).toBe('2025年3月5日（水）')
  })
})
