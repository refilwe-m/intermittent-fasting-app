/**
 * usePushNotifications
 *
 * Manages Web Notification permission and schedules phase-change alerts
 * for an active fasting session.
 *
 * Scheduled notifications use setTimeout so they survive as long as the
 * app tab is open. For background delivery a Service Worker + Push API
 * would be needed — that's deferred to a later enhancement.
 */
import { useCallback, useEffect, useRef } from 'react'
import { getNextPhaseTransition } from '../../../common/utils/fastingState'

const PHASE_MESSAGES = {
  early: {
    title: '⚡ Early Fast',
    body: 'You\'ve been fasting for 4 hours. Glycogen stores are depleting — keep it up!',
  },
  ketosis: {
    title: '🔥 Ketosis Begins',
    body: 'Amazing — 12 hours in! Your body is switching to fat for fuel.',
  },
  deep: {
    title: '💫 Deep Fast',
    body: '18 hours! Autophagy is kicking in. You\'re doing great.',
  },
}

/**
 * Request notification permission from the browser.
 * Returns true if granted, false otherwise.
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Fires a Web Notification if permission is granted.
 * @param {string} title
 * @param {string} body
 */
function fireNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'fasting-phase',    // replaces any previous fasting notification
    renotify: true,
  })
}

/**
 * Schedules Web Notifications for each upcoming phase transition.
 * Returns a cleanup function that cancels all pending timeouts.
 *
 * @param {number} elapsedSeconds  Seconds already fasted when scheduling
 * @param {Date}   startedAt       When the fast began
 * @returns {() => void}           Cleanup / cancel function
 */
export function scheduleFastingNotifications(elapsedSeconds, startedAt) {
  const timeouts = []

  // Phase thresholds in hours
  const phaseThresholds = [
    { hours: 4,  state: 'early' },
    { hours: 12, state: 'ketosis' },
    { hours: 18, state: 'deep' },
  ]

  for (const { hours, state } of phaseThresholds) {
    const thresholdMs  = hours * 3600 * 1000
    const elapsedMs    = elapsedSeconds * 1000
    const delayMs      = thresholdMs - elapsedMs

    if (delayMs <= 0) continue   // already past this phase

    const msg = PHASE_MESSAGES[state]
    if (!msg) continue

    const id = setTimeout(() => {
      fireNotification(msg.title, msg.body)
    }, delayMs)

    timeouts.push(id)
  }

  return () => timeouts.forEach(clearTimeout)
}

/**
 * usePushNotifications hook
 *
 * Call inside FastingTracker. Watches `activeSession` and reschedules
 * notifications whenever a new fast starts.
 *
 * @param {{ activeSession: object|null, elapsedSeconds: number }} params
 */
export function usePushNotifications({ activeSession, elapsedSeconds }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    // Cancel any previously scheduled notifications
    if (cancelRef.current) cancelRef.current()

    if (!activeSession) return

    // Schedule for this session
    cancelRef.current = scheduleFastingNotifications(
      elapsedSeconds,
      new Date(activeSession.started_at)
    )

    return () => {
      if (cancelRef.current) cancelRef.current()
    }
  }, [activeSession?.id]) // re-run only when the session itself changes

  const requestPermission = useCallback(async () => {
    return requestNotificationPermission()
  }, [])

  return { requestPermission }
}
