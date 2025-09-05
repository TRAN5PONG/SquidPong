import { Fiber } from "../types";

let wipFiber: Fiber | null = null;

export function PrepareCallbacksForFiber(fiber: Fiber) {
  wipFiber = fiber;
}

export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  if (!wipFiber)
    throw new Error("useCallback must be called within a Fiber context");

  const i = wipFiber.hookIndex!;
  const oldHook = wipFiber.alternate?.callbackHooks?.[i];

  let shouldUpdate = true;
  if (oldHook && oldHook.deps && deps) {
    shouldUpdate = !areDepsEqual(oldHook.deps, deps);
  }

  const memoizedCallback = shouldUpdate ? callback : oldHook?.callback;

  // save
  const hook = {
	callback: memoizedCallback,
	deps: deps? [...deps] : undefined,
  };

  if (!wipFiber.callbackHooks) {
	wipFiber.callbackHooks = [];
  }

  wipFiber.callbackHooks[i] = hook;
  wipFiber.hookIndex!++;

  return memoizedCallback;
}

function areDepsEqual(oldDeps: any[], newDeps: any[]): boolean {
  if (oldDeps.length !== newDeps.length) return false;
  for (let i = 0; i < oldDeps.length; i++) {
    if (!Object.is(oldDeps[i], newDeps[i])) {
      return false;
    }
  }
  return true;
}
