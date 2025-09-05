// src/lib/Zeroact/dom/createDom.ts
import { Fiber } from '../types';
import { updateDom } from './updateDom';

/**
 * Creates a DOM node from a fiber.
 */
export function createDom(fiber: Fiber): HTMLElement | Text | SVGElement {
  const isTextElement = fiber.type === "TEXT_ELEMENT";
  
  // Check if this element should be created in SVG namespace
  // Either it's an svg element itself, or its parent is in SVG context
  const isSvgElement = fiber.type === "svg" || fiber.return?.isSvg;

  const dom = isTextElement
    ? document.createTextNode(fiber.props.nodeValue)
    : isSvgElement
      ? document.createElementNS("http://www.w3.org/2000/svg", fiber.type as string)
      : document.createElement(fiber.type as string);

  // Set Ref
  if (fiber.props.ref && dom instanceof HTMLElement) {
    if (typeof fiber.props.ref === 'function') {
      fiber.props.ref(dom);
    }
    else if (typeof fiber.props.ref === 'object' && 'current' in fiber.props.ref) {
      // If the ref is an object, set its current property to the DOM element
      fiber.props.ref.current = dom;
    }
  }

  // Set the isSvg flag for this fiber so children can inherit it
  fiber.isSvg = isSvgElement;
  
  updateDom(dom as HTMLElement, {}, fiber.props);
  return dom;
}