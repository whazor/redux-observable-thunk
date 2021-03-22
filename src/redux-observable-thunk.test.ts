import { configure, marbles } from "rxjs-marbles/jest";
import { Action } from "redux";
import { ActionsObservable, StateObservable } from "redux-observable";
import { of, Subject, throwError } from "rxjs";
import { Context } from "rxjs-marbles/context";
import { Epic } from 'redux-observable'


import { thunk, withPayload, createThunkActions, ReturnThunkType } from "redux-observable-thunk";
import { catchError, map } from "rxjs/operators";

export const wrapHelpers = <A extends Action, S extends {}>(
  helpers: Context,
  initialState: S
) => ({
  ...helpers,
  coldAction: (
    marbles: string,
    values?: { [marble: string]: A },
    error?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => new ActionsObservable(helpers.cold<A>(marbles, values, error)),
  hotAction: (
    marbles: string,
    values?: { [marble: string]: A },
    error?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => new ActionsObservable(helpers.hot<A>(marbles, values, error)),
  hotState: (
    marbles: string,
    values?: { [marble: string]: S },
    error?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    const subj = new Subject<S>();
    const obs = helpers.hot<S>(marbles, values, error);
    obs.subscribe(subj);
    return new StateObservable(subj, initialState);
  },
});


const { marbles: marblesJsonEq } = configure({
  assertDeepEqual: (a, b) =>
    expect(JSON.stringify(a, null, 2)).toEqual(JSON.stringify(b, null, 2)),
});

const initState = {
  test: false
}


describe("thunk", () => {
  it("create and use thunk", marblesJsonEq(m => {
    

    const {actions: createEnvironmentActions, actions: {
      request: createEnvironment, 
      fulfilled: createEnvironmentFulfilled, 
      rejected: createEnvironmentRejected
    }} = createThunkActions("environments/createEnvironment", {
        request: withPayload<{name: string}>(),
        fulfilled: withPayload<{ id: number }>(),
        rejected: withPayload<{ error: string }>()
      });
    
    type EnvironmentActions = ReturnThunkType<typeof createEnvironmentActions>;
    const dependencies = {
      request: (name: string) => {
        if(name === "fail") return throwError('error');
        
        return of(1);
      }
    };
    type EpicType = Epic<EnvironmentActions, EnvironmentActions, typeof initState, typeof dependencies>;
    const createEnvironmentThunk: EpicType = thunk(createEnvironment.match, (action, state, {request}) => {
      return request(action.payload.name).pipe(
        map(res => createEnvironmentFulfilled({id: res})),
        catchError(res => of(createEnvironmentRejected({error: "aaa"})))
      )
    });

    const { hotAction, hotState } = wrapHelpers<EnvironmentActions, typeof initState>(m, initState);
    const state$ = hotState("-a", {
      a: initState,
    });
    const action$ = hotAction("--a-b", {
      a: createEnvironment({name: "test test test"}),
      b: createEnvironment({name: "fail"})
    })
    const output$ = createEnvironmentThunk(action$, state$, dependencies)
    m.expect(output$).toBeObservable("--a-b", {
      a: createEnvironmentFulfilled({id: 1}),
      b: createEnvironmentRejected({error: "aaa"})
    })
    

  }))
});