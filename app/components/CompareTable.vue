<script setup lang="ts">
import type { Product } from '~/types/dummyjson'
import { buildCompareRows, visibleCompareRows, type CompareRow } from '~/utils/compareTable'

const props = defineProps<{ products: Product[] }>()

const onlyDifferences = ref<boolean>(false)

const rows = computed<CompareRow[]>(() => buildCompareRows(props.products))
const visibleRows = computed<CompareRow[]>(() => visibleCompareRows(rows.value, onlyDifferences.value))
const hiddenCount = computed<number>(() => rows.value.length - visibleRows.value.length)

/** Annonce du nombre de lignes masquées, pour savoir que la case a bien eu un effet */
const filterMessage = computed<string>(() => {
  if (!onlyDifferences.value) return ''
  if (hiddenCount.value === 0) return 'Toutes les caractéristiques diffèrent : aucune ligne masquée.'
  return `${hiddenCount.value} caractéristique${hiddenCount.value > 1 ? 's identiques masquées' : ' identique masquée'}.`
})
</script>

<template>
  <div v-if="products.length > 0" class="compare-table">
    <!-- Avec un seul produit, il n'y a pas de différence à afficher -->
    <label v-if="products.length > 1" class="compare-table__filter">
      <input v-model="onlyDifferences" type="checkbox" >
      Afficher uniquement les différences
    </label>
    <p class="sr-only" role="status" aria-live="polite">{{ filterMessage }}</p>

    <!-- Région focalisable : au clavier, les flèches font défiler le tableau sur mobile -->
    <div class="compare-table__scroll" role="region" aria-labelledby="compare-table-caption" tabindex="0">
      <table class="compare-table__table">
        <caption id="compare-table-caption">
          Comparaison de {{ products.length }} produit{{ products.length > 1 ? 's' : '' }}
        </caption>
        <thead>
          <tr>
            <td class="compare-table__corner" />
            <th v-for="product in products" :key="product.id" scope="col">
              <NuxtLink :to="`/produits/${product.id}`">{{ product.title }}</NuxtLink>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Image</th>
            <td v-for="product in products" :key="product.id">
              <img :src="product.thumbnail" alt="" width="120" height="120" class="compare-table__image" >
            </td>
          </tr>
          <tr v-for="row in visibleRows" :key="row.key">
            <th scope="row">{{ row.label }}</th>
            <td
              v-for="(cell, index) in row.cells"
              :key="products[index]?.id ?? index"
              :class="{ 'compare-table__best': cell.best }"
            >
              {{ cell.text }}
              <span v-if="cell.best && row.bestLabel" class="compare-table__badge">{{ row.bestLabel }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else class="compare-table__empty">
    <p>Aucun produit à comparer.</p>
    <NuxtLink to="/produits" class="btn">Parcourir le catalogue</NuxtLink>
  </div>
</template>

<style scoped>
.compare-table__filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  cursor: pointer;
}

.compare-table__filter input {
  width: 20px;
  height: 20px;
}

/* Mobile : le tableau défile dans son conteneur, la page ne déborde jamais */
.compare-table__scroll {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.compare-table__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.compare-table__table caption {
  padding: 12px 16px;
  text-align: left;
  font-weight: 700;
}

.compare-table__table th,
.compare-table__table td {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
  min-width: 160px;
}

.compare-table__table thead th {
  font-size: 1rem;
}

/* Première colonne (libellés) figée pendant le défilement horizontal */
.compare-table__table th[scope='row'],
.compare-table__corner {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 120px;
  background: var(--color-surface-muted);
}

.compare-table__image {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.compare-table__best {
  font-weight: 700;
  color: var(--color-success);
}

.compare-table__badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border: 1px solid currentcolor;
  border-radius: 999px;
  font-size: 0.8rem;
}

.compare-table__empty {
  padding: 32px 0;
}

@media (max-width: 640px) {
  .compare-table__table th,
  .compare-table__table td {
    min-width: 140px;
  }

  .compare-table__table th[scope='row'],
  .compare-table__corner {
    min-width: 100px;
  }
}
</style>
