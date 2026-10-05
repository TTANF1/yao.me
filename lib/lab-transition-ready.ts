/** Wait for the destination DOM and its actual responsive image URLs, not duplicate PNG requests. */
export function waitForLabImages(path: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    let started = false
    let finished = false
    const cleanups: (() => void)[] = []
    const finish = () => {
      if (finished) return
      finished = true
      observer.disconnect()
      clearTimeout(timeout)
      signal.removeEventListener('abort', finish)
      cleanups.forEach((cleanup) => cleanup())
      resolve()
    }
    const check = () => {
      if (started || finished) return
      const lab = [...document.querySelectorAll<HTMLElement>('[data-lab-route]')]
        .find((element) => element.dataset.labRoute === path)
      if (!lab) return
      started = true
      const images = [...lab.querySelectorAll<HTMLImageElement>('img[data-lab-asset]')]
        .filter((image) => !image.hasAttribute('data-lab-desktop') || !window.matchMedia('(max-width: 700px)').matches)
      void Promise.all(images.map((image) => new Promise<void>((done) => {
        let settled = false
        const cleanup = () => {
          image.removeEventListener('load', loaded)
          image.removeEventListener('error', failed)
        }
        const failed = () => { if (!settled) { settled = true; cleanup(); done() } }
        const loaded = () => {
          if (settled) return
          settled = true
          cleanup()
          // decode() ensures the loaded file is ready to paint; decode failures do not trap navigation.
          void image.decode().catch(() => {}).then(done)
        }
        cleanups.push(() => { cleanup(); done() })
        if (image.complete) {
          if (image.naturalWidth) loaded()
          else failed()
        } else {
          image.addEventListener('load', loaded, { once: true })
          image.addEventListener('error', failed, { once: true })
        }
      }))).then(finish)
    }
    const observer = new MutationObserver(check)
    const timeout = setTimeout(finish, 15000)
    signal.addEventListener('abort', finish, { once: true })
    if (signal.aborted) { finish(); return }
    observer.observe(document.body, { childList: true, subtree: true })
    check()
  })
}
