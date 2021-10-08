import { Action, PayloadAction } from '@reduxjs/toolkit';
import { MonoTypeOperatorFunction, Observable, OperatorFunction, TruthyTypesOf } from 'rxjs';
import { filter } from 'rxjs/operators';

// not exposed by redux/toolkit, but we need it
export interface ActionCreator<P, T extends string, M = never, E = never> {
    type: T;
    match: (action: Action<unknown>) => action is PayloadAction<P, T, M, E>;
}

type ExtractPayload<AC extends ActionCreator<any, T, M, E>[], T extends string, M, E> =
  AC extends ActionCreator<infer P, any, M, E>[] ? P : undefined;

type ExtractType<AC extends ActionCreator<P, any, M, E>[], P, M, E> =
    AC extends ActionCreator<P, infer T, M, E>[] ? T : undefined;

type ExtractMeta<AC extends ActionCreator<P, T, any, E>[], P, T extends string, E> =
    AC extends ActionCreator<P, T, infer M, E>[] ? M : undefined;

type ExtractError<AC extends ActionCreator<P, T, M, any>[], P, T extends string, M> =
    AC extends ActionCreator<P, T, M, infer E>[] ? E : undefined;

export type ExtractAction<AC extends ActionCreator<P, T, M, E>[], P, T extends string, M, E> =
    PayloadAction<
        ExtractPayload<AC, T, M, E>, 
        ExtractType<AC, P, M, E>, 
        ExtractMeta<AC, P, T, E>, 
        ExtractError<AC, P, T, M>
    >;

export function multiMatch<
    MF extends ActionCreator<P, T, M, E>[],
    PA extends ExtractAction<MF, P, T, M, E>,
    P=any,
    T extends string=any,
    M=never,
    E=never,
>(
  ...m: MF
): (action: Action<unknown>) => action is PA {
  return (action): action is PA => {
    return m.some((f) => f.match(action));
  };
} 

// filterActions -> filter(multiMatch(...))

export function filterActions<
  MF extends ActionCreator<P, T, M, E>[],
  PA extends ExtractAction<MF, P, T, M, E>,
  P=any,
  T extends string=any,
  M=never,
  E=never,
>(...m: MF): OperatorFunction<Action<unknown>, PA> {
  return filter((action): action is PA => multiMatch<MF, PA, P, T, M, E>(...m)(action));
}

