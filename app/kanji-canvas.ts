// KanjiCanvas is the handwriting recognizer used by the Japanese Knowledge
// Graph. It is vendored in public so its large pattern library is downloaded
// only when the drawing panel is opened.

let loading: Promise<void> | null = null

function appendScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existing ?? document.createElement('script')
    script.src = src
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
      once: true,
    })
    if (!existing) document.body.appendChild(script)
  })
}

export function loadKanjiCanvas(): Promise<void> {
  loading ??= appendScript('/vendor/kanjicanvas/kanji-canvas.min.js').then(() =>
    appendScript('/vendor/kanjicanvas/ref-patterns.js'),
  )
  return loading
}

interface KanjiCanvasApi {
  init(id: string): void
  erase(id: string): void
  deleteLast(id: string): void
  recognize(id: string): string
  [key: string]: unknown
}

declare global {
  interface Window {
    KanjiCanvas?: KanjiCanvasApi
  }
}
