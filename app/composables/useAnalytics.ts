export const useAnalytics = () => {
  const { proxy: ga } = useScriptGoogleAnalytics()
  const { proxy: ph } = useScriptPostHog()

  const trackEvent = (eventName: string, props?: Record<string, unknown>) => {
    ga.gtag('event', eventName, props)
    ph.posthog.capture(eventName, props)
  }

  return {
    trackEvent
  }
}
