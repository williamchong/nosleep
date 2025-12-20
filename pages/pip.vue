<template>
  <div class="relative bg-white dark:bg-gray-900">
    <WakeLockControl auto-acquire>
      <template #extra-content>
        <div class="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          <p>{{ $t('pip.alwaysOnTop') }}</p>
        </div>
      </template>
    </WakeLockControl>
  </div>
</template>

<script setup lang="ts">
</script>
