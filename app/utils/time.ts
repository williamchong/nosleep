/**
 * Format a duration in seconds as `m:ss`, or `h:mm:ss` once it passes an hour.
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Minutes from `now` until the next time the clock reads `time` (`HH:mm`), rounded up so the
 * timer never ends early. A time that has already passed today means tomorrow.
 */
export function minutesUntil(time: string, now: Date = new Date()): number {
  // A cleared time input gives '', which must not read as midnight.
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!match) return 0
  const target = new Date(now)
  target.setHours(Number(match[1]), Number(match[2]), 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return Math.ceil((target.getTime() - now.getTime()) / 60_000)
}
