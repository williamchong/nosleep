export const useAnalytics = () => {
  const { proxy } = useScriptClarity()

  const trackEvent = (eventName: string) => {
    useTrackEvent(eventName)
    proxy.clarity('event', eventName)
  }

  return {
    trackEvent
  }
}
