import { describe, it, expect } from 'vitest'
import { formatTime, minutesUntil } from '~/utils/time'

describe('formatTime', () => {
  it('formats zero', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formats seconds only', () => {
    expect(formatTime(45)).toBe('0:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('2:05')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('formats exact hour', () => {
    expect(formatTime(3600)).toBe('1:00:00')
  })
})

describe('minutesUntil', () => {
  const at = (h: number, m: number, s = 0) => new Date(2026, 9, 5, h, m, s)

  it('counts the minutes to a time later today', () => {
    expect(minutesUntil('18:00', at(9, 30))).toBe(510)
  })

  it('rolls a time that has passed over to tomorrow', () => {
    expect(minutesUntil('08:00', at(18, 0))).toBe(840)
  })

  it('treats the current minute as tomorrow rather than zero', () => {
    expect(minutesUntil('18:00', at(18, 0))).toBe(1440)
  })

  it('rounds a part minute up so the timer never ends early', () => {
    expect(minutesUntil('18:00', at(17, 58, 30))).toBe(2)
  })

  it('returns zero for a cleared or malformed time', () => {
    expect(minutesUntil('', at(9, 0))).toBe(0)
    expect(minutesUntil('ab:cd', at(9, 0))).toBe(0)
  })
})
