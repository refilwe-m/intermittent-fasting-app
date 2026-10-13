import { useState, useEffect } from 'react'

/**
 * OfflineBanner — a subtle fixed banner shown when the browser is offline.
 * Mounted once in the app shell. Uses the online/offline window events.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && !navigator.onLine
  )

  useEffect(() => {
    const goOnline = () => setOffline(false)
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[80] bg-amber-500/90 text-amber-950 text-xs font-medium text-center py-1.5 backdrop-blur"
    >
      You're offline — changes will sync when you reconnect.
    </div>
  )
}
