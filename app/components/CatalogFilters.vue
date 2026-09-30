<script setup lang="ts">
import type { Category } from '~/types/dummyjson'
import type { CatalogQuery, SortField, SortOrder } from '~/utils/catalog'

const props = defineProps<{
  state: CatalogQuery
  categories: Category[]
}>()

const emit = defineEmits<{
  /** Nouvelle recherche (déjà « debouncée » de 300 ms) */
  search: [q: string]
  /** Filtres validés (le formulaire fonctionne aussi sans JavaScript, en GET) */
  apply: [patch: Partial<CatalogQuery>]
  reset: []
}>()

const SEARCH_DEBOUNCE_MS = 300

const search = ref<string>(props.state.q)
const category = ref<string>(props.state.category)
const sortBy = ref<SortField | ''>(props.state.sortBy ?? '')
const order = ref<SortOrder>(props.state.order)
const minPrice = ref<string>(props.state.minPrice?.toString() ?? '')
const maxPrice = ref<string>(props.state.maxPrice?.toString() ?? '')

// Bouton retour / lien partagé : les champs suivent l'URL
watch(
  () => props.state,
  (state) => {
    if (state.q !== search.value.trim()) search.value = state.q
    category.value = state.category
    sortBy.value = state.sortBy ?? ''
    order.value = state.order
    minPrice.value = state.minPrice?.toString() ?? ''
    maxPrice.value = state.maxPrice?.toString() ?? ''
  },
)

const debouncedSearch = useDebouncedCallback((q: string) => emit('search', q), SEARCH_DEBOUNCE_MS)

function onSearchInput(): void {
  debouncedSearch.run(search.value.trim())
}

function toPrice(value: string): number | null {
  const parsed = Number(value.replace(',', '.'))
  return value.trim() === '' || !Number.isFinite(parsed) || parsed < 0 ? null : parsed
}

function onSubmit(): void {
  debouncedSearch.cancel()
  emit('apply', {
    q: search.value.trim(),
    category: category.value,
    sortBy: sortBy.value === '' ? null : sortBy.value,
    order: order.value,
    minPrice: toPrice(minPrice.value),
    maxPrice: toPrice(maxPrice.value),
  })
}

function onSelectChange(): void {
  onSubmit()
}
</script>

<template>
  <form
    class="filters card"
    method="get"
    action="/produits"
    role="search"
    aria-label="Filtrer les produits"
    @submit.prevent="onSubmit"
  >
    <div class="field filters__search">
      <label for="filter-q">Rechercher</label>
      <input
        id="filter-q"
        v-model="search"
        class="input"
        type="search"
        name="q"
        placeholder="Ex. : mascara, laptop…"
        autocomplete="off"
        @input="onSearchInput"
      >
    </div>

    <div class="field">
      <label for="filter-category">Catégorie</label>
      <select
        id="filter-category"
        v-model="category"
        class="select"
        name="category"
        @change="onSelectChange"
      >
        <option value="">Toutes</option>
        <option v-for="item in categories" :key="item.slug" :value="item.slug">
          {{ item.name }}
        </option>
      </select>
    </div>

    <div class="field">
      <label for="filter-sort">Trier par</label>
      <select id="filter-sort" v-model="sortBy" class="select" name="sortBy" @change="onSelectChange">
        <option value="">Pertinence</option>
        <option value="price">Prix</option>
        <option value="rating">Note</option>
        <option value="title">Titre</option>
      </select>
    </div>

    <div class="field">
      <label for="filter-order">Ordre</label>
      <select id="filter-order" v-model="order" class="select" name="order" @change="onSelectChange">
        <option value="asc">Croissant</option>
        <option value="desc">Décroissant</option>
      </select>
    </div>

    <fieldset class="filters__price">
      <legend>Prix (€)</legend>
      <div class="field">
        <label for="filter-min">Min.</label>
        <input
          id="filter-min"
          v-model="minPrice"
          class="input"
          type="number"
          name="minPrice"
          min="0"
          step="1"
          inputmode="decimal"
        >
      </div>
      <div class="field">
        <label for="filter-max">Max.</label>
        <input
          id="filter-max"
          v-model="maxPrice"
          class="input"
          type="number"
          name="maxPrice"
          min="0"
          step="1"
          inputmode="decimal"
        >
      </div>
    </fieldset>

    <div class="filters__actions">
      <button type="submit" class="btn">Appliquer</button>
      <NuxtLink to="/produits" class="btn btn--secondary" @click="emit('reset')">
        Réinitialiser
      </NuxtLink>
    </div>
  </form>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
  margin-bottom: 24px;
  align-items: end;
}

.filters__search {
  grid-column: 1 / -1;
}

.filters__price {
  display: flex;
  gap: 8px;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.filters__price legend {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.filters__price .field {
  flex: 1;
  min-width: 0;
}

.filters__price .field label {
  font-weight: 400;
}

.filters__price .input {
  width: 100%;
}

.filters__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
