import { useWakeLock } from '@vueuse/core'

export const useWakeLockManager = () => {
  const nativeWakeLock = useWakeLock()
  const store = useWakeLockStore()

  onMounted(() => {
    store.initialize({ nativeWakeLock })
  })

  onUnmounted(() => {
    store.cleanup()
  })

  return store
}
