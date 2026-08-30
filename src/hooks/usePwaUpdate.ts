import { useState, useCallback } from 'react'

/** SW更新チェックの結果 */
export type UpdateCheckResult = 'up-to-date' | 'update-found' | 'error' | 'no-sw'

interface UsePwaUpdateReturn {
  /** 更新チェック中かどうか */
  checking: boolean
  /** 最後のチェック結果 */
  result: UpdateCheckResult | null
  /** SW の更新チェックを手動実行する */
  checkForUpdate: () => Promise<UpdateCheckResult>
  /** 全キャッシュを削除し、SW を登録解除してリロードする（設定データは保持） */
  clearCacheAndReload: () => Promise<void>
}

/**
 * PWA の手動更新チェックとキャッシュクリアを提供するフック
 */
export function usePwaUpdate(): UsePwaUpdateReturn {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<UpdateCheckResult | null>(null)

  const checkForUpdate = useCallback(async (): Promise<UpdateCheckResult> => {
    // Service Worker API が使えない環境
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
      setResult('no-sw')
      return 'no-sw'
    }

    setChecking(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        setResult('no-sw')
        return 'no-sw'
      }

      // サーバーに新しい SW があるか確認
      await registration.update()

      // waiting に新しい SW がいれば更新あり
      if (registration.waiting) {
        setResult('update-found')
        return 'update-found'
      }

      // installing 中の場合も更新中とみなす
      if (registration.installing) {
        setResult('update-found')
        return 'update-found'
      }

      setResult('up-to-date')
      return 'up-to-date'
    } catch {
      setResult('error')
      return 'error'
    } finally {
      setChecking(false)
    }
  }, [])

  const clearCacheAndReload = useCallback(async (): Promise<void> => {
    // 1. 全キャッシュストレージを削除
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }

    // 2. Service Worker を登録解除
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(r => r.unregister()))
    }

    // 3. ページをリロード（再アクセス時に最新の SW が再登録される）
    window.location.reload()
  }, [])

  return { checking, result, checkForUpdate, clearCacheAndReload }
}
