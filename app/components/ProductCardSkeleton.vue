<template>
  <div class="skeleton card" aria-hidden="true">
    <div class="skeleton__image" />
    <div class="skeleton__line" />
    <div class="skeleton__line skeleton__line--short" />
  </div>
</template>

<style scoped>
.skeleton {
  padding-bottom: 12px;
  overflow: hidden;
}

.skeleton__image,
.skeleton__line {
  background: linear-gradient(90deg, var(--color-surface-muted) 25%, var(--color-border) 50%, var(--color-surface-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton__image {
  aspect-ratio: 1;
}

.skeleton__line {
  height: 14px;
  margin: 12px 12px 0;
  border-radius: 4px;
}

.skeleton__line--short {
  width: 40%;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton__image,
  .skeleton__line {
    animation: none;
  }
}
</style>
