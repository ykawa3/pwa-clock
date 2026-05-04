import { HashRouter, Routes, Route } from 'react-router-dom'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import { SettingsProvider } from './context/SettingsContext'
import OfflineBanner from './components/OfflineBanner'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    primary: {
      main: '#90caf9',
    },
  },
})

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SettingsProvider>
        <HashRouter>
          <OfflineBanner />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </HashRouter>
      </SettingsProvider>
    </ThemeProvider>
  )
}
