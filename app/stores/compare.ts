import type { ComputedRef, Ref } from 'vue'
import { MAX_COMPARE, parseCompareIds, toggleCompare } from '~/utils/compare'

const COMPARE_COOKIE = 'compare'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export const COMPARE_FULL_MESSAGE = 'Comparateur plein : retirez un produit pour en ajouter un autre'

export interface CompareStore {
  ids: ComputedRef<number[]>
  count: ComputedRef<number>
  isFull: ComputedRef<boolean>
  /** Dernier message à annoncer (zone aria-live de la barre de comparaison) */
  message: Ref<string>
  has: (id: number) => boolean
  /** Ajoute ou retire le produit. Renvoie true si l'ajout a été refusé (comparateur plein). */
  toggle: (id: number) => boolean
  remove: (id: number) => void
  clear: () => void
  replace: (ids: number[]) => void
}

/**
 * Store du comparateur (F6).
 * - Persistance : cookie « compare » (identifiants uniquement), lu dès le rendu serveur :
 *   les boutons « Comparer » et la barre sont donc corrects dans le HTML initial.
 * - Le cookie est lu comme `unknown` puis validé par parseCompareIds (il peut être modifié à la main).
 */
export const useCompareStore = defineStore('compare', (): CompareStore => {
  const cookie = useCookie<unknown>(COMPARE_COOKIE, {
    default: () => [],
    maxAge: THIRTY_DAYS,
    sameSite: 'lax',
  })

  const message = ref<string>('')

  const ids = computed<number[]>(() => parseCompareIds(cookie.value))
  const count = computed<number>(() => ids.value.length)
  const isFull = computed<boolean>(() => count.value >= MAX_COMPARE)

  function save(next: number[]): void {
    cookie.value = next
  }

  /**
   * Un lecteur d'écran ne relit pas une zone aria-live dont le texte ne change pas :
   * on vide le message puis on le remet au tick suivant pour qu'un 2e refus soit aussi annoncé.
   */
  function announce(text: string): void {
    if (message.value !== text) {
      message.value = text
      return
    }
    message.value = ''
    nextTick(() => {
      message.value = text
    })
  }

  function has(id: number): boolean {
    return ids.value.includes(id)
  }

  function toggle(id: number): boolean {
    const wasSelected = has(id)
    const result = toggleCompare(ids.value, id)
    if (result.rejected) {
      announce(COMPARE_FULL_MESSAGE)
      return true
    }
    save(result.ids)
    announce(
      wasSelected
        ? `Produit retiré du comparateur (${result.ids.length}/${MAX_COMPARE}).`
        : `Produit ajouté au comparateur (${result.ids.length}/${MAX_COMPARE}).`,
    )
    return false
  }

  function remove(id: number): void {
    if (!has(id)) return
    toggle(id)
  }

  function clear(): void {
    save([])
    announce('Comparateur vidé.')
  }

  /** Remplace toute la sélection (ex. : par celle d'un lien partagé), après validation */
  function replace(next: number[]): void {
    save(parseCompareIds(next))
    announce('Sélection du comparateur remplacée.')
  }

  return { ids, count, isFull, message, has, toggle, remove, clear, replace }
})
