import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

const STORAGE_KEY = 'price-lens-custom-currencies';
const SELECTED_KEY = 'price-lens-selected-currency-id';

export interface CustomCurrency {
  id: string;
  name: string;
  rateToTWD: number;
}

function loadFromStorage(): CustomCurrency[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown) =>
        item &&
        typeof item === 'object' &&
        'id' in item &&
        'name' in item &&
        'rateToTWD' in item &&
        typeof (item as CustomCurrency).rateToTWD === 'number' &&
        (item as CustomCurrency).rateToTWD > 0,
    );
  } catch {
    return [];
  }
}

function saveToStorage(list: CustomCurrency[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadSelectedId(): string | null {
  return localStorage.getItem(SELECTED_KEY);
}

function saveSelectedId(id: string | null) {
  if (id == null) localStorage.removeItem(SELECTED_KEY);
  else localStorage.setItem(SELECTED_KEY, id);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export const useCurrenciesStore = defineStore('currencies', () => {
  const list = ref<CustomCurrency[]>(loadFromStorage());
  const selectedCurrencyId = ref<string | null>(loadSelectedId());

  function ensureSelectedInList() {
    const id = selectedCurrencyId.value;
    if (id) {
      const exists = list.value.some((c) => c.id === id);
      if (!exists) {
        selectedCurrencyId.value = null;
        saveSelectedId(null);
      }
    }
    const single = list.value[0];
    if (!selectedCurrencyId.value && list.value.length === 1 && single) {
      setSelectedCurrencyId(single.id);
    }
  }

  function setSelectedCurrencyId(id: string | null) {
    selectedCurrencyId.value = id;
    saveSelectedId(id);
  }

  const selectedCurrency = computed(() => {
    const id = selectedCurrencyId.value;
    if (!id) return null;
    return list.value.find((c) => c.id === id) ?? null;
  });

  // On init and when list changes, ensure selected id is in list
  ensureSelectedInList();
  watch(
    list,
    () => ensureSelectedInList(),
    { deep: true },
  );

  // Persist selected id
  watch(selectedCurrencyId, (id) => saveSelectedId(id), { immediate: true });

  function isNameTaken(name: string, excludeId?: string): boolean {
    const n = normalizeName(name);
    if (!n) return false;
    return list.value.some(
      (c) => c.id !== excludeId && normalizeName(c.name) === n,
    );
  }

  function add(currency: Omit<CustomCurrency, 'id'>) {
    if (currency.rateToTWD <= 0) return false;
    if (isNameTaken(currency.name)) return false;
    const id = crypto.randomUUID();
    const item: CustomCurrency = { ...currency, id };
    list.value = [...list.value, item];
    saveToStorage(list.value);
    if (list.value.length === 1) {
      setSelectedCurrencyId(id);
    }
    return true;
  }

  function update(id: string, updates: { name?: string; rateToTWD?: number }) {
    const idx = list.value.findIndex((c) => c.id === id);
    const item = idx >= 0 ? list.value[idx] : undefined;
    if (!item) return false;
    const nextRate = updates.rateToTWD ?? item.rateToTWD;
    if (nextRate <= 0) return false;
    const nextName = updates.name !== undefined ? updates.name : item.name;
    if (isNameTaken(nextName, id)) return false;
    list.value = list.value.map((c) =>
      c.id === id ? { ...c, ...updates, name: nextName, rateToTWD: nextRate } : c,
    );
    saveToStorage(list.value);
    return true;
  }

  function remove(id: string) {
    list.value = list.value.filter((c) => c.id !== id);
    saveToStorage(list.value);
    if (selectedCurrencyId.value === id) {
      setSelectedCurrencyId(list.value[0]?.id ?? null);
    }
  }

  return {
    list,
    selectedCurrencyId,
    selectedCurrency,
    setSelectedCurrencyId,
    isNameTaken,
    add,
    update,
    remove,
    ensureSelectedInList,
  };
});
