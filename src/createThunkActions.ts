import { AsyncThunk, createAction, PrepareAction } from "@reduxjs/toolkit";

export function createThunkActions<
  PARequest extends PrepareAction<any>,
  PASuccess extends PrepareAction<any>,
  PARejected extends PrepareAction<any>,
  Name extends string = string
>(name: Name,
  options: {
    request: PARequest,
    fulfilled: PASuccess,
    rejected: PARejected
  }) {
    return {
      actions: {
        request: createAction(name, options.request),
        fulfilled: createAction(name + "/fulfilled", options.fulfilled),
        rejected: createAction(name + "/rejected", options.rejected)
      }
    }
  }

export type ReturnThunkType<A> = A extends ReturnType<typeof createThunkActions>["actions"] ? 
  ReturnType<A["request"]> | 
  ReturnType<A["fulfilled"]> | 
  ReturnType<A["rejected"]> : 
  A extends AsyncThunk<infer _R, infer _TA, infer _C> ? 
      ReturnType<A['pending']> |
      ReturnType<A["fulfilled"]> |
      ReturnType<A["rejected"]> : never;
