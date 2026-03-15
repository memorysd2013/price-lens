<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue';
import { useScanStore } from '@/stores/scan';
import { useCurrenciesStore } from '@/stores/currencies';

type ViewName = 'scan' | 'history' | 'settings';
const navigate = inject<(view: ViewName) => void>('navigate');

const scanStore = useScanStore();
const currenciesStore = useCurrenciesStore();

const originalTextOpen = ref(false);
const sourceDropdownOpen = ref(false);
const selectedPrice = ref<string | null>(null);

function parsePriceToNumber(s: string | null): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, '').replace(/\s/g, '').trim());
  return Number.isNaN(n) ? null : n;
}

const displayAmount = computed(
  () => selectedPrice.value ?? scanStore.recognizedPrice ?? null,
);
const parsedAmount = computed(() => parsePriceToNumber(displayAmount.value));

const canShowConversion = computed(
  () =>
    currenciesStore.list.length > 0 &&
    currenciesStore.selectedCurrency != null &&
    parsedAmount.value != null,
);

const convertedValue = computed(() => {
  if (!canShowConversion.value || !currenciesStore.selectedCurrency)
    return null;
  const num = parsedAmount.value!;
  const rate = currenciesStore.selectedCurrency.rateToTWD;
  return Math.round(num * rate * 100) / 100;
});

const conversionHint = computed(() => {
  if (currenciesStore.list.length === 0) return '請至設定新增幣別';
  if (currenciesStore.selectedCurrency == null) return '請選擇來源幣別';
  if (parsedAmount.value == null && scanStore.recognizedPrice)
    return '無法換算';
  return null;
});

function selectPrice(price: string) {
  selectedPrice.value = price;
}

function goToSettings() {
  sourceDropdownOpen.value = false;
  navigate?.('settings');
}

watch(
  () => scanStore.recognizedPrice,
  (v) => {
    if (v != null && selectedPrice.value == null) selectedPrice.value = v;
  },
  { immediate: true },
);
watch(
  () => scanStore.recognizedPrices,
  (prices) => {
    if (prices.length === 0) selectedPrice.value = null;
    else if (!prices.includes(selectedPrice.value ?? ''))
      selectedPrice.value = scanStore.recognizedPrice ?? prices[0] ?? null;
  },
  { deep: true },
);
</script>

<template>
  <div class="price-display">
    <div class="conversion-card">
      <div class="card-header">
        <svg
          class="header-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line
            x1="12"
            y1="1"
            x2="12"
            y2="23"
          />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span class="header-label">ESTIMATED CONVERSION</span>
      </div>

      <!-- OCR number only (no symbol, no TWD) -->
      <div
        class="converted-price"
        :class="{ skeleton: !displayAmount }"
      >
        <span
          v-if="displayAmount"
          class="amount"
          >{{ displayAmount }}</span
        >
        <span
          v-else
          class="amount-placeholder"
          >—</span
        >
      </div>

      <!-- Converted value or hint -->
      <div
        v-if="canShowConversion && convertedValue != null"
        class="converted-twd"
      >
        約 {{ convertedValue.toLocaleString() }} TWD
      </div>
      <div
        v-else-if="conversionHint"
        class="conversion-hint"
      >
        {{ conversionHint }}
        <button
          v-if="currenciesStore.list.length === 0"
          type="button"
          class="hint-link"
          @click="goToSettings"
        >
          前往設定
        </button>
      </div>

      <div class="divider" />

      <!-- SOURCE CURRENCY dropdown -->
      <div class="section">
        <span class="section-label">SOURCE CURRENCY</span>
        <div
          v-if="currenciesStore.list.length === 0"
          class="dropdown-empty"
        >
          <span>請至設定新增幣別</span>
          <button
            type="button"
            class="hint-link"
            @click="goToSettings"
          >
            前往設定
          </button>
        </div>
        <div
          v-else
          class="dropdown-wrap"
        >
          <button
            type="button"
            class="dropdown-btn"
            :class="{ open: sourceDropdownOpen }"
            @click="sourceDropdownOpen = !sourceDropdownOpen"
          >
            <span>{{
              currenciesStore.selectedCurrency
                ? currenciesStore.selectedCurrency.name
                : '選擇幣別'
            }}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div
            v-show="sourceDropdownOpen"
            class="dropdown-menu"
          >
            <button
              v-for="c in currenciesStore.list"
              :key="c.id"
              type="button"
              class="dropdown-item"
              :class="{ active: currenciesStore.selectedCurrencyId === c.id }"
              @click="
                currenciesStore.setSelectedCurrencyId(c.id);
                sourceDropdownOpen = false;
              "
            >
              {{ c.name }} — 1 = {{ c.rateToTWD }} TWD
            </button>
          </div>
        </div>
      </div>

      <!-- Detected numbers -->
      <div class="section">
        <span class="section-label">DETECTED NUMBERS</span>
        <div
          v-if="scanStore.recognizedPrices.length > 0"
          class="number-chips"
        >
          <button
            v-for="p in scanStore.recognizedPrices"
            :key="p"
            type="button"
            class="chip"
            :class="{
              primary: (selectedPrice ?? scanStore.recognizedPrice) === p,
            }"
            @click="selectPrice(p)"
          >
            {{ p }}
          </button>
        </div>
        <div
          v-else
          class="number-chips skeleton"
        >
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
          <svg
            class="doc-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
            <line
              x1="16"
              y1="13"
              x2="8"
              y2="13"
            />
            <line
              x1="16"
              y1="17"
              x2="8"
              y2="17"
            />
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
        <div
          v-show="originalTextOpen"
          class="collapsible-content"
        >
          <pre v-if="scanStore.rawOcrText">{{ scanStore.rawOcrText }}</pre>
          <p
            v-else
            class="empty-text"
          >
            —
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="['captured', 'selecting'].includes(scanStore.status)"
      class="hint-text"
    >
      {{
        scanStore.status === 'captured'
          ? 'Tap "SCAN PRICE" to recognize, or "Select Area" to choose region'
          : 'Tap and drag to select the price area'
      }}
    </div>
    <div
      v-else-if="scanStore.status === 'done' && !scanStore.recognizedPrice"
      class="hint-text"
    >
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
  margin-bottom: 0.25rem;
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

.converted-price.skeleton .amount-placeholder {
  font-size: 1.5rem;
}

.converted-twd {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.conversion-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.hint-link {
  margin-left: 0.35rem;
  padding: 0;
  font-size: inherit;
  font-weight: 600;
  background: none;
  border: none;
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
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

.dropdown-empty {
  padding: 0.75rem 1rem;
  background: var(--section-dark);
  border-radius: 12px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.dropdown-wrap {
  position: relative;
}

.dropdown-btn {
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
  text-align: left;
}

.dropdown-btn svg {
  width: 18px;
  height: 18px;
  opacity: 0.7;
  transition: transform 0.2s;
}

.dropdown-btn.open svg {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--section-dark);
  border-radius: 12px;
  overflow: hidden;
  z-index: 20;
  max-height: 220px;
  overflow-y: auto;
}

.dropdown-item {
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  background: none;
  border: none;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dropdown-item.active {
  background: rgba(201, 162, 39, 0.2);
  color: var(--primary);
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
  background: var(--primary);
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
