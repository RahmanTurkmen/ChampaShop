<script setup lang="ts">
import { formatCents } from '~/utils/money'
import type { CartSummary } from '~/utils/promotions'

const props = defineProps<{
  summary: CartSummary
  promoCode: string
}>()

const emit = defineEmits<{
  'apply-code': [code: string]
}>()

const code = ref<string>(props.promoCode)

function onSubmit(): void {
  emit('apply-code', code.value)
}

function removeCode(): void {
  code.value = ''
  emit('apply-code', '')
}
</script>

<template>
  <aside class="summary card" aria-labelledby="summary-title">
    <h2 id="summary-title">Récapitulatif</h2>

    <dl class="summary__rows">
      <div>
        <dt>Sous-total</dt>
        <dd>{{ formatCents(summary.grossCents) }}</dd>
      </div>
      <div v-for="discount in summary.discounts" :key="discount.id" class="summary__discount">
        <dt>{{ discount.label }}</dt>
        <dd>−{{ formatCents(discount.amountCents) }}</dd>
      </div>
      <div>
        <dt>Livraison</dt>
        <dd>{{ summary.shippingCents === 0 ? 'Offerte' : formatCents(summary.shippingCents) }}</dd>
      </div>
      <div class="summary__total">
        <dt>Total</dt>
        <dd>{{ formatCents(summary.totalCents) }}</dd>
      </div>
    </dl>

    <form class="summary__code" @submit.prevent="onSubmit">
      <div class="field">
        <label for="promo-code">Code promo</label>
        <div class="summary__code-row">
          <input id="promo-code" v-model="code" class="input" type="text" autocomplete="off" >
          <button type="submit" class="btn">Appliquer</button>
        </div>
      </div>
      <button v-if="promoCode" type="button" class="summary__remove" @click="removeCode">
        Retirer le code « {{ promoCode }} »
      </button>
    </form>

    <ul v-if="summary.messages.length > 0" class="summary__messages" role="status" aria-live="polite">
      <li v-for="message in summary.messages" :key="message">{{ message }}</li>
    </ul>

    <p class="muted summary__hint">Livraison offerte dès 80,00 € (hors mobilier).</p>
  </aside>
</template>

<style scoped>
.summary {
  padding: 20px;
  position: sticky;
  top: 16px;
}

.summary h2 {
  margin-top: 0;
}

.summary__rows {
  margin: 0;
  display: grid;
  gap: 8px;
}

.summary__rows div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.summary__rows dd {
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
}

.summary__discount {
  color: var(--color-success);
}

.summary__total {
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
  font-size: 1.2rem;
  font-weight: 800;
}

.summary__code {
  margin-top: 20px;
}

.summary__code-row {
  display: flex;
  gap: 8px;
}

.summary__code-row .input {
  flex: 1;
  min-width: 0;
}

.summary__remove {
  margin-top: 8px;
  background: none;
  border: 0;
  padding: 4px 0;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.summary__messages {
  color: var(--color-warning);
  padding-left: 20px;
}

.summary__hint {
  font-size: 0.85rem;
  margin-bottom: 0;
}
</style>
