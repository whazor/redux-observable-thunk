# redux-observable-thunk
Add thunks and [redux-toolkit](https://redux-toolkit.js.org/) support to [redux-observable](https://redux-observable.js.org/). The thunks are rethought from a type-safe redux-observable perspective, but we support async-thunks from toolkit as well.

To install execute `npm install redux-observable-thunk` or `yarn add redux-observable-thunk`.

From version 2.0.0 we only support rxjs 7.x and redux-observable 2.x, see [changelog](CHANGELOG.md) for more details.

## Examples

We provide the methods `createThunkActions` and `thunk` for creation of redux-observable thunks. For your convenience we also provide the `ReturnThunkType` type for combining the three actions in one.

The `ReturnThunkType` also supports async-thunks from toolkit.

We provide the methods for `filterActions` and `multiMatch` methods for matching actions from observable thunks, async-thunks, and general toolkit actions.

### Create thunk actions
Create all the actions, the `createEnvironmentActions` is used next for ReturnThunkType. Exported are the actions named `createEnvironment`, `createEnvironmentFulfilled`, `createEnvironmentFailure`.
```typescript
import { createThunkActions, withPayload } from "redux-observable-thunk";

// note, the variables createEnvironments* are created here
export const {actions: createEnvironmentActions, actions: {
  request: createEnvironment, 
  fulfilled: createEnvironmentFulfilled, 
  rejected: createEnvironmentRejected
}} = createThunkActions("environments/createEnvironment", {
    request: withPayload<EnvironmentDef>(),
    fulfilled: withPayload<{ id: number }>(),
    rejected: withPayload<{ error: string }>()
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

export const createEnvironmentThunk: RootEpicType = thunk(createEnvironment,
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

Now we also support `thunk([createEnvironment, updateEnvironment], ...)`

### Filter actions
The methods `filterActions` and `multiMatch` will filter actions in your epics, where `filterActions(...m)=filter(multiMatch(...m))`.

Note that having payload to be the `undefined` type you need to configure typescript `strict: true` in your tsconfig.json.

```typescript
const m1 = createAction<number>("p1");
const m2 = createAction<{dog?:string, cat: string}|undefined>("p2");
const m3 = createAction("p3");

const epic: RootEpicType = (action$, state$) => action$.pipe(
  filterActions(m1, m2, m3),
  mergeMap(({payload}) => {
    // payload is of type number|{dog?:string, cat: string}|undefined
    // your redux observable code
    return of(...)
  })
);
```

### Redux-toolkit async-thunk support
Assume we have the following thunk:
```typescript
  const fetchUserById = createAsyncThunk<string, string>(  'users/fetchByIdStatus', async (userId, thunkAPI) => {    
      // example promise
      const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
      return await response.text();
  });
```
Now for action types we can use the `ReturnThunkType`:
```typescript
export type UserActions = ReturnThunkType<typeof fetchUserById> | ...;
```
And for filtering we can use `filterActions`:
```typescript
const epic: RootEpicType = (action$, state$) => action$.pipe(
  filterActions(fetchUserById.resolved/*, ... other methods if you want*/),
  mergeMap(({payload}) => {
    // payload is of type string
    return of(...)
  })
);
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
