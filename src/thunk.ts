import { Action } from 'redux';
import { Observable } from 'rxjs';
import { filter, mergeMap, withLatestFrom } from 'rxjs/operators';
import { Epic, ActionsObservable, StateObservable } from 'redux-observable'



type Input<E extends Epic> = E extends Epic<infer Input, any, any, any> ? Input : unknown
type Output<E extends Epic> = E extends Epic<infer Input, infer Output, any, any> ? Output : unknown
type State<E extends Epic> = E extends Epic<any, any, infer State, any> ? State : unknown
type Dependencies<E extends Epic> = E extends Epic<any, any, any, infer Dependencies> ? Dependencies : unknown



export function thunk<
    E extends Epic, A extends Input<E> & Action<any>
    >
  (
    match: (action: Action<any>) => action is A, 
    result: (action: A, state: State<E>, dependencies: Dependencies<E>) => Observable<Output<E>>
  ): E {
  const epic: Epic<Input<E>, Output<E>, State<E>, Dependencies<E>> = (action$: ActionsObservable<Input<E>>, state$: StateObservable<State<E>>, dependencies: Dependencies<E>) => 
    action$.pipe(
      filter(match),
      withLatestFrom(state$),
      mergeMap(([action, state]) => result(action, state, dependencies))
    );
  return epic as E;
}

// export const thunk: EpicMapper = thunkFunction;