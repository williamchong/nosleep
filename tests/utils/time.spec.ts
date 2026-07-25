import { describe, it, expect } from 'vitest'
import { formatTime } from '~/utils/time'

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
