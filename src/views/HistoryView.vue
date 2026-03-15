<script setup lang="ts">
// History view - skeleton placeholder
</script>

<template>
  <div class="history-view">
    <div class="placeholder-card">
      <h2>History</h2>
      <p class="placeholder-text">History coming soon</p>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-dark);
  padding: 1.5rem;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

.placeholder-card {
  background: var(--card-dark);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}

.placeholder-card h2 {
  color: #fff;
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
}
</style>
