export const useAnalytics = () => {
  const { proxy: ga } = useScriptGoogleAnalytics()
  // app/plugins/posthog.client.ts owns PostHog's options and load timing; without 'manual' this
  // call would fall back to the 'client' trigger and load PostHog during hydration.
  const { proxy: ph } = useScriptPostHog({ scriptOptions: { trigger: 'manual' } })

  /**
   * `beacon` is for events sent while the page unloads, where PostHog's normal request is dropped.
   * GA4's gtag already sends by beacon when it can.
   */
  const trackEvent = (eventName: string, props?: Record<string, unknown>, options?: { beacon?: boolean }) => {
    ga.gtag('event', eventName, props)
    ph.posthog.capture(eventName, props, options?.beacon ? { transport: 'sendBeacon' } : undefined)
  }

  /** Attaches properties to every later PostHog event from this browser. */
  const registerProperties = (props: Record<string, unknown>) => {
    ph.posthog.register(props)
  }

  return {
    trackEvent,
    registerProperties,
  }
}
