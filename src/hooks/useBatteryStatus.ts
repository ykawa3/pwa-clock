import { useEffect, useState } from 'react'

interface BatteryManager extends EventTarget {
  level: number
  charging: boolean
  addEventListener(type: 'levelchange' | 'chargingchange', listener: EventListener): void
  removeEventListener(type: 'levelchange' | 'chargingchange', listener: EventListener): void
}

interface BatteryStatus {
  level: number | null
  charging: boolean
}

export function useBatteryStatus(): BatteryStatus {
  const [status, setStatus] = useState<BatteryStatus>({ level: null, charging: false })

  useEffect(() => {
    if (!('getBattery' in navigator)) return

    let battery: BatteryManager | null = null

    const onLevelChange = () => {
      if (battery) setStatus(s => ({ ...s, level: battery!.level }))
    }
    const onChargingChange = () => {
      if (battery) setStatus(s => ({ ...s, charging: battery!.charging }))
    }

    ;(navigator as Navigator & { getBattery(): Promise<BatteryManager> })
      .getBattery()
      .then(b => {
        battery = b
        setStatus({ level: b.level, charging: b.charging })
        b.addEventListener('levelchange', onLevelChange)
        b.addEventListener('chargingchange', onChargingChange)
      })
      .catch(() => {})

    return () => {
      battery?.removeEventListener('levelchange', onLevelChange)
      battery?.removeEventListener('chargingchange', onChargingChange)
    }
  }, [])

  return status
}
