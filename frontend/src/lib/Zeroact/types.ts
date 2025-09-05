export type FunctionComponent<P = {}> = (props: P) => ZeroactElement | null;

export interface ZeroactElement {
  type: string | FunctionComponent;
  props: {
    children: ZeroactNode[];
    key?: string | number;
    [key: string]: any;
  };
  key?: string | number;
}

export interface TextElement {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
    children: never[];
    key?: string | number;
  };
  key?: string | number;
}

export type ZeroactNode = ZeroactElement | TextElement | string | number | null;

export interface Fiber {
  type?: string | FunctionComponent | undefined;
  isSvg?: boolean;
  props: any;
  dom?: HTMLElement | SVGElement | Text | null;
  return?: Fiber | null;
  child?: Fiber | null;
  sibling?: Fiber | null;
  alternate?: Fiber | null;
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION" | "SKIP" | "PROCESS";
  stateHooks?: any[];
  effectHooks?: any[];
  callbackHooks?: any[];
  contextHooks?: ContextHook<any>[];
  refHooks?: RefObject<any>[];
  hookIndex?: number;
}

// useEffect Hook
export interface EffectHook {
  effect: () => void | (() => void); // Effect func, can return cleanup func
  cleanup?: () => void; // Cleanup func from previous effect
  deps?: any[]; // Dependency array
  isDirty?: boolean; // Whether the effect needs to run
}
// UseRef Hook
export interface RefObject<T> {
  current: T | null;
}

// useContext Hook
export interface Context<T> {
  _currentValue: T;
  _defaultValue: T;
  Provider: FunctionComponent<{ value: T; children: ZeroactNode[] }>;
  Consumer: FunctionComponent<{ children: (value: T) => ZeroactElement }>;
}

export interface ContextHook<T> {
  context: Context<T>;
  value: T;
}
