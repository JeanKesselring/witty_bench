/* §12.2 Transport contract.
 *
 * Deliberately universal: this file imports nothing from `next/headers` and
 * nothing server-only, because it is pulled into the client bundle. The two
 * concrete transports live beside it — `browserRequest` here, and the
 * server one in ./server.ts, which is the only file allowed to read cookies.
 */

import { ApiError } from './errors'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Serialised as a JSON body with the right content-type. */
  json?: unknown
  body?: BodyInit
}

export type Requester = <T>(path: string, init?: RequestOptions) => Promise<T>

/** Message for a status, in the interface's voice rather than the wire's. */
export function messageFor(status: number, fallback?: string): string {
  if (status === 401) return 'Your session has expired.'
  if (status === 403) return 'You do not have access to that.'
  if (status === 404) return 'That does not exist.'
  if (status >= 500) return 'The server had a problem. Nothing you did was lost.'
  return fallback ?? 'That request could not be completed.'
}

/** Shared response handling, so both transports fail identically (§11.13). */
export async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = (await res.json()) as { detail?: string }
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      /* a non-JSON error body is still an error; the status carries it */
    }
    // §11.13: a 401 does not redirect to /login. It surfaces as an expired
    // session so the surface can re-authenticate in place.
    throw new ApiError(messageFor(res.status, detail), res.status, res.status >= 500)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function prepare(init: RequestOptions): RequestInit {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  if (json !== undefined) {
    headers.set('content-type', 'application/json')
    rest.body = JSON.stringify(json)
  }
  return { ...rest, headers, cache: 'no-store' }
}

/**
 * Browser transport: same-origin, relative. The proxy route attaches the
 * Bearer from the httpOnly cookie, so page JavaScript never holds a token.
 */
export const browserRequest: Requester = async <T,>(
  path: string,
  init: RequestOptions = {},
): Promise<T> => {
  let res: Response
  try {
    res = await fetch(`/api/v1${path}`, prepare(init))
  } catch {
    throw new ApiError('The server could not be reached.', 0, true)
  }
  return handle<T>(res)
}
