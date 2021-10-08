import { Observable } from 'rxjs';
import { mergeMap, withLatestFrom } from 'rxjs/operators';
import { Epic } from 'redux-observable'
import { ActionCreator, ExtractAction, filterActions } from './filterActions';



type Input<E extends Epic> = E extends Epic<infer Input, any, any, any> ? Input : unknown
type Output<E extends Epic> = E extends Epic<any, infer Output, any, any> ? Output : unknown
type State<E extends Epic> = E extends Epic<any, any, infer State, any> ? State : unknown
type Dependencies<E extends Epic> = E extends Epic<any, any, any, infer Dependencies> ? Dependencies : unknown

type NotArray<T> = T extends any[] ? never : T


export function thunk<
    E extends Epic, 
    AC extends NotArray<ActionCreator<Payload, Type, Meta, Error>>,
    PA extends ExtractAction<AC[], Payload, Type, Meta, Error>,
    Payload=any,
    Type extends string=any,
    Meta=never,
    Error=never,
    >
  (
    match: AC | AC[],
    result: (action: PA, state: State<E>, dependencies: Dependencies<E>) => Observable<Output<E>>,
  ): E {
  const matchers: AC[] = Array.isArray(match) ? match : [match];
  const epic: Epic<Input<E>, Output<E>, State<E>, Dependencies<E>> = (action$, state$, dependencies) => 
    action$.pipe(
      filterActions<AC[], PA, Payload, Type, Meta, Error>(...matchers),
      withLatestFrom(state$),
      mergeMap(([action, state]) => result(action, state, dependencies))
    );
  return epic as E;
}