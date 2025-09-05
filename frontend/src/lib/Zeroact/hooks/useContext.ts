import { Context, ContextHook, Fiber } from "../types";

let wipFiber: Fiber | null = null;

export function PrepareContextsForFiber(fiber: Fiber) {
  wipFiber = fiber;
}

export function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    _currentValue: defaultValue,
    _defaultValue: defaultValue,
    Provider: ({ value, children }) => {
      const prevValue = context._currentValue;
      context._currentValue = value;

      return {
        type: "CONTEXT_PROVIDER",
        props: {
          children,
          context,
          value,
          prevValue
        }
      } as any;
    },
    Consumer: ({ children }) => {
      if (typeof children !== "function") {
        throw new Error("Context.Consumer expects a function as child");
      }
      const result = children(context._currentValue);
      
      if (result && typeof result === "object" && "type" in result) {
        return result;
      }
      
      if (Array.isArray(result)) {
        return {
          type: "FRAGMENT",
          props: {
            children: result
          }
        };
      }

      return {
        type: "TEXT_NODE",
        props: {
          nodeValue: String(result),
          children: []
        }
      };
    }
  };
  return context;
}

export function useContext<T>(context: Context<T>): T {
  if (!wipFiber) {
    throw new Error("useContext must be called within a component function");
  }

  if (wipFiber.hookIndex === undefined) {
    wipFiber.hookIndex = 0;
  }
  if (!wipFiber.contextHooks) {
    wipFiber.contextHooks = [];
  }

  const CurrentHookIndex = wipFiber.hookIndex;

  const contextValue = findContextValue(context, wipFiber);

  const contextHook: ContextHook<T> = {
    context,
    value: contextValue
  }

  wipFiber.contextHooks[CurrentHookIndex] = contextHook;
  wipFiber.hookIndex++;

  return contextValue;
}

function findContextValue<T>(context: Context<T>, fiber: Fiber): T {
  let currentFiber = fiber.return;
  
  while (currentFiber) {
    if (currentFiber.type === "CONTEXT_PROVIDER" && 
        currentFiber.props?.context === context) {
      return currentFiber.props.value;
    }
    currentFiber = currentFiber.return;
  }
  
  return context._defaultValue;
}

export function handleContextProvider(fiber: Fiber) {
  if (fiber.type !== "CONTEXT_PROVIDER") return;
  
  const { context, value, prevValue } = fiber.props;
  
  context._currentValue = value;
  
  if (fiber.effectHooks) {
    fiber.effectHooks.push({
      effect: () => {
        return () => {
          context._currentValue = prevValue;
        };
      },
      cleanup: undefined,
      deps: [value],
      isDirty: true
    });
  }
}