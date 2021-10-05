import { Action, PayloadAction } from "@reduxjs/toolkit";

export type MatchFunction<
  Payload extends PayloadAction<P, T>,
  P = Payload["payload"],
  T extends string = Payload["type"]
> = (action: Action<unknown>) => action is Payload;

type ExtractPayload<TMatchFunction extends MatchFunction<any>[]> =
  TMatchFunction extends MatchFunction<infer P>[] ? P : never;

export function mergeMatch<TMatchFunction extends MatchFunction<any>[]>(
  ...m: TMatchFunction
): (action: Action<unknown>) => action is ExtractPayload<TMatchFunction> {
  return (action): action is ExtractPayload<TMatchFunction> => {
    return m.some((f) => f(action));
  };
}