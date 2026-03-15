<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCurrenciesStore } from '@/stores/currencies';
import type { CustomCurrency } from '@/stores/currencies';

const currenciesStore = useCurrenciesStore();

const formOpen = ref(false);
const editingId = ref<string | null>(null);
const formName = ref('');
const formRate = ref('');
const formError = ref('');

const isEditing = computed(() => editingId.value != null);

function openAddForm() {
  editingId.value = null;
  formName.value = '';
  formRate.value = '';
  formError.value = '';
  formOpen.value = true;
}

function openEditForm(currency: CustomCurrency) {
  editingId.value = currency.id;
  formName.value = currency.name;
  formRate.value = String(currency.rateToTWD);
  formError.value = '';
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  editingId.value = null;
  formName.value = '';
  formRate.value = '';
  formError.value = '';
}

function submitForm() {
  formError.value = '';
  const name = formName.value.trim();
  const rateNum = parseFloat(formRate.value.replace(/,/g, '').trim());

  if (!name) {
    formError.value = '請輸入幣別名稱';
    return;
  }
  if (Number.isNaN(rateNum) || rateNum <= 0) {
    formError.value = '對台幣匯率必須大於 0';
    return;
  }

  if (isEditing.value && editingId.value) {
    const ok = currenciesStore.update(editingId.value, {
      name,
      rateToTWD: rateNum,
    });
    if (!ok) {
      formError.value = '更新失敗，請檢查匯率是否大於 0';
      return;
    }
  } else {
    const ok = currenciesStore.add({ name, rateToTWD: rateNum });
    if (!ok) {
      formError.value = '新增失敗，請檢查匯率是否大於 0';
      return;
    }
  }
  closeForm();
}

function removeCurrency(id: string) {
  currenciesStore.remove(id);
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-card">
      <h2 class="card-title">Settings</h2>

      <section class="section">
        <h3 class="section-title">自訂幣別</h3>
        <p class="section-desc">
          新增幣別名稱與對台幣匯率，即可在掃描結果中選擇並換算。
        </p>

        <ul
          v-if="currenciesStore.list.length > 0"
          class="currency-list"
        >
          <li
            v-for="c in currenciesStore.list"
            :key="c.id"
            class="currency-item"
          >
            <span class="currency-name">{{ c.name }}</span>
            <span class="currency-rate"
              >1 {{ c.name }} = {{ c.rateToTWD }} TWD</span
            >
            <div class="currency-actions">
              <button
                type="button"
                class="btn-icon"
                @click="openEditForm(c)"
              >
                編輯
              </button>
              <button
                type="button"
                class="btn-icon btn-danger"
                @click="removeCurrency(c.id)"
              >
                刪除
              </button>
            </div>
          </li>
        </ul>
        <p
          v-else
          class="empty-hint"
        >
          尚未新增任何幣別
        </p>

        <button
          type="button"
          class="btn-add"
          @click="openAddForm"
        >
          新增幣別
        </button>
      </section>
    </div>

    <!-- Add/Edit form -->
    <div
      v-if="formOpen"
      class="form-overlay"
      @click.self="closeForm"
    >
      <div class="form-card">
        <h3 class="form-title">{{ isEditing ? '編輯幣別' : '新增幣別' }}</h3>
        <form @submit.prevent="submitForm">
          <div class="form-field">
            <label for="currency-name">幣別名稱</label>
            <input
              id="currency-name"
              v-model="formName"
              type="text"
              placeholder="例如：JPY、日圓"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label for="currency-rate">對台幣匯率</label>
            <input
              id="currency-rate"
              v-model="formRate"
              type="text"
              inputmode="decimal"
              placeholder="例如：0.21 表示 1 單位 = 0.21 TWD"
              class="form-input"
            />
          </div>
          <p
            v-if="formError"
            class="form-error"
          >
            {{ formError }}
          </p>
          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeForm"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn-primary"
            >
              {{ isEditing ? '儲存' : '新增' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-dark);
  padding: 1.5rem;
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

.settings-card {
  background: var(--card-dark);
  border-radius: 16px;
  padding: 1.5rem;
}

.card-title {
  color: #fff;
  font-size: 1.25rem;
  margin: 0 0 1.25rem;
}

.section {
  margin-bottom: 0;
}

.section-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.section-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0 0 1rem;
}

.currency-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.currency-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background: var(--section-dark);
  border-radius: 12px;
}

.currency-name {
  font-weight: 600;
  color: var(--text-primary);
}

.currency-rate {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.currency-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-danger:hover {
  background: rgba(220, 80, 80, 0.3);
  color: #f88;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 1rem;
}

.btn-add {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.btn-add:hover {
  background: var(--primary-hover);
}

.form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 100;
}

.form-card {
  background: var(--card-dark);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 360px;
}

.form-title {
  color: #fff;
  font-size: 1.1rem;
  margin: 0 0 1.25rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.form-input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
  background: var(--section-dark);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-error {
  font-size: 0.85rem;
  color: #f88;
  margin: 0 0 0.75rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 0.65rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--primary-hover);
}
</style>
