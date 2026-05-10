import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SettingsProvider, useSettings } from './SettingsContext'

const STORAGE_KEY = 'pwa-clock-settings'

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsContext', () => {
  it('localStorage が空 → デフォルト値で初期化', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings.show24Hour).toBe(true)
    expect(result.current.settings.showSeconds).toBe(true)
    expect(result.current.settings.showCalendar).toBe(true)
    expect(result.current.settings.showWeather).toBe(true)
    expect(result.current.settings.keepAwake).toBe(true)
    expect(result.current.settings.weatherApiKey).toBe('')
  })

  it('localStorage に有効な JSON → マージして初期化', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ show24Hour: false, showSeconds: false }))
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings.show24Hour).toBe(false)
    expect(result.current.settings.showSeconds).toBe(false)
    expect(result.current.settings.showCalendar).toBe(true) // デフォルト維持
  })

  it('localStorage に不正な JSON → デフォルト値にフォールバック', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{')
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })
    expect(result.current.settings.show24Hour).toBe(true)
  })

  it('updateSetting → state と localStorage が更新される', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })

    act(() => {
      result.current.updateSetting('show24Hour', false)
    })

    expect(result.current.settings.show24Hour).toBe(false)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.show24Hour).toBe(false)
  })

  it('updateSetting で keepAwake を変更できる', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider })

    act(() => {
      result.current.updateSetting('keepAwake', false)
    })

    expect(result.current.settings.keepAwake).toBe(false)
  })

  it('Provider 外で useSettings を使うとエラー', () => {
    expect(() => renderHook(() => useSettings())).toThrow()
  })
})
