import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBatteryStatus } from './useBatteryStatus'

type BatteryEventType = 'levelchange' | 'chargingchange'
interface MockBattery {
  level: number
  charging: boolean
  _listeners: Partial<Record<BatteryEventType, EventListener[]>>
  addEventListener: (type: BatteryEventType, cb: EventListener) => void
  removeEventListener: (type: BatteryEventType, cb: EventListener) => void
  _fire: (type: BatteryEventType) => void
}

function makeMockBattery(initial: { level: number; charging: boolean }): MockBattery {
  const battery: MockBattery = {
    level: initial.level,
    charging: initial.charging,
    _listeners: {},
    addEventListener(type, cb) {
      battery._listeners[type] = battery._listeners[type] ?? []
      battery._listeners[type]!.push(cb)
    },
    removeEventListener(type, cb) {
      battery._listeners[type] = battery._listeners[type]?.filter(l => l !== cb)
    },
    _fire(type) {
      battery._listeners[type]?.forEach(cb => cb(new Event(type)))
    },
  }
  return battery
}

beforeEach(() => {
  // @ts-expect-error - reset
  delete (navigator as Navigator).getBattery
})

describe('useBatteryStatus', () => {
  it('getBattery 非対応時: { level: null, charging: false }', () => {
    const { result } = renderHook(() => useBatteryStatus())
    expect(result.current).toEqual({ level: null, charging: false })
  })

  it('初期値が反映される', async () => {
    const battery = makeMockBattery({ level: 0.82, charging: true })
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(battery),
      configurable: true,
    })

    const { result } = renderHook(() => useBatteryStatus())
    await act(async () => {})

    expect(result.current.level).toBeCloseTo(0.82)
    expect(result.current.charging).toBe(true)
  })

  it('levelchange イベントで level が更新される', async () => {
    const battery = makeMockBattery({ level: 0.8, charging: false })
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(battery),
      configurable: true,
    })

    const { result } = renderHook(() => useBatteryStatus())
    await act(async () => {})

    act(() => {
      battery.level = 0.5
      battery._fire('levelchange')
    })

    expect(result.current.level).toBeCloseTo(0.5)
  })

  it('chargingchange イベントで charging が更新される', async () => {
    const battery = makeMockBattery({ level: 0.6, charging: false })
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(battery),
      configurable: true,
    })

    const { result } = renderHook(() => useBatteryStatus())
    await act(async () => {})

    act(() => {
      battery.charging = true
      battery._fire('chargingchange')
    })

    expect(result.current.charging).toBe(true)
  })
})
