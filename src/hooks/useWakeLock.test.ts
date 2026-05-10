import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

const mockRelease = vi.fn()
const mockRequest = vi.fn()

function makeMockSentinel() {
  const listeners: Record<string, EventListener[]> = {}
  return {
    release: mockRelease,
    addEventListener: (type: string, cb: EventListener) => {
      listeners[type] = listeners[type] ?? []
      listeners[type].push(cb)
    },
    removeEventListener: vi.fn(),
    dispatchRelease: () => listeners['release']?.forEach(cb => cb(new Event('release'))),
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  // @ts-expect-error - reset
  delete (navigator as Navigator).wakeLock
})

describe('useWakeLock', () => {
  it('wakeLock 非対応時: isActive が false のまま', () => {
    const { result } = renderHook(() => useWakeLock(true))
    expect(result.current).toBe(false)
  })

  it('enabled=false 時: request を呼ばない', async () => {
    const sentinel = makeMockSentinel()
    mockRequest.mockResolvedValue(sentinel)
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
    })

    renderHook(() => useWakeLock(false))
    await act(async () => {})

    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('enabled=true かつ対応環境: request が呼ばれ isActive が true になる', async () => {
    const sentinel = makeMockSentinel()
    mockRequest.mockResolvedValue(sentinel)
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
    })

    const { result } = renderHook(() => useWakeLock(true))
    await act(async () => {})

    expect(mockRequest).toHaveBeenCalledWith('screen')
    expect(result.current).toBe(true)
  })

  it('アンマウント時: release が呼ばれる', async () => {
    const sentinel = makeMockSentinel()
    mockRequest.mockResolvedValue(sentinel)
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
    })

    const { unmount } = renderHook(() => useWakeLock(true))
    await act(async () => {})
    unmount()

    expect(mockRelease).toHaveBeenCalled()
  })
})
