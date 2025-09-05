// hooks/useEffect.ts
import { EffectHook, Fiber } from "../types";

// Use the same global wipFiber from useState
let wipFiber: Fiber | null = null;

/**
 * Called by fiber.ts before rendering a function component.
 * This should be called alongside PrepareHooksForFiber
 */
export function PrepareEffectsForFiber(fiber: Fiber) {
  wipFiber = fiber;
}

/**
 * useEffect hook implementation
 * @param effect - The effect function to run
 * @param deps - Optional dependency array
 */
export function useEffect(
  effect: () => void | (() => void),
  deps?: any[]
): void {
  if (!wipFiber) {
    throw new Error("useEffect must be called within a component function");
  }

  // Initialize hook index and effectHooks array if not already set
  if (wipFiber.hookIndex === undefined) {
    wipFiber.hookIndex = 0;
  }
  if (!wipFiber.effectHooks) {
    wipFiber.effectHooks = [];
  }

  const CurrentHookIndex = wipFiber.hookIndex;
  const AlternateHookIndex = wipFiber.alternate?.effectHooks?.[CurrentHookIndex];
  
  // dependencies comparison
  const isDirty = AlternateHookIndex 
    ? !deps || !AlternateHookIndex.deps || !areDepEqual(deps, AlternateHookIndex.deps)
    : true; // First render always runs

  const effectHook: EffectHook = {
    effect,
    cleanup: AlternateHookIndex?.cleanup,
    deps: deps ? [...deps] : undefined, // Clone deps array
    isDirty
  };

  // Store the hook
  wipFiber.effectHooks[CurrentHookIndex] = effectHook;
  wipFiber.hookIndex++;
}

/**
 * Compare two dependency arrays for equality
 */
function areDepEqual(deps1: any[], deps2: any[]): boolean {
  if (deps1.length !== deps2.length) return false;
  
  for (let i = 0; i < deps1.length; i++) {
    if (!Object.is(deps1[i], deps2[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Run cleanup for all effects when component unmounts
 */
export function cleanupEffects(fiber: Fiber): void {
  if (!fiber.effectHooks) return;

  fiber.effectHooks.forEach((hook) => {
    if (hook.cleanup) {
      try {
        hook.cleanup();
      } catch (error) {
        console.error("Error in effect cleanup during unmount:", error);
      }
    }
  });
}

export default {
  PrepareEffectsForFiber,
  useEffect,
  cleanupEffects,
};