<template>
  <div class="relative bg-white dark:bg-gray-900">
    <WakeLockControl>
      <template #extra-content>
        <div class="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          <p>{{ $t('pip.alwaysOnTop') }}</p>
        </div>
      </template>
    </WakeLockControl>
  </div>
</template>

<script setup lang="ts">
const wakeLock = useWakeLock()
const { trackEvent } = useAnalytics()

onMounted(async () => {
  let autoAcquireSuccess = false

  if (!wakeLock.isPipMode.value) {
    return
  }

  if (wakeLock.isSupported.value) {
    try {
      autoAcquireSuccess = await wakeLock.acquire()
    } catch (error) {
      console.error('Auto-acquire error:', error)
      trackEvent('auto_acquire_failed_native_api')
      console.log('Auto-start failed, user interaction required')
    }

    const acquireStatus = autoAcquireSuccess ? 'success' : 'failed'
    trackEvent(`pip_init_auto_${acquireStatus}`)
  }
})
</script>
