import { describe, it, expect, vi, afterEach } from 'vitest'
import { groupForecastByDay, getTodayMinMax, wmoCodeToIcon, wmoCodeToDescription, fetchOpenMeteo } from './WeatherWidget'

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

describe('wmoCodeToIcon', () => {
  it('0 → 快晴 (01d)', () => expect(wmoCodeToIcon(0)).toBe('01d'))
  it('1,2,3 → 一部曇り (02d)', () => {
    expect(wmoCodeToIcon(1)).toBe('02d')
    expect(wmoCodeToIcon(2)).toBe('02d')
    expect(wmoCodeToIcon(3)).toBe('02d')
  })
  it('45,48 → 霧 (04d)', () => {
    expect(wmoCodeToIcon(45)).toBe('04d')
    expect(wmoCodeToIcon(48)).toBe('04d')
  })
  it('51,53,55,56,57 → 霧雨 (09d)', () => {
    for (const code of [51, 53, 55, 56, 57]) {
      expect(wmoCodeToIcon(code)).toBe('09d')
    }
  })
  it('61,63,65,66,67,80,81,82 → 雨 (10d)', () => {
    for (const code of [61, 63, 65, 66, 67, 80, 81, 82]) {
      expect(wmoCodeToIcon(code)).toBe('10d')
    }
  })
  it('71,73,75,77,85,86 → 雪 (13d)', () => {
    for (const code of [71, 73, 75, 77, 85, 86]) {
      expect(wmoCodeToIcon(code)).toBe('13d')
    }
  })
  it('95,96,99 → 雷雨 (11d)', () => {
    for (const code of [95, 96, 99]) {
      expect(wmoCodeToIcon(code)).toBe('11d')
    }
  })
  it('未知コード → デフォルト (04d)', () => expect(wmoCodeToIcon(999)).toBe('04d'))
})

describe('wmoCodeToDescription', () => {
  it('0 → 快晴', () => expect(wmoCodeToDescription(0)).toBe('快晴'))
  it('1,2,3 → 一部曇り', () => expect(wmoCodeToDescription(2)).toBe('一部曇り'))
  it('45,48 → 霧', () => expect(wmoCodeToDescription(45)).toBe('霧'))
  it('51,53,55 → 霧雨', () => expect(wmoCodeToDescription(53)).toBe('霧雨'))
  it('56,57 → 着氷性霧雨', () => expect(wmoCodeToDescription(56)).toBe('着氷性霧雨'))
  it('61,63,65 → 雨', () => expect(wmoCodeToDescription(63)).toBe('雨'))
  it('66,67 → 着氷性の雨', () => expect(wmoCodeToDescription(67)).toBe('着氷性の雨'))
  it('71,73,75 → 雪', () => expect(wmoCodeToDescription(73)).toBe('雪'))
  it('77 → 霧雪', () => expect(wmoCodeToDescription(77)).toBe('霧雪'))
  it('80,81,82 → にわか雨', () => expect(wmoCodeToDescription(81)).toBe('にわか雨'))
  it('85,86 → にわか雪', () => expect(wmoCodeToDescription(85)).toBe('にわか雪'))
  it('95 → 雷雨', () => expect(wmoCodeToDescription(95)).toBe('雷雨'))
  it('96,99 → 激しい雷雨', () => expect(wmoCodeToDescription(99)).toBe('激しい雷雨'))
  it('未知コード → 不明', () => expect(wmoCodeToDescription(999)).toBe('不明'))
})

describe('fetchOpenMeteo', () => {
  afterEach(() => vi.restoreAllMocks())

  const mockMeteo = {
    current: {
      temperature_2m: 18.4,
      relative_humidity_2m: 60,
      apparent_temperature: 16.8,
      weather_code: 0,
    },
    daily: {
      time: ['2025-05-16', '2025-05-17', '2025-05-18', '2025-05-19', '2025-05-20', '2025-05-21'],
      weather_code: [0, 1, 61, 95, 71, 80],
      temperature_2m_max: [22.0, 21.5, 19.0, 17.3, 14.0, 20.1],
      temperature_2m_min: [14.0, 13.5, 12.0, 10.1, 8.5, 11.2],
    },
  }

  const mockNominatim = {
    address: { city: '東京' },
  }

  function setupFetchMock(meteoOk = true, nominatimOk = true) {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const urlStr = String(url)
      if (urlStr.includes('open-meteo.com')) {
        return Promise.resolve({
          ok: meteoOk,
          status: meteoOk ? 200 : 500,
          json: () => Promise.resolve(mockMeteo),
        } as Response)
      }
      return Promise.resolve({
        ok: nominatimOk,
        json: () => Promise.resolve(mockNominatim),
      } as Response)
    })
  }

  it('正常レスポンス: WeatherData が正しくマッピングされる', async () => {
    setupFetchMock()
    const { weather } = await fetchOpenMeteo(35.68, 139.69)
    expect(weather.temp).toBe(18)
    expect(weather.description).toBe('快晴')
    expect(weather.icon).toBe('01d')
    expect(weather.city).toBe('東京')
    expect(weather.humidity).toBe(60)
    expect(weather.feelsLike).toBe(17)
    expect(weather.todayTempMax).toBe(22)
    expect(weather.todayTempMin).toBe(14)
  })

  it('正常レスポンス: forecast が 5 件返る', async () => {
    setupFetchMock()
    const { forecast } = await fetchOpenMeteo(35.68, 139.69)
    expect(forecast).toHaveLength(5)
  })

  it('forecast の各日に tempMin/tempMax/icon/description がある', async () => {
    setupFetchMock()
    const { forecast } = await fetchOpenMeteo(35.68, 139.69)
    for (const day of forecast) {
      expect(typeof day.tempMin).toBe('number')
      expect(typeof day.tempMax).toBe('number')
      expect(day.icon).toMatch(/^\d{2}d$/)
      expect(day.description.length).toBeGreaterThan(0)
      expect(day.date).toMatch(/^\d+\/\d+ \([日月火水木金土]\)$/)
    }
  })

  it('Nominatim 失敗時は city が "不明" になる', async () => {
    setupFetchMock(true, false)
    const { weather } = await fetchOpenMeteo(35.68, 139.69)
    expect(weather.city).toBe('不明')
  })

  it('Open-Meteo が失敗するとエラーをスローする', async () => {
    setupFetchMock(false)
    await expect(fetchOpenMeteo(35.68, 139.69)).rejects.toThrow()
  })
})
