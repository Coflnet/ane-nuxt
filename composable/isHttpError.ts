export interface HttpError {
  status: number
}

export function isHttpError(e: unknown): e is HttpError {
  return (
    typeof e === 'object'
    && e !== null
    && 'status' in e
    && typeof (e as HttpError).status === 'number'
  )
}
