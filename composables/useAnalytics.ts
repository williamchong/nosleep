export const useAnalytics = () => {
  const { proxy } = useScriptPostHog()

  // gtag's `useTrackEvent` only accepts a name; PostHog gets the structured props.
  const trackEvent = (eventName: string, props?: Record<string, unknown>) => {
    useTrackEvent(eventName)
    proxy.posthog.capture(eventName, props)
  }

  return {
    trackEvent
  }
}
