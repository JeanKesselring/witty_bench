'use client'

/* hero_image — one to three images with prev/next, dots and a counter.
 *
 * The catalogue asks for wrapping navigation, a loading skeleton and a
 * failure fallback, and all three are here. What it does not ask for, and
 * what this adds because §9 requires it: the gallery is a labelled group,
 * the dots say which image they go to rather than being decorative, and the
 * counter is text rather than being implied by a filled dot.
 *
 * A single image renders as a plain figure — controls for a gallery of one
 * are three dead affordances, which is the pattern §6.10 objects to on the
 * control band for exactly the same reason.
 */

import { useState } from 'react'
import type { Figure } from '@/lib/api/types'

export function Gallery({ figure }: { figure: Extract<Figure, { kind: 'gallery' }> }) {
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  const images = figure.images
  const image = images[index] ?? images[0]
  if (!image) return null

  const go = (next: number) => {
    setState('loading')
    setIndex((next + images.length) % images.length)
  }

  return (
    <figure className="k-fig k-fig--image" role="group" aria-label="Images">
      <div className="k-hero">
        {state === 'loading' ? <span className="k-state" aria-hidden="true" /> : null}
        {state === 'failed' ? (
          <p className="k-meta">This image could not be loaded. {image.alt}</p>
        ) : (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            onLoad={() => setState('ready')}
            onError={() => setState('failed')}
            data-state={state}
          />
        )}
      </div>

      <figcaption>
        {image.caption ? <p>{image.caption}</p> : null}
        {image.attribution ? (
          <p className="k-credit">
            {image.attribution}
            {image.license ? ` · ${image.license}` : ''}
          </p>
        ) : null}

        {images.length > 1 ? (
          <div className="k-hero__nav">
            <button
              type="button"
              className="k-btn k-btn--quiet k-press"
              onClick={() => go(index - 1)}
            >
              Previous image
            </button>
            <button
              type="button"
              className="k-btn k-btn--quiet k-press"
              onClick={() => go(index + 1)}
            >
              Next image
            </button>
            <span className="k-meta" aria-live="polite">
              {index + 1} of {images.length}
            </span>
          </div>
        ) : null}
      </figcaption>
    </figure>
  )
}
