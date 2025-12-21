export const useWakeLock = () => {
  const store = useWakeLockStore()

  onMounted(() => {
    store.initialize()
  })

  onUnmounted(() => {
    store.cleanup()
  })

  return store
}
