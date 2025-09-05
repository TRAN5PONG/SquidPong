/**
 * Updates a DOM node with the given props.
 */

const BOOLEAN_ATTRIBUTES = new Set([
  "disabled",
  "checked",
  "selected",
  "hidden",
  "readonly",
  "required",
  "autofocus",
  "autoplay",
  "controls",
  "defer",
  "multiple",
  "open",
]);

export function updateDom(
  dom: HTMLElement | SVGElement | Text,
  prevProps: any,
  nextProps: any
): void {
  const isEvent = (key: string) => key.startsWith("on");
  const isProperty = (key: string) =>
    key !== "children" && !isEvent(key) && key !== "key";

  // Handle only if dom is an Element (skip Text nodes)
  if (dom instanceof Element) {
    // Remove old properties that are no longer present
    Object.keys(prevProps)
      .filter(isProperty)
      .filter((key) => !(key in nextProps))
      .forEach((name) => {
        if (name === "className") {
          dom.removeAttribute("class");
        } else if (name === "style") {
          // Clear all inline styles when style prop is removed
          (dom as HTMLElement).style.cssText = "";
        } else {
          dom.removeAttribute(name);
        }
      });

    // Set new or changed properties
    Object.keys(nextProps)
      .filter(isProperty)
      .filter((key) => prevProps[key] !== nextProps[key])
      .forEach((name) => {
        const value = nextProps[name];

        if (name === "className") {
          dom.setAttribute("class", value || "");
        } 
        else if (name === "style") {
          if (typeof value === "object" && value !== null) {
            // Handle style object
            const htmlElement = dom as HTMLElement;
            
            // Clear previous styles that are no longer present
            if (prevProps.style && typeof prevProps.style === "object") {
              Object.keys(prevProps.style).forEach((styleName) => {
                if (!(styleName in value)) {
                  htmlElement.style[styleName as any] = "";
                }
              });
            }
            
            // Set new styles
            Object.keys(value).forEach((styleName) => {
              const styleValue = value[styleName];
              if (styleValue !== undefined && styleValue !== null) {
                // Convert camelCase to kebab-case for CSS properties if needed
                // Most modern browsers handle camelCase directly, but this ensures compatibility
                htmlElement.style[styleName as any] = String(styleValue);
              } else {
                htmlElement.style[styleName as any] = "";
              }
            });
          } else if (typeof value === "string") {
            // Handle style string
            (dom as HTMLElement).style.cssText = value;
          } else {
            // Clear styles if value is null/undefined
            (dom as HTMLElement).style.cssText = "";
          }
        }       
        else if (BOOLEAN_ATTRIBUTES.has(name)) {
          if (value) {
            dom.setAttribute(name, "");
          } else {
            dom.removeAttribute(name);
          }
        } else {
          // Handle other attributes
          if (value === null || value === undefined || value === false) {
            dom.removeAttribute(name);
          } else {
            dom.setAttribute(name, String(value));
          }
        }
      });

    // Handle event listeners
    Object.keys(prevProps)
      .filter(isEvent)
      .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        if (prevProps[name]) {
          dom.removeEventListener(eventType, prevProps[name]);
        }
      });

    Object.keys(nextProps)
      .filter(isEvent)
      .filter((key) => prevProps[key] !== nextProps[key])
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        if (nextProps[name]) {
          dom.addEventListener(eventType, nextProps[name]);
        }
      });
  }

  // Handle refs
  const prevRef = prevProps?.ref;
  const nextRef = nextProps?.ref;

  if (prevRef !== nextRef) {
    // Clear previous ref
    if (prevRef) {
      if (typeof prevRef === "function") {
        prevRef(null);
      } else if (typeof prevRef === "object" && prevRef !== null && "current" in prevRef) {
        prevRef.current = null;
      }
    }

    // Set the new ref
    if (nextRef) {
      if (typeof nextRef === "function") {
        nextRef(dom);
      } else if (typeof nextRef === "object" && nextRef !== null && "current" in nextRef) {
        nextRef.current = dom;
      }
    }
  }

  // Handle text content separately
  if (dom instanceof Text && nextProps?.nodeValue !== undefined) {
    dom.nodeValue = nextProps.nodeValue;
  }
}