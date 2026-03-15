import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

const STORAGE_KEY = 'price-lens-custom-discounts';
const SELECTED_KEY = 'price-lens-selected-discount-id';

export interface CustomDiscount {
  id: string;
  name: string;
  percent: number;
}

function loadFromStorage(): CustomDiscount[] {
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
        'percent' in item &&
        typeof (item as CustomDiscount).percent === 'number' &&
        Number.isInteger((item as CustomDiscount).percent) &&
        (item as CustomDiscount).percent >= 1 &&
        (item as CustomDiscount).percent <= 99,
    );
  } catch {
    return [];
  }
}

function saveToStorage(list: CustomDiscount[]) {
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

export const useDiscountsStore = defineStore('discounts', () => {
  const list = ref<CustomDiscount[]>(loadFromStorage());
  const selectedDiscountId = ref<string | null>(loadSelectedId());

  function ensureSelectedInList() {
    const id = selectedDiscountId.value;
    if (id) {
      const exists = list.value.some((d) => d.id === id);
      if (!exists) {
        selectedDiscountId.value = null;
        saveSelectedId(null);
      }
    }
    const single = list.value[0];
    if (!selectedDiscountId.value && list.value.length === 1 && single) {
      setSelectedDiscountId(single.id);
    }
  }

  function setSelectedDiscountId(id: string | null) {
    selectedDiscountId.value = id;
    saveSelectedId(id);
  }

  const selectedDiscount = computed(() => {
    const id = selectedDiscountId.value;
    if (!id) return null;
    return list.value.find((d) => d.id === id) ?? null;
  });

  function isNameTaken(name: string, excludeId?: string): boolean {
    const n = normalizeName(name);
    if (!n) return false;
    return list.value.some(
      (d) => d.id !== excludeId && normalizeName(d.name) === n,
    );
  }

  ensureSelectedInList();
  watch(list, () => ensureSelectedInList(), { deep: true });
  watch(selectedDiscountId, (id) => saveSelectedId(id), { immediate: true });

  function add(discount: Omit<CustomDiscount, 'id'>) {
    const p = Math.floor(Number(discount.percent));
    if (p < 1 || p > 99 || p !== Number(discount.percent)) return false;
    if (isNameTaken(discount.name)) return false;
    const id = crypto.randomUUID();
    const item: CustomDiscount = { ...discount, id, percent: p };
    list.value = [...list.value, item];
    saveToStorage(list.value);
    if (list.value.length === 1) {
      setSelectedDiscountId(id);
    }
    return true;
  }

  function update(
    id: string,
    updates: { name?: string; percent?: number },
  ) {
    const idx = list.value.findIndex((d) => d.id === id);
    const item = idx >= 0 ? list.value[idx] : undefined;
    if (!item) return false;
    const nextPercent =
      updates.percent !== undefined ? Math.floor(Number(updates.percent)) : item.percent;
    if (nextPercent < 1 || nextPercent > 99) return false;
    const nextName = updates.name !== undefined ? updates.name : item.name;
    if (isNameTaken(nextName, id)) return false;
    list.value = list.value.map((c) =>
      c.id === id
        ? { ...c, ...updates, name: nextName, percent: nextPercent }
        : c,
    );
    saveToStorage(list.value);
    return true;
  }

  function remove(id: string) {
    list.value = list.value.filter((d) => d.id !== id);
    saveToStorage(list.value);
    if (selectedDiscountId.value === id) {
      setSelectedDiscountId(list.value[0]?.id ?? null);
    }
  }

  return {
    list,
    selectedDiscountId,
    selectedDiscount,
    setSelectedDiscountId,
    isNameTaken,
    add,
    update,
    remove,
    ensureSelectedInList,
  };
});
