export function withPayload<T>() {
  return (t: T) => ({ payload: t });
}

export function withPrepare<Payload, Error=never, Meta=never>() {
  return (payload: Payload, error: Error, meta: Meta) => ({ payload, error, meta });
}