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
    //
    // 🧹 Remove old properties
    //
    Object.keys(prevProps)
      .filter(isProperty)
      .filter((key) => !(key in nextProps))
      .forEach((name) => {
        if (name === "className") {
          dom.removeAttribute("class");
        } else if (name === "style") {
          (dom as HTMLElement).style.cssText = "";
        } else {
          dom.removeAttribute(name);
        }
      });

    //
    // 🧩 Set new or changed properties
    //
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
            const htmlElement = dom as HTMLElement;

            // Remove old styles not in new style
            if (prevProps.style && typeof prevProps.style === "object") {
              Object.keys(prevProps.style).forEach((styleName) => {
                if (!(styleName in value)) {
                  htmlElement.style[styleName as any] = "";
                }
              });
            }

            // Apply new styles
            Object.keys(value).forEach((styleName) => {
              const styleValue = value[styleName];
              if (styleValue !== undefined && styleValue !== null) {
                htmlElement.style[styleName as any] = String(styleValue);
              } else {
                htmlElement.style[styleName as any] = "";
              }
            });
          } else if (typeof value === "string") {
            (dom as HTMLElement).style.cssText = value;
          } else {
            (dom as HTMLElement).style.cssText = "";
          }
        } 
        else if (BOOLEAN_ATTRIBUTES.has(name)) {
          if (value) dom.setAttribute(name, "");
          else dom.removeAttribute(name);
        } 
        else {
          if (value === null || value === undefined || value === false) {
            dom.removeAttribute(name);
          } else {
            dom.setAttribute(name, String(value));
          }
        }
      });

    //
    // ⚙️ Handle event listeners (React-style)
    //
    const getEventType = (name: string): string => {
      let eventType = name.toLowerCase().substring(2);

      // React-style mapping: onChange → input for text fields
      if (
        eventType === "change" &&
        (dom instanceof HTMLInputElement || dom instanceof HTMLTextAreaElement)
      ) {
        eventType = "input";
      }

      return eventType;
    };

    // Remove old or changed event listeners
    Object.keys(prevProps)
      .filter(isEvent)
      .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
      .forEach((name) => {
        const eventType = getEventType(name);
        if (prevProps[name]) {
          dom.removeEventListener(eventType, prevProps[name]);
        }
      });

    // Add new or updated event listeners
    Object.keys(nextProps)
      .filter(isEvent)
      .filter((key) => prevProps[key] !== nextProps[key])
      .forEach((name) => {
        const eventType = getEventType(name);
        if (nextProps[name]) {
          dom.addEventListener(eventType, nextProps[name]);
        }
      });
  }

  //
  // 🪞 Handle refs
  //
  const prevRef = prevProps?.ref;
  const nextRef = nextProps?.ref;

  if (prevRef !== nextRef) {
    // Clear previous ref
    if (prevRef) {
      if (typeof prevRef === "function") {
        prevRef(null);
      } else if (typeof prevRef === "object" && "current" in prevRef) {
        prevRef.current = null;
      }
    }

    // Set new ref
    if (nextRef) {
      if (typeof nextRef === "function") {
        nextRef(dom);
      } else if (typeof nextRef === "object" && "current" in nextRef) {
        nextRef.current = dom;
      }
    }
  }

  //
  // 🧵 Handle text content
  //
  if (dom instanceof Text && nextProps?.nodeValue !== undefined) {
    dom.nodeValue = nextProps.nodeValue;
  }
}
