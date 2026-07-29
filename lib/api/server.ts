import { cookies } from 'next/headers'

import { ApiError } from './errors'
import { makeApi } from './factory'
import { handle, prepare, type Requester, type RequestOptions } from './http'

/* §12.2 Server transport — the ONLY module that reads the session cookie.
 *
 * Server components have no relative URL to resolve against, so they cannot
 * go through the proxy; they call the backend directly and attach the token
 * themselves. This file is server-only by construction (`next/headers`), and
 * nothing in the client bundle may import it — which is why the adapter is a
 * factory rather than a shared singleton. */

const BACKEND = process.env.COMMON_SAGE_API ?? 'http://localhost:8000'

const serverRequest: Requester = async <T,>(
  path: string,
  init: RequestOptions = {},
): Promise<T> => {
  const token = (await cookies()).get('cs_session')?.value
  const prepared = prepare(init)
  const headers = new Headers(prepared.headers)
  if (token) headers.set('authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${BACKEND}/api/v1${path}`, { ...prepared, headers })
  } catch {
    throw new ApiError('The server could not be reached.', 0, true)
  }
  return handle<T>(res)
}

/** Same surface as the browser `api`, different transport. */
export const api = makeApi(serverRequest)
