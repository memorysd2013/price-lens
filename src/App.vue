<script setup lang="ts">
import { ref } from 'vue';
import ReloadPrompt from '@/components/ReloadPrompt.vue';
import ScanView from '@/views/ScanView.vue';
import HistoryView from '@/views/HistoryView.vue';
import SettingsView from '@/views/SettingsView.vue';
import BottomNav from '@/components/BottomNav.vue';

type ViewName = 'scan' | 'history' | 'settings';
const currentView = ref<ViewName>('scan');

function handleNavigate(view: ViewName) {
  currentView.value = view;
}
</script>

<template>
  <div class="app">
    <ScanView v-show="currentView === 'scan'" />
    <HistoryView v-show="currentView === 'history'" />
    <SettingsView v-show="currentView === 'settings'" />
    <BottomNav :current="currentView" @navigate="handleNavigate" />
  </div>
  <ReloadPrompt />
</template>

<style scoped>
.app {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-dark);
}
</style>
