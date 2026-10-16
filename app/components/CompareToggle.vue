<script setup lang="ts">
import { useCompareStore } from '~/stores/compare'

const props = defineProps<{
  productId: number
  /** Ajouté pour les lecteurs d'écran : sur le catalogue, 12 boutons « Comparer » seraient ambigus */
  productTitle: string
}>()

const emit = defineEmits<{
  toggle: [result: { selected: boolean; rejected: boolean }]
}>()

const compare = useCompareStore()

const selected = computed<boolean>(() => compare.has(props.productId))

function onClick(): void {
  // Le bouton n'est jamais désactivé quand le comparateur est plein : un bouton désactivé
  // ne reçoit pas le focus et le message « Comparateur plein » ne serait jamais annoncé.
  const rejected = compare.toggle(props.productId)
  emit('toggle', { selected: compare.has(props.productId), rejected })
}
</script>

<template>
  <button
    type="button"
    :class="['btn', 'compare-toggle', { 'btn--secondary': !selected }]"
    :aria-pressed="selected"
    @click="onClick"
  >
    <span class="compare-toggle__icon" aria-hidden="true">{{ selected ? '✓' : '+' }}</span>
    {{ selected ? 'Retirer du comparateur' : 'Comparer' }}<span class="sr-only"> « {{ productTitle }} »</span>
  </button>
</template>

<style scoped>
.compare-toggle {
  min-width: 44px;
}

.compare-toggle__icon {
  font-weight: 800;
}
</style>
