export const useAnalytics = () => {
  const { proxy: ga } = useScriptGoogleAnalytics()
  const { proxy: ph } = useScriptPostHog()

  /**
   * `beacon` is for events sent while the page unloads, where PostHog's normal request is dropped.
   * GA4's gtag already sends by beacon when it can.
   */
  const trackEvent = (eventName: string, props?: Record<string, unknown>, options?: { beacon?: boolean }) => {
    ga.gtag('event', eventName, props)
    ph.posthog.capture(eventName, props, options?.beacon ? { transport: 'sendBeacon' } : undefined)
  }

  return {
    trackEvent
  }
}
