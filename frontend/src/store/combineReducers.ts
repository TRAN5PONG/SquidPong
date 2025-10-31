import { Action, Reducer } from "@/lib/ZeroState/types";

export function combineReducers<S, A extends Action>(
  reducers: { [K in keyof S]: Reducer<S[K], A> }
): Reducer<S, A> {
  return (state: S | undefined, action: A): S => {
    const nextState = {} as S;
    let hasChanged = false;

    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state?.[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : (state as S);
  };
}
