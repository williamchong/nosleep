export const useAnalytics = () => {
  const trackEvent = (eventName: string) => {
    useTrackEvent(eventName)
  }

  return {
    trackEvent
  }
}
