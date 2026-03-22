<script setup lang="ts">
import { ref, computed } from 'vue';
import { APP_VERSION } from '@/appVersion';
import ReloadPrompt from '@/components/ReloadPrompt.vue';
import { useCurrenciesStore } from '@/stores/currencies';
import { useDiscountsStore } from '@/stores/discounts';
import type { CustomCurrency } from '@/stores/currencies';
import type { CustomDiscount } from '@/stores/discounts';

const currenciesStore = useCurrenciesStore();
const discountsStore = useDiscountsStore();

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
  if (currenciesStore.isNameTaken(name, editingId.value ?? undefined)) {
    formError.value = '名稱已存在';
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
  const isActive = currenciesStore.selectedCurrencyId === id;
  if (isActive) {
    const others = currenciesStore.list.length - 1;
    let msg = '此幣別為目前換算幣別。';
    if (others > 0) {
      msg += '刪除後將自動改為列表中的另一筆幣別。';
    } else {
      msg += '刪除後須重新新增幣別並選擇轉換幣別。';
    }
    msg += '\n\n確定要刪除嗎？';
    if (!confirm(msg)) return;
  }
  currenciesStore.remove(id);
}

// Discount form
const discountFormOpen = ref(false);
const discountEditingId = ref<string | null>(null);
const discountFormName = ref('');
const discountFormPercent = ref('');
const discountFormError = ref('');

const isDiscountEditing = computed(() => discountEditingId.value != null);

function openDiscountAddForm() {
  discountEditingId.value = null;
  discountFormName.value = '';
  discountFormPercent.value = '';
  discountFormError.value = '';
  discountFormOpen.value = true;
}

function openDiscountEditForm(discount: CustomDiscount) {
  discountEditingId.value = discount.id;
  discountFormName.value = discount.name;
  discountFormPercent.value = String(discount.percent);
  discountFormError.value = '';
  discountFormOpen.value = true;
}

function closeDiscountForm() {
  discountFormOpen.value = false;
  discountEditingId.value = null;
  discountFormName.value = '';
  discountFormPercent.value = '';
  discountFormError.value = '';
}

function submitDiscountForm() {
  discountFormError.value = '';
  const name = discountFormName.value.trim();
  const percentNum = parseInt(discountFormPercent.value.replace(/\D/g, ''), 10);

  if (!name) {
    discountFormError.value = '請輸入折扣名稱';
    return;
  }
  if (discountsStore.isNameTaken(name, discountEditingId.value ?? undefined)) {
    discountFormError.value = '名稱已存在';
    return;
  }
  if (Number.isNaN(percentNum) || percentNum < 1 || percentNum > 99) {
    discountFormError.value = '折扣請輸入 1–99 的整數';
    return;
  }

  if (isDiscountEditing.value && discountEditingId.value) {
    const ok = discountsStore.update(discountEditingId.value, {
      name,
      percent: percentNum,
    });
    if (!ok) {
      discountFormError.value = '更新失敗';
      return;
    }
  } else {
    const ok = discountsStore.add({ name, percent: percentNum });
    if (!ok) {
      discountFormError.value = '新增失敗，請檢查名稱與百分比';
      return;
    }
  }
  closeDiscountForm();
}

function removeDiscount(id: string) {
  discountsStore.remove(id);
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-card">
      <h2 class="card-title">Settings</h2>

      <ReloadPrompt />

      <section class="section">
        <h3 class="section-title">自訂幣別</h3>
        <p class="section-desc">
          新增幣別名稱與對台幣匯率，並指定其中一筆為換算幣別，掃描結果會依此匯率轉換。
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
              <span
                v-if="currenciesStore.selectedCurrencyId === c.id"
                class="badge-in-use"
              >目前使用中</span>
              <button
                v-else
                type="button"
                class="btn-icon btn-use"
                @click="currenciesStore.setSelectedCurrencyId(c.id)"
              >
                設為換算幣別
              </button>
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

      <section class="section section-divider">
        <h3 class="section-title">折扣設定</h3>
        <p class="section-desc">
          新增折扣百分比（1%–99%），可在掃描結果中選擇並顯示折扣後金額。
        </p>

        <ul
          v-if="discountsStore.list.length > 0"
          class="currency-list"
        >
          <li
            v-for="d in discountsStore.list"
            :key="d.id"
            class="currency-item"
          >
            <span class="currency-name">{{ d.name }}</span>
            <span class="currency-rate">{{ d.percent }}%</span>
            <div class="currency-actions">
              <button
                type="button"
                class="btn-icon"
                @click="openDiscountEditForm(d)"
              >
                編輯
              </button>
              <button
                type="button"
                class="btn-icon btn-danger"
                @click="removeDiscount(d.id)"
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
          尚未新增任何折扣
        </p>

        <button
          type="button"
          class="btn-add"
          @click="openDiscountAddForm"
        >
          新增折扣
        </button>
      </section>

      <footer class="app-meta section-divider">
        <p class="version-line">版本 {{ APP_VERSION }}</p>
      </footer>
    </div>

    <!-- Currency Add/Edit form -->
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

    <!-- Discount Add/Edit form -->
    <div
      v-if="discountFormOpen"
      class="form-overlay"
      @click.self="closeDiscountForm"
    >
      <div class="form-card">
        <h3 class="form-title">
          {{ isDiscountEditing ? '編輯折扣' : '新增折扣' }}
        </h3>
        <form @submit.prevent="submitDiscountForm">
          <div class="form-field">
            <label for="discount-name">折扣名稱</label>
            <input
              id="discount-name"
              v-model="discountFormName"
              type="text"
              placeholder="例如：折扣1"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label for="discount-percent">折扣百分比</label>
            <input
              id="discount-percent"
              v-model="discountFormPercent"
              type="text"
              inputmode="numeric"
              placeholder="1–99 整數"
              class="form-input"
            />
          </div>
          <p
            v-if="discountFormError"
            class="form-error"
          >
            {{ discountFormError }}
          </p>
          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeDiscountForm"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn-primary"
            >
              {{ isDiscountEditing ? '儲存' : '新增' }}
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

.section-divider {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.app-meta {
  margin-top: 1.5rem;
  margin-bottom: 0;
}

.version-line {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
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
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.badge-in-use {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary, #c9a227);
  background: rgba(201, 162, 39, 0.15);
  border-radius: 8px;
}

.btn-use {
  color: var(--text-primary);
  background: rgba(201, 162, 39, 0.25);
}

.btn-use:hover {
  background: rgba(201, 162, 39, 0.35);
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
