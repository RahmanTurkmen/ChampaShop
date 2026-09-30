/**
 * Retarde l'appel de `callback` de `delayMs` : seul le dernier appel d'une rafale est exécuté.
 * Le timer est annulé si le composant est démonté.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): { run: (...args: Args) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function run(...args: Args): void {
    cancel()
    timer = setTimeout(() => {
      timer = null
      callback(...args)
    }, delayMs)
  }

  onBeforeUnmount(cancel)

  return { run, cancel }
}
