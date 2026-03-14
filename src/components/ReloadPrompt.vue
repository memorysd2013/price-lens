<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();
</script>

<template>
  <div
    v-if="offlineReady || needRefresh"
    class="pwa-toast"
  >
    <p v-if="offlineReady">App ready to use offline</p>
    <p v-if="needRefresh">New version available</p>

    <button
      v-if="needRefresh"
      @click="updateServiceWorker(true)"
    >
      Reload
    </button>
  </div>
</template>
