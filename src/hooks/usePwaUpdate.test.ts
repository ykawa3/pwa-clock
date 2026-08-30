import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePwaUpdate } from './usePwaUpdate'

describe('usePwaUpdate', () => {
  // navigator.serviceWorker のモック準備
  const originalSW = navigator.serviceWorker
  const originalCaches = globalThis.caches

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    // navigator.serviceWorker を復元
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalSW,
      writable: true,
      configurable: true,
    })
    // caches を復元
    if (originalCaches) {
      Object.defineProperty(globalThis, 'caches', {
        value: originalCaches,
        writable: true,
        configurable: true,
      })
    }
  })

  it('初期状態では checking=false, result=null', () => {
    const { result } = renderHook(() => usePwaUpdate())
    expect(result.current.checking).toBe(false)
    expect(result.current.result).toBeNull()
  })

  it('Service Worker 非対応環境では "no-sw" を返す', async () => {
    // jsdom では navigator.serviceWorker を完全に消せないため、
    // getRegistration が存在しないパターンでテスト
    const savedDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
    Object.defineProperty(navigator, 'serviceWorker', {
      get() { return undefined },
      configurable: true,
    })

    const { result } = renderHook(() => usePwaUpdate())

    let checkResult: string | undefined
    await act(async () => {
      checkResult = await result.current.checkForUpdate()
    })

    expect(checkResult).toBe('no-sw')
    expect(result.current.result).toBe('no-sw')

    // 復元
    if (savedDescriptor) {
      Object.defineProperty(navigator, 'serviceWorker', savedDescriptor)
    }
  })

  it('SW登録なしの場合は "no-sw" を返す', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        getRegistrations: vi.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePwaUpdate())

    let checkResult: string | undefined
    await act(async () => {
      checkResult = await result.current.checkForUpdate()
    })

    expect(checkResult).toBe('no-sw')
  })

  it('waiting SW がある場合は "update-found" を返す', async () => {
    const mockRegistration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: { state: 'installed' },
      installing: null,
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        getRegistrations: vi.fn().mockResolvedValue([mockRegistration]),
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePwaUpdate())

    let checkResult: string | undefined
    await act(async () => {
      checkResult = await result.current.checkForUpdate()
    })

    expect(checkResult).toBe('update-found')
    expect(mockRegistration.update).toHaveBeenCalled()
  })

  it('最新の場合は "up-to-date" を返す', async () => {
    const mockRegistration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: null,
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        getRegistrations: vi.fn().mockResolvedValue([mockRegistration]),
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePwaUpdate())

    let checkResult: string | undefined
    await act(async () => {
      checkResult = await result.current.checkForUpdate()
    })

    expect(checkResult).toBe('up-to-date')
  })

  it('update() が例外を投げた場合は "error" を返す', async () => {
    const mockRegistration = {
      update: vi.fn().mockRejectedValue(new Error('network error')),
      waiting: null,
      installing: null,
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        getRegistrations: vi.fn().mockResolvedValue([mockRegistration]),
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePwaUpdate())

    let checkResult: string | undefined
    await act(async () => {
      checkResult = await result.current.checkForUpdate()
    })

    expect(checkResult).toBe('error')
  })

  it('clearCacheAndReload はキャッシュを削除し、SWを登録解除し、リロードする', async () => {
    // caches モック
    const mockCaches = {
      keys: vi.fn().mockResolvedValue(['cache-v1', 'workbox-precache']),
      delete: vi.fn().mockResolvedValue(true),
    }
    Object.defineProperty(globalThis, 'caches', {
      value: mockCaches,
      writable: true,
      configurable: true,
    })

    // SW モック
    const mockUnregister = vi.fn().mockResolvedValue(true)
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        getRegistrations: vi.fn().mockResolvedValue([{ unregister: mockUnregister }]),
      },
      writable: true,
      configurable: true,
    })

    // location.reload モック
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => usePwaUpdate())

    await act(async () => {
      await result.current.clearCacheAndReload()
    })

    // キャッシュが削除されたことを確認
    expect(mockCaches.keys).toHaveBeenCalled()
    expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1')
    expect(mockCaches.delete).toHaveBeenCalledWith('workbox-precache')

    // SW が登録解除されたことを確認
    expect(mockUnregister).toHaveBeenCalled()

    // リロードが呼ばれたことを確認
    expect(reloadMock).toHaveBeenCalled()
  })
})
