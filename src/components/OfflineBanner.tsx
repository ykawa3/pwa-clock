import { useState, useEffect } from 'react'
import { Alert, Collapse } from '@mui/material'
import WifiOffIcon from '@mui/icons-material/WifiOff'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const setOnline = () => setIsOnline(true)
    const setOffline = () => setIsOnline(false)
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)
    return () => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    }
  }, [])

  return (
    <Collapse in={!isOnline}>
      <Alert
        severity="warning"
        icon={<WifiOffIcon />}
        sx={{ borderRadius: 0, justifyContent: 'center' }}
      >
        Offline Mode — カレンダー・天気は利用できません
      </Alert>
    </Collapse>
  )
}
