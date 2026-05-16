import type { ReactNode } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { SizeScaleContext } from './context/SizeScaleContext'
import OfflineBanner from './components/OfflineBanner'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

const SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.2 } as const
const FONT_MAP  = { small: 12,   medium: 14,  large: 16  } as const
const SPACE_MAP = { small: 7,    medium: 8,   large: 9   } as const

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const scale = SCALE_MAP[settings.displaySize]
  const theme = createTheme({
    palette: {
      mode: 'dark',
      background: { default: '#0a0a0a', paper: '#1a1a1a' },
      primary: { main: '#90caf9' },
    },
    typography: { fontSize: FONT_MAP[settings.displaySize] },
    spacing: SPACE_MAP[settings.displaySize],
  })
  return (
    <ThemeProvider theme={theme}>
      <SizeScaleContext.Provider value={scale}>
        {children}
      </SizeScaleContext.Provider>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <ThemeWrapper>
        <CssBaseline />
        <HashRouter>
          <OfflineBanner />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </HashRouter>
      </ThemeWrapper>
    </SettingsProvider>
  )
}
