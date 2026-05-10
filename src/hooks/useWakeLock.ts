import { useEffect, useRef, useState } from 'react'

export function useWakeLock(enabled: boolean): boolean {
  const [isActive, setIsActive] = useState(false)
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return

    let cancelled = false

    async function acquire() {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
        if (!cancelled) setIsActive(true)
        lockRef.current.addEventListener('release', () => {
          if (!cancelled) setIsActive(false)
        })
      } catch {
        if (!cancelled) setIsActive(false)
      }
    }

    acquire()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      lockRef.current?.release()
      lockRef.current = null
      setIsActive(false)
    }
  }, [enabled])

  return isActive
}
