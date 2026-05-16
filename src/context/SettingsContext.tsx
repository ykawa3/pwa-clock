import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type DisplaySize = 'small' | 'medium' | 'large'

interface Settings {
  show24Hour: boolean
  showSeconds: boolean
  showCalendar: boolean
  showWeather: boolean
  weatherApiKey: string
  keepAwake: boolean
  displaySize: DisplaySize
  useApiKey: boolean
}

const DEFAULTS: Settings = {
  show24Hour: true,
  showSeconds: true,
  showCalendar: true,
  showWeather: true,
  weatherApiKey: '',
  keepAwake: true,
  displaySize: 'medium',
  useApiKey: false,
}

const STORAGE_KEY = 'pwa-clock-settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULTS
}

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
