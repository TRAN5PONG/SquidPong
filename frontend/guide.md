[X]- use react scheduler package intead of requeatIdleCallback (if that would add a differance to my app)
[X]- fix Effect System (useEffect and Cleanup) as the original implementation
	- effect system currently runs effects deeply during commit;
	- should batches them and separates cleanups and effects clearly.
[X]- fix the  Effect Tag Naming ( i guess that skip additional tag would be helpfull somewhere)
	- i currently use "PLACEMENT", "UPDATE", "DELETION"
	- i should add "SKIP" tag to avoid re-rendering of the component
[ ]- fix my Entire tree is re-rendered from root on every update
    - current scheduler always re-renders from the root.
	- i should tracks changed components and only, enabling partial updates
[ ]- fix Fiber Tree Manipulation and otimize it as the original
	-diffing is monolithic and tightly coupled.
	- i should splits responsibilities (DOM diffing, hook handling, child creation).
	- use keys for stable identification of components
	- Track old fibers in a map for fast lookup.
	- Handle reuse, updates, deletions, and insertions independently.
	- Manage alternate, isAlternate, and version to track fiber history and determine change status.
	- Build siblings only after a child is attached — keep sibling-linking clean and efficient.
[ ]- fix Commit Phase Behavior
	-Separate mutation (DOM changes) and effect execution.
	-First walk the fiber tree to perform DOM additions, updates, and deletions, Then execute collected afterCommit functions (e.g., appendChild, removeChild) for newly mounted trees.
	- Ensure delete is handled first to remove stale DOM nodes early.
	- Track the fiber that needs to be inserted deeply and decide whether to batch it (e.g., mount a whole subtree).
[ ]- fix Granularity of Updates
	-When a component's state updates, trace its fiber up to the nearest common ancestor or root.
	-Render and diff only the subtree under that fiber.
	-Use skip tags to prevent re-diffing and committing unaffected children.
	-Optimize commitWork so it doesn't descend into children unnecessarily.
	-Consider memoization or shallow-prop comparison to avoid even scheduling a component update when props are the same.