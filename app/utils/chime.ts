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

/** Stops the audio thread rendering silence once nothing will play. The next prime wakes it. */
export function suspendChime(): void {
  void context?.suspend().catch(() => {})
}

/** Two soft falling notes, about a quarter second in all. Silent if audio was never unlocked. */
export function playChime(): void {
  if (context?.state !== 'running') return
  const start = context.currentTime
  for (const [offset, frequency] of [[0, 660], [0.12, 440]] as const) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    // Ramp in and out so the note has no click at either end
    gain.gain.setValueAtTime(0, start + offset)
    gain.gain.linearRampToValueAtTime(0.08, start + offset + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.13)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + 0.14)
  }
}
