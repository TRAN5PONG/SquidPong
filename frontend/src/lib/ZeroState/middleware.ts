// ========== MIDDLEWARE.TS ==========
import { Action, Middleware, MiddlewareAPI, Reducer, StoreCreator, StoreEnhancer } from "./types";
import { compose } from "./utils";

export function applyMiddleware<S>(...middlewares: Middleware<S>[]): StoreEnhancer<S> {
  return (createStore: StoreCreator) => (
    reducer: Reducer<S>, 
    preloadedState?: S
  ) => {
    const store = createStore(reducer, preloadedState);

    let dispatch: (action: Action) => Action = () => {
      throw new Error("Dispatching while constructing your middleware is not allowed.");
    };

    const middlewareAPI: MiddlewareAPI<S> = {
      getState: store.getState,
      dispatch: (action: Action) => dispatch(action)
    };

    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch
    };
  };
}
