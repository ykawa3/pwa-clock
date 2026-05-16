import { describe, it, expect, vi, afterEach } from 'vitest'
import { groupForecastByDay, getTodayMinMax } from './WeatherWidget'

// forecast API の 3h スロットを生成するヘルパー
function makeSlot(date: Date, temp: number, icon = '01d', description = '快晴') {
  return {
    dt: Math.floor(date.getTime() / 1000),
    main: { temp },
    weather: [{ icon, description }],
  }
}

// 今日の日付で dt を作る
function todayAt(hour: number) {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return d
}

// 指定オフセット(日)後の日付で dt を作る
function dayAt(offsetDays: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, 0, 0, 0)
  return d
}

describe('getTodayMinMax', () => {
  it('今日のスロットから最高・最低気温を返す', () => {
    const list = [
      makeSlot(todayAt(6),  10),
      makeSlot(todayAt(12), 18),
      makeSlot(todayAt(18), 15),
    ]
    const result = getTodayMinMax(list)
    expect(result).toEqual({ tempMax: 18, tempMin: 10 })
  })

  it('今日以外のスロットは無視する', () => {
    const list = [
      makeSlot(todayAt(12), 20),
      makeSlot(dayAt(1, 12), 30), // 明日
    ]
    const result = getTodayMinMax(list)
    expect(result).toEqual({ tempMax: 20, tempMin: 20 })
  })

  it('今日のスロットが0件のとき null を返す', () => {
    const list = [
      makeSlot(dayAt(1, 12), 25),
      makeSlot(dayAt(2, 12), 20),
    ]
    expect(getTodayMinMax(list)).toBeNull()
  })

  it('小数の気温を Math.round する', () => {
    const list = [
      makeSlot(todayAt(9),  12.4),
      makeSlot(todayAt(15), 18.6),
    ]
    const result = getTodayMinMax(list)
    expect(result?.tempMax).toBe(19)
    expect(result?.tempMin).toBe(12)
  })

  it('空配列のとき null を返す', () => {
    expect(getTodayMinMax([])).toBeNull()
  })
})

describe('groupForecastByDay', () => {
  it('今日のスロットは結果に含まれない', () => {
    const list = [
      makeSlot(todayAt(12), 20),
      makeSlot(dayAt(1, 12), 22),
    ]
    const result = groupForecastByDay(list)
    expect(result).toHaveLength(1)
  })

  it('1日分のスロットから tempMin/tempMax を計算する', () => {
    const list = [
      makeSlot(dayAt(1, 6),  8),
      makeSlot(dayAt(1, 12), 15),
      makeSlot(dayAt(1, 18), 12),
    ]
    const result = groupForecastByDay(list)
    expect(result[0].tempMin).toBe(8)
    expect(result[0].tempMax).toBe(15)
  })

  it('最頻出アイコンが選ばれる', () => {
    const list = [
      makeSlot(dayAt(1, 6),  10, '01d'),
      makeSlot(dayAt(1, 12), 12, '02d'),
      makeSlot(dayAt(1, 18), 11, '02d'),
    ]
    const result = groupForecastByDay(list)
    // '02' が 2 回 > '01' が 1 回
    expect(result[0].icon).toMatch(/^02/)
  })

  it('最頻出 description が選ばれる', () => {
    const list = [
      makeSlot(dayAt(1, 6),  10, '01d', '晴れ'),
      makeSlot(dayAt(1, 12), 12, '01d', '曇り'),
      makeSlot(dayAt(1, 18), 11, '01d', '曇り'),
    ]
    const result = groupForecastByDay(list)
    expect(result[0].description).toBe('曇り')
  })

  it('最大 5 日分に制限される', () => {
    const list: ReturnType<typeof makeSlot>[] = []
    for (let d = 1; d <= 7; d++) {
      list.push(makeSlot(dayAt(d, 12), 20))
    }
    const result = groupForecastByDay(list)
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('date ラベルが M/D (曜日) 形式になっている', () => {
    const list = [makeSlot(dayAt(1, 12), 20)]
    const result = groupForecastByDay(list)
    expect(result[0].date).toMatch(/^\d+\/\d+ \([日月火水木金土]\)$/)
  })

  it('空配列のとき空配列を返す', () => {
    expect(groupForecastByDay([])).toEqual([])
  })
})
