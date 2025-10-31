import { createDom } from "../dom/createDom";
import { PrepareCallbacksForFiber } from "../hooks/useCallback";
import { handleContextProvider, PrepareContextsForFiber } from "../hooks/useContext";
import { PrepareEffectsForFiber } from "../hooks/useEffect";
import { PrepareRefsForFiber } from "../hooks/useRef";
import { PrepareHooksForFiber } from "../hooks/useState";
import { Fiber, ZeroactNode } from "../types";

export let fibersToDelete: Fiber[] = [];
export function resetFibersToDelete(): void {
  fibersToDelete.length = 0;
}
export function addFiberToDelete(fiber: Fiber): void {
  fibersToDelete.push(fiber);
}

/**
 * Children reconciliation algorithm
 */
export function reconcileChildren(
  wipFiber: Fiber,
  elements: ZeroactNode[]
): void {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
	const element = elements[index];
	let newFiber: Fiber | null = null;

	const sameType =
	  oldFiber &&
	  element &&
	  typeof element === "object" &&
	  "type" in element &&
	  element.type === oldFiber.type &&
	  // Key comparison - treat undefined/null keys as the same
	  (element.props as any)?.key === (oldFiber.props as any)?.key;

	if (
	  sameType &&
	  oldFiber &&
	  element &&
	  typeof element === "object" &&
	  "type" in element
	) {
	  // UPDATE the existing fiber
	  newFiber = {
		type: oldFiber.type,
		props: element.props,
		dom: oldFiber.dom,
		return: wipFiber,
		child: null,
		sibling: null,
		alternate: oldFiber,
		effectTag: hasPropsChanged(oldFiber.props, element.props)
		  ? "UPDATE"
		  : "SKIP",
		stateHooks: oldFiber.stateHooks || [],
		effectHooks: oldFiber.effectHooks || [],
		refHooks: oldFiber.refHooks || [],
		callbackHooks: oldFiber.callbackHooks || [],
		contextHooks: oldFiber.contextHooks || [],
		hookIndex: 0,
	  };
	}

	if (element && !sameType) {
	  // CREATE a new fiber
	  const isValidElement =
		typeof element === "object" && element && "type" in element;
	  if (isValidElement) {
		newFiber = {
		  type: element.type,
		  props: element.props,
		  dom: null,
		  return: wipFiber,
		  child: null,
		  sibling: null,
		  alternate: null,
		  effectTag: "PLACEMENT",
		  stateHooks: [],
		  effectHooks: [],
		  refHooks: [],
		  callbackHooks: [],
		  contextHooks: [],
		  hookIndex: 0,
		};
	  }
	}

	if (oldFiber && !sameType) {
	  // DELETE the old fiber
	  oldFiber.effectTag = "DELETION";
	  fibersToDelete.push(oldFiber);
	}

	if (oldFiber) {
	  oldFiber = oldFiber.sibling;
	}

	if (index === 0) {
	  wipFiber.child = newFiber;
	} else if (prevSibling && newFiber) {
	  prevSibling.sibling = newFiber;
	}

	if (newFiber) {
	  prevSibling = newFiber;
	}
	index++;
  }
}
/**
 * this function is to compare oldProps and newProps
 */
function hasPropsChanged(oldProps: any, newProps: any): boolean {
  // Handle edge cases
  if (oldProps === newProps) return false;
  if (!oldProps || !newProps) return true;

  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  if (oldKeys.length !== newKeys.length) return true;

  return oldKeys.some((key) => {
	// This only does shallow comparison - objects will always be "different"
	return oldProps[key] !== newProps[key];
  });
}
/**
 * Processes a single fiber
 */
export function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = fiber.type && typeof fiber.type === "function";
  const isContextProvider = fiber.type === "CONTEXT_PROVIDER";

  if (isFunctionComponent || isContextProvider) {
	updateFunctionComponent(fiber);
  } else {
	updateHostComponent(fiber);
  }

  // Depth-first traversal
  if (fiber.child) return fiber.child;

  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
	if (nextFiber.sibling) return nextFiber.sibling;
	nextFiber = nextFiber.return || null;
  }
  return null;
}
/**
 * Handles fiber for a function component (calls render with hooks enabled).
 */
function updateFunctionComponent(fiber: Fiber): void {
  // Preserve existing hooks from alternate or initialize new ones
  fiber.stateHooks = fiber.alternate?.stateHooks || [];
  fiber.effectHooks = fiber.alternate?.effectHooks || [];
  fiber.refHooks = fiber.alternate?.refHooks || [];
  fiber.callbackHooks = fiber.alternate?.callbackHooks || [];
  fiber.contextHooks = fiber.alternate?.contextHooks || [];
  fiber.hookIndex = 0;

  if (fiber.type === "CONTEXT_PROVIDER") {
	handleContextProvider(fiber);
	reconcileChildren(fiber, fiber.props.children);
	return; // Skip further processing for context providers
  }

  // Prepare hooks for this fiber
  PrepareHooksForFiber(fiber);
  PrepareEffectsForFiber(fiber);
  PrepareRefsForFiber(fiber);
  PrepareCallbacksForFiber(fiber);
  PrepareContextsForFiber(fiber);

  try {
	const children = [(fiber.type as FunctionComponent)(fiber.props)];
	reconcileChildren(fiber, children);
  } catch (error) {
	console.error("Error in function component:", error);
  }
}
/**
 * Handles fiber for a host/native (e.g. DIV, SPAN) element.
 */
function updateHostComponent(fiber: Fiber): void {
  if (!fiber.dom) {
	fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}