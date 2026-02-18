export const useWakeLockManager = () => {
  const store = useWakeLockStore()

  onMounted(() => {
    store.initialize()
  })

  onUnmounted(() => {
    store.cleanup()
  })

  return store
}
