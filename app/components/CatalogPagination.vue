<script setup lang="ts">
import { visiblePages } from '~/utils/catalog'

const props = defineProps<{
  page: number
  pageCount: number
  /** Construit le lien d'une page (query params conservés) */
  linkFor: (page: number) => { path: string; query: Record<string, string> }
}>()

const pages = computed<(number | null)[]>(() => visiblePages(props.page, props.pageCount))
</script>

<template>
  <nav v-if="pageCount > 1" class="pagination" aria-label="Pagination">
    <ul>
      <li>
        <NuxtLink v-if="page > 1" :to="linkFor(page - 1)" class="pagination__link" rel="prev">
          <span aria-hidden="true">←</span> Précédent
        </NuxtLink>
      </li>
      <li v-for="(item, index) in pages" :key="item ?? `gap-${index}`">
        <span v-if="item === null" class="pagination__gap" aria-hidden="true">…</span>
        <NuxtLink
          v-else
          :to="linkFor(item)"
          class="pagination__link"
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="`Page ${item}`"
        >
          {{ item }}
        </NuxtLink>
      </li>
      <li>
        <NuxtLink v-if="page < pageCount" :to="linkFor(page + 1)" class="pagination__link" rel="next">
          Suivant <span aria-hidden="true">→</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.pagination ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 32px 0 0;
}

.pagination__link,
.pagination__gap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 10px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
  background: var(--color-surface);
}

.pagination__gap {
  border-color: transparent;
  background: transparent;
}

.pagination__link[aria-current='page'] {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 700;
}
</style>
