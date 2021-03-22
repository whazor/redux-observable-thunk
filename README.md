# redux-observable-thunk
Add thunks and [redux-toolkit](https://redux-toolkit.js.org/) support to [redux-observable](https://redux-observable.js.org/). The thunks are rethought from a type-safe redux-observable perspective.

To install execute `npm install redux-observable-thunk` or `yarn add redux-observable-thunk`.

## Examples

We provide three different methods to simplify type-safe creation and usage of thunks, namely `createThunkActions`, `ReturnThunkType`, and `thunk` methods.

### Create thunk actions
Create all the actions, the `createEnvironmentActions` is used next for ReturnThunkType. Exported are the actions named `createEnvironment`, `createEnvironmentFulfilled`, `createEnvironmentFailure`.
```typescript
import { thunk, withPayload } from "redux-observable-thunk";

// note, the variables createEnvironments* are created here
export const {actions: createEnvironmentActions, actions: {
  request: createEnvironment, 
  fulfilled: createEnvironmentFulfilled, 
  rejection: createEnvironmentRejection
}} = createThunkActions("environments/createEnvironment", {
    request: withPayload<EnvironmentDef>(),
    fulfilled: withPayload<{ id: number }>(),
    rejection: withPayload<{ error: string }>()
  });
```

### Return thunk type
Instead of adding `ReturnType` for each action, you only have to add one `ReturnThunkType`:
```typescript
import { ReturnThunkType } from "redux-observable-thunk";

export type EnvironmentActions = 
   ReturnThunkType<typeof createEnvironmentActions>
   // | ReturnType<typeof otherAction>
   // | ...
   ;
```

### Thunk epic
The thunk matches the action, acquires the latest state (not used in this example), provides dependencies, and performs a mergeMap on the function you provide.

```typescript
import { thunk } from "redux-observable-thunk";
import { RootEpicType } from "./root"; // you need to have your own root epic type:
// type RootEpicType = Epic<Actions, Actions, State, Dependencies>;
// request would come from your EpicDependencies and returns an Observable otherwise you need to add from() from rxjs to wrap a promise

export const createEnvironmentThunk: RootEpicType = thunk(createEnvironment.match,
  (action, _state, {request}) => {
    return request<{id: number}>(`/api/environments`, {
      method: "post",
      body: action.payload
    }).pipe(
      map(response => createEnvironmentFulfilled(response)),
      catchError((error: string) => of(createEnvironmentFailure({ error })))
    )
  });

export default [createEnvironmentThunk, /* ... */];
```

## Integrating redux-observable with redux-toolkit

After creating your `epicMiddleware` you create configure the store as following:
```typescript
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";

// const epicMiddleware = createEpicMiddleware({ dependencies: { /* ... */ }});

const store = configureStore({
  middleware: getDefaultMiddleware().concat(
    epicMiddleware,
    // .. others
  ),
});
```

Configure root epic type (thanks to [source](https://github.com/redux-observable/redux-observable/issues/706#issue-551917922)):
```typescript
// your imports

// see our example above with EnvironmentActions

export type RootAction =
  | AccountActions
  | EnvironmentsActions
  /* | ...*/;

export const rootReducers =
  combineReducers({
    accountReducer,
    bucketReducer,
  });

export type RootState = ReturnType<typeof rootReducer>;

export const rootEpic = combineEpics(
  ...accountEpic,
  ...environmentsEpics,
);

export type RootEpicType = Epic<RootAction, RootAction, RootState, EpicDependencies>;

epicMiddleware.run(rootEpic);
```