import { Action, Listener, Reducer, Store, StoreEnhancer } from "./types";

export function createStore<S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  preloadedState?: S,
  enhancer?: StoreEnhancer<S, A>
): Store<S, A> {
  // Handle parameter overloading
  if (typeof preloadedState === 'function' && enhancer === undefined) {
    enhancer = preloadedState as StoreEnhancer<S, A>;
    preloadedState = undefined;
  }

  if (enhancer !== undefined) {
    return enhancer(createStore)(reducer, preloadedState);
  }

  let currentState: S = preloadedState !== undefined 
    ? preloadedState 
    : reducer(undefined, { type: '@@redux/INIT' } as A);

  const listeners: Listener[] = [];

  return {
    getState(): S {
      return currentState;
    },

    dispatch(action: A): A {
      currentState = reducer(currentState, action);
      listeners.forEach(listener => listener());
      return action;
    },

    subscribe(listener: Listener): () => void {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    }
  };
}
