<script setup lang="ts">
import { ref } from 'vue';
import { useScanStore } from '@/stores/scan';

const scanStore = useScanStore();
const originalTextOpen = ref(false);

function selectPrice(_price: string) {
  // TODO: set selected price for conversion
}
</script>

<template>
  <div class="price-display">
    <div class="conversion-card">
      <!-- Header -->
      <div class="card-header">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span class="header-label">ESTIMATED CONVERSION</span>
      </div>

      <!-- Converted price (skeleton - conversion not implemented, show detected as fallback) -->
      <div class="converted-price" :class="{ skeleton: !scanStore.recognizedPrice }">
        <span class="currency-symbol">$</span>
        <span v-if="scanStore.recognizedPrice" class="amount">{{ scanStore.recognizedPrice }}</span>
        <span v-else class="amount-placeholder">—</span>
        <span class="target-currency">TWD</span>
      </div>

      <!-- Exchange rate (skeleton - not implemented) -->
      <div class="exchange-rate skeleton-text">
        Rate: 1 JPY = 0.21 TWD
      </div>

      <div class="divider" />

      <!-- Source currency dropdown (skeleton - not implemented) -->
      <div class="section">
        <span class="section-label">SOURCE CURRENCY</span>
        <button class="dropdown-skeleton" type="button" disabled>
          <span>JPY - Japanese Yen</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <!-- Detected numbers -->
      <div class="section">
        <span class="section-label">DETECTED NUMBERS</span>
        <div v-if="scanStore.recognizedPrices.length > 0" class="number-chips">
          <button
            v-for="p in scanStore.recognizedPrices"
            :key="p"
            type="button"
            class="chip"
            :class="{ primary: p === scanStore.recognizedPrice }"
            @click="selectPrice(p)"
          >
            {{ p }}
          </button>
        </div>
        <div v-else class="number-chips skeleton">
          <span class="chip-placeholder">—</span>
        </div>
      </div>

      <!-- Original text (collapsible) -->
      <div class="section">
        <button
          class="collapsible-header"
          type="button"
          @click="originalTextOpen = !originalTextOpen"
        >
          <svg class="doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Original Text</span>
          <svg
            class="chevron"
            :class="{ open: originalTextOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-show="originalTextOpen" class="collapsible-content">
          <pre v-if="scanStore.rawOcrText">{{ scanStore.rawOcrText }}</pre>
          <p v-else class="empty-text">—</p>
        </div>
      </div>
    </div>

    <!-- Hint when no result yet -->
    <div
      v-if="['captured', 'selecting'].includes(scanStore.status)"
      class="hint-text"
    >
      {{ scanStore.status === 'captured' ? 'Tap "SCAN PRICE" to recognize, or "Select Area" to choose region' : 'Tap and drag to select the price area' }}
    </div>
    <div v-else-if="scanStore.status === 'done' && !scanStore.recognizedPrice" class="hint-text">
      No price recognized. Ensure the price is clearly visible and retake.
    </div>
  </div>
</template>

<style scoped>
.price-display {
  padding: 1rem 0;
}

.conversion-card {
  background: var(--card-dark);
  border-radius: 16px;
  padding: 1.25rem;
  color: var(--text-primary);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.header-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.header-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.converted-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.currency-symbol {
  font-size: 1.5rem;
  font-weight: 700;
}

.amount {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.amount-placeholder {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-muted);
}

.target-currency {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.converted-price.skeleton .amount-placeholder {
  font-size: 1.5rem;
}

.exchange-rate {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.skeleton-text {
  opacity: 0.8;
}

.dropdown-skeleton:disabled {
  cursor: default;
  opacity: 0.9;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin: 1rem 0;
}

.section {
  margin-bottom: 1rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.dropdown-skeleton {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--section-dark);
  border: none;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.dropdown-skeleton svg {
  width: 18px;
  height: 18px;
  opacity: 0.7;
}

.number-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  background: var(--section-dark);
  border: none;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.15);
}

.chip.primary {
  background: var(--accent-gold);
  color: #fff;
}

.chip-placeholder {
  padding: 0.5rem 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.collapsible-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--section-dark);
  border: none;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
}

.doc-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.collapsible-header .chevron {
  width: 18px;
  height: 18px;
  margin-left: auto;
  transition: transform 0.2s;
}

.collapsible-header .chevron.open {
  transform: rotate(180deg);
}

.collapsible-content {
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--section-dark);
  border-radius: 12px;
}

.collapsible-content pre {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-secondary);
}

.empty-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.hint-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}
</style>
