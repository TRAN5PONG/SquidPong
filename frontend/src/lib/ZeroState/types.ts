// ========== TYPES.TS ==========
export interface Action {
  type: string;
  [key: string]: any;
}

export type Listener = () => void;

// miniRedux/types.ts
export type Reducer<S = any, A extends Action = Action> = (state: S | undefined, action: A) => S;


export interface Store<S = any, A extends Action = Action> {
  getState(): S;
  dispatch(action: A): A;
  subscribe(listener: Listener): () => void;
}


// StoreCreator should match the createStore function signature exactly
export type StoreCreator<S = any> = (
  reducer: Reducer<S>,
  preloadedState?: S
) => Store<S>;

// StoreEnhancer takes a StoreCreator and returns a new StoreCreator
export type StoreEnhancer<S = any, A extends Action = Action> = (
  createStore: typeof import('./core').createStore
) => (reducer: Reducer<S, A>, preloadedState?: S) => Store<S, A>;


export type MiddlewareAPI<S = any> = {
  getState(): S;
  dispatch(action: Action): Action;
};

export type Middleware<S = any> = (
  api: MiddlewareAPI<S>
) => (
  next: (action: Action) => Action
) => (
  action: Action
) => Action;
