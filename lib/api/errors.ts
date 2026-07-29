/** One error shape, so §11.13's error states can be uniform (§12.2). */
export class ApiError extends Error {
  status: number
  /** Recovery action label — §11.13 requires one retry path, not a code. */
  retryable: boolean

  constructor(message: string, status = 500, retryable = true) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryable = retryable
  }
}

/** True when the session is gone and the surface should re-authenticate in
 *  place (§11.13) rather than navigating anywhere. */
export const isExpiredSession = (e: unknown): boolean =>
  e instanceof ApiError && e.status === 401
