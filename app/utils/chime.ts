// One context per window. Browsers start it suspended until a user gesture resumes it, so
// primeChime() runs from a click and playChime() — fired by the timer, long after — only plays
// if that already happened.
let context: AudioContext | null = null

/** Resolves once audio can play, or would never be able to. Never rejects. */
export function primeChime(): Promise<void> {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') return context.resume().catch(() => {})
  } catch { /* No Web Audio — stay silent */ }
  return Promise.resolve()
}

/**
 * Stops the audio thread once nothing will play. Closes rather than suspends: a suspended context
 * keeps a ringing chime paused and plays its tail on the next resume. The next prime makes a new one.
 */
export function stopChime(): void {
  void context?.close().catch(() => {})
  context = null
}

// Bell-like partials as [frequency ratio, relative level, decay seconds]: the higher ones fade
// first, so each strike starts bright and settles into a pure tone
const BELL_PARTIALS = [[1, 1, 1.2], [2, 0.4, 0.8], [3, 0.2, 0.5], [4.2, 0.1, 0.3]] as const

function strike(audio: AudioContext, at: number, frequency: number): void {
  for (const [ratio, level, decay] of BELL_PARTIALS) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency * ratio
    // The short ramp in avoids a click
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.06 * level, at + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(at)
    oscillator.stop(at + decay + 0.01)
  }
}

/** A soft "ding-dong" (E5 then C5), about a second and a half in all. Silent if audio was never unlocked. */
export function playChime(): void {
  if (context?.state !== 'running') return
  const start = context.currentTime
  strike(context, start, 659.25)
  strike(context, start + 0.35, 523.25)
}
