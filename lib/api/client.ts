/* The API adapter, browser side — §12.2.
 *
 * Server components import `@/lib/api/server` instead: same surface, a
 * transport that can read the session cookie. The shared method bodies live
 * in ./factory.ts so the two cannot drift.
 */

import { browserRequest } from './http'
import { makeApi } from './factory'

export { ApiError, isExpiredSession } from './errors'
export const api = makeApi(browserRequest)
