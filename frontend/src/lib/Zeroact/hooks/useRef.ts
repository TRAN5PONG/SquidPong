// hooks/useRef.ts
import { Fiber, RefObject } from "../types";

let wipFiber: Fiber | null = null;

export function PrepareRefsForFiber(fiber: Fiber) {
  wipFiber = fiber;
}

/**
 * useRef hook implementation
 * @param initialValue - The initial value for the ref
 * @returns A mutable ref object with a `current` property
 */
export function useRef<T>(initialValue: T | null): RefObject<T> {
  if (!wipFiber) {
    throw new Error("useRef must be called within a component function");
  }

  // Ensure hookIndex and refHooks array are initialized
  if (wipFiber.hookIndex === undefined) {
    wipFiber.hookIndex = 0;
  }
  if (!wipFiber.refHooks) {
    wipFiber.refHooks = [];
  }

  const hookIndex = wipFiber.hookIndex;
  const oldHook = wipFiber.alternate?.refHooks?.[hookIndex];

  // Reuse existing ref or create a new one
  const ref: RefObject<T> = oldHook || { current: initialValue };

  // Store the ref in the fiber
  wipFiber.refHooks[hookIndex] = ref;
  wipFiber.hookIndex++;

  return ref;
}

export default {
  PrepareRefsForFiber,
  useRef,
};