import { Action, Middleware } from "redux";
import { combineEpics, StateObservable } from "redux-observable";
import { async, EMPTY, of, Subject, throwError } from "rxjs";
import { Epic } from 'redux-observable'
import { thunk, withPayload, createThunkActions, ReturnThunkType, multiMatch } from ".";
import { catchError, map } from "rxjs/operators";
import { configureStore, createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RunHelpers, TestScheduler } from "rxjs/testing";

export const wrapHelpers = <A extends Action, S extends {}>(
  helpers: RunHelpers,
  initialState: S
) => ({
  ...helpers,
  coldAction: (
    marbles: string,
    values?: { [marble: string]: A },
    error?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => helpers.cold<A>(marbles, values, error),
  hotAction: (
    marbles: string,
    values?: { [marble: string]: A },
    error?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => helpers.hot<A>(marbles, values, error),
  hotState: (
    marbles: string,
    values?: { [marble: string]: S },
    error?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    const subj = new Subject<S>();
    const obs = helpers.hot<S>(marbles, values, error);
    obs.subscribe(subj);
    return new StateObservable(obs, initialState);
  },
});


// const { marbles: marblesJsonEq } = configure({
//   assertDeepEqual: (a, b) =>
    
// });

const testScheduler = new TestScheduler((a, b) => {
  // asserting the two objects are equal - required
  // for TestScheduler assertions to work via your test framework
  // e.g. using chai.
  // expect(actual).deep.equal(expected);
  expect(JSON.stringify(a, null, 2)).toEqual(JSON.stringify(b, null, 2));
});


describe("thunk", () => {
  it("create and use thunk", () => {
    testScheduler.run<undefined>((helpers) => {
    const initState = {
      test: false
    }


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
        if(name === "fail") return throwError(() => new Error('test'));
        
        return of(1);
      }
    };
    type EpicType = Epic<EnvironmentActions, EnvironmentActions, typeof initState, typeof dependencies>;
    const createEnvironmentThunk: EpicType = thunk(createEnvironment, (action, _state, {request}) => {
      return request(action.payload.name).pipe(
        map(res => createEnvironmentFulfilled({id: res})),
        catchError(_res => of(createEnvironmentRejected({error: "aaa"})))
      )
    });
    const generalThunk: EpicType = thunk([createEnvironment, createEnvironmentFulfilled, createEnvironmentRejected], (action, _state, {request}) => {
      if(multiMatch(createEnvironment)(action)) {
        try {
          expect(["test test test", "fail"]).toContain(action.payload.name);
        } catch(e) {
          console.log(e);
          throw e;
        }
      }
      return EMPTY;
    });

    const { expectObservable } = helpers;
    const { hotAction, hotState } = wrapHelpers<EnvironmentActions, typeof initState>(helpers, initState);
    const state$ = hotState("-a", {
      a: initState,
    });
    const action$ = hotAction("--a-b", {
      a: createEnvironment({name: "test test test"}),
      b: createEnvironment({name: "fail"})
    })
    const output$ = createEnvironmentThunk(action$, state$, dependencies)
    expectObservable(output$).toBe("--a-b", {
      a: createEnvironmentFulfilled({id: 1}),
      b: createEnvironmentRejected({error: "aaa"})
    })
    const generalOutput$ = generalThunk(action$, state$, dependencies)
    expectObservable(generalOutput$).toBe("", { });
    return undefined;

  })
});
  it("asyncThunk from redux-toolkit", async () => {
    
     const fetchUserById = createAsyncThunk<
        string,
        string,
        {
            rejectValue: string;
            serializedErrorType: {message: string};
        }
    >(  'users/fetchByIdStatus',  async (userId, _thunkAPI) => {    
        // example promise
        return await new Promise((resolve, reject) => resolve("result " + userId));
    })
     let firstAction: ReturnType<typeof fetchUserById.pending>|undefined = undefined;
     let secondAction: ReturnType<typeof fetchUserById.fulfilled>|undefined = undefined;
     const stealActionsMiddleware: Middleware = store => next => action => {
      if(!firstAction) firstAction = next(action);
      else if(!secondAction) secondAction = next(action);
    };
    const store = configureStore({ 
      reducer: (state) => state,
      middleware: getDefaultMiddleware => getDefaultMiddleware().concat(stealActionsMiddleware),
     });
    
    await store.dispatch(fetchUserById("1"));
    testScheduler.run((helpers) => {
    
    
    const resultAction = createAction<string>('result');
    type UserActions = 
      ReturnThunkType<typeof fetchUserById>
      | ReturnType<typeof resultAction>;

    type RootEpicType = Epic<UserActions, UserActions, {}, {}>;
    const epic1: RootEpicType = thunk(fetchUserById.pending, () => of(resultAction("1")));
    const epic2: RootEpicType = thunk(fetchUserById.fulfilled, () => of(resultAction("2")));
    const epic3: RootEpicType = thunk([fetchUserById.pending, fetchUserById.fulfilled], () => of(resultAction("3")));

    const initState = { };
    const { expectObservable } = helpers;
    const { hotAction, hotState } = wrapHelpers<UserActions, typeof initState>(helpers, initState);
    


    const state$ = hotState("-", { });
    if(firstAction !== undefined && secondAction !== undefined) {
      expect((firstAction as UserActions).type).toBe('users/fetchByIdStatus/pending');
      expect((secondAction as UserActions).type).toBe('users/fetchByIdStatus/fulfilled');
      const action$ = hotAction("--a----b", {
        a: firstAction,
        b: secondAction
      });
      const epic = combineEpics(epic1, epic2, epic3);
      const output$ = epic(action$, state$, {});
      expectObservable(output$).toBe("------(ac)-(bc)", {
        a: resultAction("1"),
        b: resultAction("2"),
        c: resultAction("3"),
      });
    } else {
      expect(firstAction).toBeTruthy();
      expect(secondAction).toBeTruthy();
    }

    return undefined;
  })});
});