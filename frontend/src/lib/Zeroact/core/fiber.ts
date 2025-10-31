import { Fiber, ZeroactNode } from "../types";
import { updateDom } from "../dom/updateDom";
import { cleanupEffects } from "../hooks/useEffect";
import {
  // Core Scheduler
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
  unstable_shouldYield as shouldYield,
  // Priority levels
  unstable_NormalPriority as NormalPriority,
} from "scheduler";
import { fibersToDelete, performUnitOfWork } from "./reconciler";

let nextUnitOfWork: Fiber | null = null;
let currentRoot: Fiber | null = null;
let workInProgressRoot: Fiber | null = null;
let isRendering = false;

// Scheduler
let scheduledTask: any = null;
let isWorkLoopRunning = false;

// Hoook Management
const pendingEffects: { fiber: Fiber; hookIndex: number }[] = [];
const pendingCleanups: (() => void)[] = [];

/**
 * Starts the work loop for rendering a whole tree (initial or on prop change).
 */
export function setWorkInProgress(
  element: ZeroactNode,
  container: HTMLElement
): void {
  if (isWorkLoopRunning) return; // Prevent concurrent renders

  workInProgressRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
    type: undefined,
    child: null,
    sibling: null,
    return: null,
    stateHooks: [],
    effectHooks: [],
    hookIndex: 0,
  };
  fibersToDelete.length = 0; // Reset deletion queue
  nextUnitOfWork = workInProgressRoot;
  startWorkLoop(NormalPriority);
}
/**
 * Schedules a re-render from the root when state changes
 */
export function scheduleUpdate() {
  if (isRendering || !currentRoot) return;

  const rootElement = currentRoot.props.children[0];
  if (rootElement) {
    setWorkInProgress(rootElement, currentRoot.dom as HTMLElement);
  }
}
/**
 * Starts the work loop with the given priority.
 */
function startWorkLoop(priority = NormalPriority) {
  if (scheduledTask !== null) cancelCallback(scheduledTask);

  scheduledTask = scheduleCallback(priority, performWork);
}
/**
 * Performs the work loop, processing fibers until completion or yielding.
 */
function performWork(didTimeout: boolean): void {
  isWorkLoopRunning = true;

  try {
    // Work until we should yield or finish
    while (nextUnitOfWork && !shouldYield()) {
      try {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      } catch (error) {
        console.error("Error during unit of work:", error);
        nextUnitOfWork = null; // Stop processing on error
      }
    }

    // check if we're done or need to continue
    if (!nextUnitOfWork && workInProgressRoot) {
      // work is complete, commit the changes
      commitRoot();
      isWorkLoopRunning = false;
      scheduledTask = null;
      return; // no more work to do
    } else if (nextUnitOfWork) {
      // More work to do - schedule continuation
      scheduledTask = scheduleCallback(NormalPriority, performWork);
      return;
    }

    scheduledTask = null; // Reset task if no more work
    isWorkLoopRunning = false;
  } catch (error) {
    console.error("Error in work loop:", error);
    isWorkLoopRunning = false;
    scheduledTask = null;
  }
}
/**
 * Commits the entire work in progress tree.
 */
function commitRoot(): void {
  // Process deletions first
  fibersToDelete.forEach(commitWork);

  if (workInProgressRoot?.child) {
    commitWork(workInProgressRoot.child);
    scheduleCallback(NormalPriority, flushPendingEffects);
  }

  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
  isRendering = false;
  fibersToDelete.length = 0; // Clear deletion queue
}
/**
 * Commits a fiber and its subtree to the real DOM - FIXED VERSION
 */
export function commitWork(fiber: Fiber | null): void {
  if (!fiber) return;

  let domParentFiber = fiber.return;
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.return || null;
  }
  const domParent = domParentFiber?.dom;

  if (fiber.effectTag === "SKIP") {
    // Skip processing this fiber, but still process its children
    commitWork(fiber.child || null);
    commitWork(fiber.sibling || null);
    return;
  }
  if (fiber.effectTag === "PLACEMENT" && fiber.dom && domParent) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    updateDom(
      fiber.dom as HTMLElement | Text,
      fiber.alternate?.props || {},
      fiber.props
    );
  } else if (fiber.effectTag === "DELETION" && domParent) {
    cleanupEffects(fiber);
    commitDeletion(fiber, domParent);
    return; // Don't process children of deleted fibers
  }

  // Collect effects
  if (
    (fiber.effectTag === "PLACEMENT" || fiber.effectTag === "UPDATE") &&
    fiber.type &&
    typeof fiber.type === "function"
  ) {
    const hooks = fiber.effectHooks ?? [];
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      if (!hook || !hook.isDirty) continue;

      if (typeof hook.cleanup === "function") {
        pendingCleanups.push(hook.cleanup);
      }

      if (typeof hook.effect === "function") {
        pendingEffects.push({ fiber, hookIndex: i }); // ✅ use `i` as hookIndex
      }
    }
  }

  commitWork(fiber.child || null);
  commitWork(fiber.sibling || null);
}
/**
 * Removes a fiber and all its children from the DOM.
 */
function commitDeletion(
  fiber: Fiber,
  domParent: HTMLElement | SVGElement | Text
): void {
  // Cleanup refs
  if (fiber.props?.ref) {
    if (typeof fiber.props.ref === "function") fiber.props.ref(null);
    else if (
      typeof fiber.props.ref === "object" &&
      "current" in fiber.props.ref
    )
      (fiber.props.ref as any).current = null;
  }

  if (fiber.dom) {
    try {
      domParent.removeChild(fiber.dom);
    } catch (error) {
      console.warn("Could not remove DOM node:", error);
    }
  } else if (fiber.child) {
    commitDeletion(fiber.child, domParent);
  }

  // Also check siblings for function components that don't have DOM nodes
  if (fiber.sibling) {
    commitDeletion(fiber.sibling, domParent);
  }
}
/**
 * This function will flush all pending effects and cleanups
 */
function flushPendingEffects(): void {
  for (const cleanup of pendingCleanups) {
    try {
      cleanup();
    } catch (err) {
      console.error("Error in cleanup:", err);
    }
  }

  for (const { fiber, hookIndex } of pendingEffects) {
    const hook = fiber.effectHooks?.[hookIndex];
    if (!hook) continue;

    try {
      const cleanup = hook.effect(); // ✅ Call effect
      if (typeof cleanup === "function") {
        hook.cleanup = cleanup; // ✅ Store returned cleanup
      } else {
        hook.cleanup = undefined;
      }
    } catch (err) {
      console.error("Error in effect:", err);
    }
  }

  pendingEffects.length = 0;
  pendingCleanups.length = 0;
}
