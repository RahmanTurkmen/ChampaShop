import type { ComputedRef, Ref } from 'vue'
import {
  checkQuantity,
  countItems,
  parseCartCookie,
  toPromotionLines,
  upsertLine,
  type CartProduct,
  type CookieCartLine,
} from '~/utils/cart'
import { getHttpStatus } from '~/utils/http'
import { computeCart, type CartSummary } from '~/utils/promotions'

const CART_COOKIE = 'champashop_cart'
const PROMO_COOKIE = 'champashop_promo'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export interface CartDisplayLine {
  product: CartProduct
  quantity: number
}

export interface CartStore {
  lines: ComputedRef<CookieCartLine[]>
  products: Ref<Record<number, CartProduct>>
  promoCode: Ref<string>
  notice: Ref<string | null>
  itemCount: ComputedRef<number>
  displayLines: ComputedRef<CartDisplayLine[]>
  summary: ComputedRef<CartSummary>
  quantityOf: (productId: number) => number
  add: (product: CartProduct, quantity?: number) => boolean
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
  applyPromoCode: (code: string) => void
  loadProducts: () => Promise<void>
}

/**
 * Store du panier (F3).
 * - Persistance : cookie (lu dès le rendu serveur, donc pas de panier vide au rechargement).
 * - Le calcul des prix est délégué au moteur de promotions (fonction pure).
 */
export const useCartStore = defineStore('cart', (): CartStore => {
  const api = useProductsApi()
  const cookie = useCookie<unknown>(CART_COOKIE, {
    default: () => [],
    maxAge: THIRTY_DAYS,
    sameSite: 'lax',
  })
  const promoCode = useCookie<string>(PROMO_COOKIE, {
    default: () => '',
    maxAge: THIRTY_DAYS,
    sameSite: 'lax',
  })

  /** Détails produits (non persistés : rechargés depuis l'API) */
  const products = ref<Record<number, CartProduct>>({})
  /** Dernier message à afficher à l'utilisateur (ex. : stock insuffisant) */
  const notice = ref<string | null>(null)

  const lines = computed<CookieCartLine[]>(() => parseCartCookie(cookie.value))
  const itemCount = computed<number>(() => countItems(lines.value))

  const displayLines = computed<CartDisplayLine[]>(() =>
    lines.value.flatMap((line) => {
      const product = products.value[line.id]
      return product ? [{ product, quantity: line.qty }] : []
    }),
  )

  const summary = computed<CartSummary>(() =>
    computeCart(toPromotionLines(lines.value, products.value), promoCode.value),
  )

  function saveLines(next: CookieCartLine[]): void {
    cookie.value = next
    // Panier devenu vide (article par article ou via « Vider ») : on oublie aussi le code promo,
    // sinon il se réappliquerait en silence au prochain ajout.
    if (next.length === 0) {
      promoCode.value = ''
    }
  }

  function quantityOf(productId: number): number {
    return lines.value.find((line) => line.id === productId)?.qty ?? 0
  }

  /** Ajoute `quantity` exemplaires. Renvoie false si le stock empêche l'ajout complet. */
  function add(product: CartProduct, quantity = 1): boolean {
    // On ne garde que les champs utiles (le produit complet alourdirait l'état envoyé au navigateur)
    const { id, title, price, category, stock, thumbnail } = product
    products.value = { ...products.value, [id]: { id, title, price, category, stock, thumbnail } }
    const check = checkQuantity(quantityOf(product.id) + quantity, product.stock, product.title)
    saveLines(upsertLine(lines.value, product.id, check.quantity))
    notice.value = check.ok ? `« ${product.title} » a été ajouté au panier.` : check.message
    return check.ok
  }

  function setQuantity(productId: number, quantity: number): void {
    const product = products.value[productId]
    if (!product) return
    if (quantity <= 0) {
      remove(productId)
      return
    }
    const check = checkQuantity(quantity, product.stock, product.title)
    saveLines(upsertLine(lines.value, productId, check.quantity))
    notice.value = check.ok ? null : check.message
  }

  function remove(productId: number): void {
    const title = products.value[productId]?.title
    saveLines(upsertLine(lines.value, productId, 0))
    notice.value = title ? `« ${title} » a été retiré du panier.` : null
  }

  function clear(): void {
    saveLines([])
    promoCode.value = ''
    notice.value = null
  }

  function applyPromoCode(code: string): void {
    promoCode.value = code.trim()
  }

  /** Charge les détails des produits du cookie qui ne sont pas encore connus */
  async function loadProducts(): Promise<void> {
    const missing = lines.value.filter((line) => !products.value[line.id])
    const loaded = await Promise.allSettled(missing.map((line) => api.getCartProduct(line.id)))

    const next = { ...products.value }
    loaded.forEach((result, index) => {
      const line = missing[index]
      if (result.status === 'fulfilled') {
        next[result.value.id] = result.value
      } else if (line && getHttpStatus(result.reason) === 404) {
        // Produit supprimé de l'API : on le retire du panier
        saveLines(upsertLine(lines.value, line.id, 0))
      }
    })
    products.value = next
  }

  return {
    lines,
    products,
    promoCode,
    notice,
    itemCount,
    displayLines,
    summary,
    quantityOf,
    add,
    setQuantity,
    remove,
    clear,
    applyPromoCode,
    loadProducts,
  }
})
