import { Fiber } from "../types";
import { scheduleUpdate } from "../core/fiber";

// Global mutable render context
let wipFiber: Fiber | null = null;

export function PrepareHooksForFiber(fiber: Fiber) {
  wipFiber = fiber;
  fiber.hookIndex = 0;
}

/**
 * Minimal, correct useState implementation
 */
export function useState<S>(
  initial: S
): [S, (v: S | ((prev: S) => S)) => void] {
  if (!wipFiber) {
    throw new Error("useState must be called during render!");
  }

  const hookIndex = wipFiber.hookIndex ?? 0;

  // Pull state from alternate (previous render) if available
  const oldHook = wipFiber.alternate?.stateHooks?.[hookIndex];
  const state = oldHook ?? initial;

  if (!wipFiber.stateHooks) {
    wipFiber.stateHooks = [];
  }

  wipFiber.stateHooks[hookIndex] = state;

  // Capture the fiber and hook index at this time!
  const fiber = wipFiber;
  const currentHookIndex = hookIndex;

  const setState = (action: S | ((prev: S) => S)) => {
    const prev = fiber.stateHooks![currentHookIndex];
    const next =
      typeof action === "function" ? (action as (prev: S) => S)(prev) : action;

    if (prev !== next) {
      fiber.stateHooks![currentHookIndex] = next;
      scheduleUpdate();
    }
  };

  wipFiber.hookIndex = hookIndex + 1;

  return [state, setState];
}