<script setup lang="ts">
import type { CartProduct } from '~/utils/cart'
import { formatCents, toCents } from '~/utils/money'

const props = defineProps<{
  product: CartProduct
  quantity: number
}>()

const emit = defineEmits<{
  'update-quantity': [productId: number, quantity: number]
  remove: [productId: number]
}>()

const inputId = computed<string>(() => `qty-${props.product.id}`)
const lineTotal = computed<string>(() => formatCents(toCents(props.product.price) * props.quantity))

function onChange(event: Event): void {
  const target = event.target
  if (target instanceof HTMLInputElement) {
    const value = Number.parseInt(target.value, 10)
    emit('update-quantity', props.product.id, Number.isNaN(value) ? 1 : value)
  }
}
</script>

<template>
  <li class="line card">
    <img :src="product.thumbnail" alt="" width="80" height="80" class="line__image" >
    <div class="line__info">
      <NuxtLink :to="`/produits/${product.id}`" class="line__title">{{ product.title }}</NuxtLink>
      <p class="muted line__unit">{{ formatCents(toCents(product.price)) }} l'unité · {{ product.category }}</p>
    </div>
    <div class="line__qty">
      <button
        type="button"
        class="btn btn--secondary"
        :aria-label="`Retirer un ${product.title}`"
        @click="emit('update-quantity', product.id, quantity - 1)"
      >
        −
      </button>
      <label :for="inputId" class="sr-only">Quantité de {{ product.title }}</label>
      <input
        :id="inputId"
        class="input line__input"
        type="number"
        min="1"
        :max="product.stock"
        :value="quantity"
        @change="onChange"
      >
      <button
        type="button"
        class="btn btn--secondary"
        :aria-label="`Ajouter un ${product.title}`"
        :disabled="quantity >= product.stock"
        @click="emit('update-quantity', product.id, quantity + 1)"
      >
        +
      </button>
    </div>
    <p class="line__total">{{ lineTotal }}</p>
    <button type="button" class="btn btn--danger" @click="emit('remove', product.id)">
      Supprimer<span class="sr-only"> {{ product.title }}</span>
    </button>
  </li>
</template>

<style scoped>
.line {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  align-items: center;
  gap: 16px;
  padding: 12px;
}

.line__image {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.line__title {
  font-weight: 700;
}

.line__unit {
  margin: 4px 0 0;
  font-size: 0.9rem;
}

.line__qty {
  display: flex;
  align-items: center;
  gap: 4px;
}

.line__qty .btn {
  padding: 0 12px;
}

.line__input {
  width: 64px;
  text-align: center;
}

.line__total {
  font-weight: 700;
  margin: 0;
  min-width: 80px;
  text-align: right;
}

@media (max-width: 720px) {
  .line {
    grid-template-columns: 64px 1fr;
  }

  .line__image {
    width: 64px;
    height: 64px;
  }

  .line__total {
    text-align: left;
  }
}
</style>
