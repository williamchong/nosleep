// Initialised here rather than under scripts.registry in nuxt.config, whose options are static
// and so cannot depend on which page is loading.
export default defineNuxtPlugin(() => {
  // The PiP iframe is a second page load of the app; the main window's pip_window_open already
  // counts it, so its own pageview and pageleave would only double the event bill.
  const isPipPage = window.location.pathname.replace(/\/$/, '').endsWith(PIP_PATH)

  useScriptPostHog({
    apiKey: 'phc_sNVSnBwyYLmDRxqcESGVNSr8yGdUp2nBwJ6zP45L6Duz',
    apiHost: 'https://t.williamchong.cloud',
    region: 'us',
    autocapture: false,
    capturePageview: !isPipPage,
    capturePageleave: !isPipPage,
    config: {
      capture_performance: { web_vitals: false },
    },
    scriptOptions: {
      trigger: 'onNuxtReady',
    },
  })
})
