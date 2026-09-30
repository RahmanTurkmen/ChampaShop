<script setup lang="ts">
const props = defineProps<{ rating: number }>()

const rounded = computed<number>(() => Math.round(props.rating * 10) / 10)
const filled = computed<number>(() => Math.round(props.rating))
</script>

<template>
  <span class="rating">
    <span aria-hidden="true" class="rating__stars">
      {{ '★'.repeat(filled) }}<span class="rating__empty">{{ '★'.repeat(5 - filled) }}</span>
    </span>
    <span class="rating__value">{{ rounded.toLocaleString('fr-FR') }}/5</span>
    <span class="sr-only">Note : {{ rounded.toLocaleString('fr-FR') }} sur 5</span>
  </span>
</template>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.rating__stars {
  color: #d97706;
  letter-spacing: 1px;
}

.rating__empty {
  color: var(--color-border);
}

.rating__value {
  color: var(--color-text-muted);
}
</style>
