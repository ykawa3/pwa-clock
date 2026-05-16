import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import UpdateBanner from './UpdateBanner'

const mockUseRegisterSW = useRegisterSW as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockUseRegisterSW.mockReturnValue({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  })
})

describe('UpdateBanner', () => {
  it('needRefresh が false のとき何も表示しない', () => {
    render(<UpdateBanner />)
    expect(screen.queryByText('新しいバージョンがあります')).toBeNull()
  })

  it('needRefresh が true のときバナーを表示する', () => {
    mockUseRegisterSW.mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: vi.fn(),
    })
    render(<UpdateBanner />)
    expect(screen.getByText('新しいバージョンがあります')).toBeTruthy()
    expect(screen.getByRole('button', { name: '今すぐ更新' })).toBeTruthy()
  })

  it('「今すぐ更新」ボタンをクリックすると updateServiceWorker(true) が呼ばれる', () => {
    const updateServiceWorker = vi.fn()
    mockUseRegisterSW.mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    })
    render(<UpdateBanner />)
    fireEvent.click(screen.getByRole('button', { name: '今すぐ更新' }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
