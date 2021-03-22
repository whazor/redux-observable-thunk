import { createAction, PrepareAction } from "@reduxjs/toolkit";

export function createThunkAction<
  PARequest extends PrepareAction<any>,
  PASuccess extends PrepareAction<any>,
  PARejected extends PrepareAction<any>
>(name: string,
  options: {
    request: PARequest,
    fulfilled: PASuccess,
    rejected: PARejected
  }) {
    return {
      actions: {
        request: createAction(name, options.request),
        fulfilled: createAction(name + "Fulfilled", options.fulfilled),
        rejected: createAction(name + "Rejected", options.rejected)
      }
    }
  }

export type ReturnThunkType<A> = A extends ReturnType<typeof createThunkAction>["actions"] ? 
  ReturnType<A["request"]> | 
  ReturnType<A["fulfilled"]> | 
  ReturnType<A["rejected"]> : never
